import { NextResponse } from 'next/server'
import { route } from '@/lib/api-middleware'
import { getTermScheme, hasTermScheme, saveTermScheme, generateTermScheme } from '@/lib/kicd-content'

/**
 * KICD content — CBC/CBE termly scheme-of-work store & generator.
 *
 *  GET  /api/kicd/scheme?grade=&subject=&term=   → retrieve a saved termly scheme
 *  POST /api/kicd/scheme { grade, subject, term, weeks?, lessonsPerWeek? }
 *      → generate (and save) the KICD termly scheme from curriculum structure
 */
export const GET = route({ auth: ['TEACHER', 'SCHOOL_ADMIN', 'SUPER_ADMIN'], skipSubscriptionCheck: true }, async (req) => {
  const { searchParams } = new URL(req.url)
  const grade = searchParams.get('grade') || ''
  const subject = searchParams.get('subject') || ''
  const term = parseInt(searchParams.get('term') || '0', 10)

  if (!grade || !subject || !term) {
    return NextResponse.json({ error: 'grade, subject and term are required' }, { status: 400 })
  }

  const rows = await getTermScheme(grade, subject, term)
  if (rows.length === 0) {
    return NextResponse.json({ exists: false, rows: [] })
  }
  return NextResponse.json({ exists: true, rows })
})

export const POST = route({ auth: ['TEACHER', 'SCHOOL_ADMIN', 'SUPER_ADMIN'], skipSubscriptionCheck: true }, async (req) => {
  const body = await req.json()
  const { grade, subject, term, weeks, lessonsPerWeek, rows } = body

  if (!grade || !subject || !term) {
    return NextResponse.json({ error: 'grade, subject and term are required' }, { status: 400 })
  }

  // If explicit rows provided (from an imported document / admin upload), save them.
  if (Array.isArray(rows) && rows.length > 0) {
    const normalized = rows.map((r: any) => ({
      grade: r.grade || grade,
      subject: r.subject || subject,
      term: r.term || term,
      week: r.week,
      lesson: r.lesson,
      strand: r.strand || subject,
      subStrand: r.subStrand || 'General',
      learningOutcomes: r.learningOutcomes || [],
      learningExperiences: r.learningExperiences || [],
      keyInquiryQuestions: r.keyInquiryQuestions || [],
      resources: r.resources || [],
      assessment: r.assessment || null,
      values: r.values || [],
      competencies: r.competencies || [],
      source: 'imported',
      sourceUrl: r.sourceUrl || null,
      isVerified: true,
    }))
    if (normalized.every((r: any) => r.week && r.lesson)) {
      const count = await saveTermScheme(normalized)
      return NextResponse.json({ success: true, count, message: 'KICD termly scheme imported' })
    }
  }

  // Otherwise: skip if already generated, else generate + save from curriculum.
  if (await hasTermScheme(grade, subject, term)) {
    const existing = await getTermScheme(grade, subject, term)
    return NextResponse.json({ exists: true, rows: existing, message: 'Scheme already exists' })
  }

  const generated = await generateTermScheme(grade, subject, term, weeks, lessonsPerWeek)
  const count = await saveTermScheme(generated)
  return NextResponse.json({ success: true, count, exists: true, rows: generated, message: 'KICD termly scheme generated' })
})
