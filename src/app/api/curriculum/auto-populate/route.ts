import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurriculumType } from '@/lib/curriculum-type-map'

import { route, apiLogger } from '@/lib/api-middleware'
const log = apiLogger('curriculum/auto-populate')

export const POST = route({ skipSubscriptionCheck: true }, async (req, { user, params }) => {
  try {

    const { grade, subject, term, curriculum } = await req.json()
    if (!grade || !subject) {
      return NextResponse.json({ error: 'grade and subject are required' }, { status: 400 })
    }

    // Be tolerant of grade/subject formatting — mirrors deterministic-curriculum.ts
    // DB stores grade as "Grade 4" and subject as "Mathematics Activities", but UI may send "4" / "Mathematics"
    const normGrade = (() => {
      const g = String(grade).trim()
      if (/^\d+$/.test(g)) return `Grade ${g}`
      if (/^grade\s*\d+$/i.test(g)) return g.replace(/grade\s*/i, 'Grade ')
      return g
    })()
    const curriculumType = getCurriculumType(curriculum)
    // First try exact match (fast path)
    let where: any = { type: curriculumType, grade: normGrade, subject: { contains: subject, mode: 'insensitive' }, isActive: true }
    if (term !== undefined) where.term = term

    let curriculums = await prisma.curriculum.findMany({
      where,
      select: { id: true, term: true },
      orderBy: { term: 'asc' },
    })
    // Fallback: try without type filter (handles OTHER/CBC mismatch) and looser grade
    if (curriculums.length === 0) {
      const fallbackWhere: any = { grade: normGrade, subject: { contains: subject, mode: 'insensitive' }, isActive: true }
      if (term !== undefined) fallbackWhere.term = term
      curriculums = await prisma.curriculum.findMany({
        where: fallbackWhere,
        select: { id: true, term: true },
        orderBy: { term: 'asc' },
      })
    }
    // Last fallback: strip " Activities" suffix from subject and retry
    if (curriculums.length === 0 && /activities/i.test(subject)) {
      const baseSubject = subject.replace(/\s*activities\s*/i, '').trim()
      const retryWhere: any = { grade: normGrade, subject: { contains: baseSubject, mode: 'insensitive' }, isActive: true }
      if (term !== undefined) retryWhere.term = term
      curriculums = await prisma.curriculum.findMany({
        where: retryWhere,
        select: { id: true, term: true },
        orderBy: { term: 'asc' },
      })
    }
    // Fallback: caller supplied a term but DB curriculum rows store term=null, so the
    // term filter matches nothing. Drop the term filter and retry the same grade/subject
    // so real DB topics load instead of silently falling back to local suggestions.
    if (curriculums.length === 0 && term !== undefined) {
      const noTermWhere: any = { grade: normGrade, subject: { contains: subject, mode: 'insensitive' }, isActive: true }
      curriculums = await prisma.curriculum.findMany({
        where: noTermWhere,
        select: { id: true, term: true },
        orderBy: { term: 'asc' },
      })
    }

    if (curriculums.length === 0) {
      return NextResponse.json({
        topics: [],
        message: `No curriculum data found for ${grade} ${subject}`,
      })
    }

    const strands = await prisma.curriculumStrand.findMany({
      where: { curriculumId: { in: curriculums.map(c => c.id) } },
      include: {
        substrands: {
          select: { id: true, name: true, learningOutcomes: true, activities: true, order: true },
          orderBy: { order: 'asc' },
        },
      },
      orderBy: { order: 'asc' },
    })

    const topics = strands.map(strand => ({
      strandName: strand.name,
      substrands: strand.substrands.map(sub => ({
        id: sub.id,
        name: sub.name,
        learningOutcomes: sub.learningOutcomes,
        activities: sub.activities,
      })),
    }))

    return NextResponse.json({
      topics,
      totalTopics: topics.length,
      curriculumCount: curriculums.length,
      message: `Loaded ${topics.length} topics for ${grade} ${subject}`,
    })
  } catch (error) {
    log.error('Error auto-populating curriculum:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }

})
