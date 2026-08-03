import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { route } from '@/lib/api-middleware'

// Kenya standard school term structure
function getKenyaTermDefaults(year: number) {
  return [
    {
      term: 1,
      termName: 'Term 1',
      startDate: new Date(year, 0, 5), // ~Jan 5 (first Monday area)
      endDate: new Date(year, 3, 4),   // ~April 4 (before Easter)
      weeksCount: 13,
      breaks: [{ name: 'Half-term', start: new Date(year, 1, 23), end: new Date(year, 1, 27) }],
      holidays: [
        { name: "New Year's Day", date: new Date(year, 0, 1) },
      ],
      isOpening: true,
    },
    {
      term: 2,
      termName: 'Term 2',
      startDate: new Date(year, 3, 28), // ~April 28 (after Easter)
      endDate: new Date(year, 6, 25),   // ~July 25
      weeksCount: 13,
      breaks: [{ name: 'Half-term', start: new Date(year, 5, 2), end: new Date(year, 5, 6) }],
      holidays: [
        { name: 'Labour Day', date: new Date(year, 4, 1) },
        { name: 'Madaraka Day', date: new Date(year, 5, 1) },
      ],
      isOpening: false,
    },
    {
      term: 3,
      termName: 'Term 3',
      startDate: new Date(year, 8, 2), // ~Sept 2
      endDate: new Date(year, 10, 1),  // ~Nov 1 (before exams for 8-4-4)
      weeksCount: 11,
      breaks: [{ name: 'Half-term', start: new Date(year, 9, 13), end: new Date(year, 9, 17) }],
      holidays: [
        { name: "Heroes' Day", date: new Date(year, 9, 20) },
        { name: 'Jamhuri Day', date: new Date(year, 11, 12) },
        { name: 'Christmas', date: new Date(year, 11, 25) },
        { name: 'Boxing Day', date: new Date(year, 11, 26) },
      ],
      isOpening: false,
    },
  ]
}

// GET — fetch academic calendar for a school/year; auto-create defaults if none exist
export const GET = route({ skipSubscriptionCheck: true }, async (req, { user }) => {
  const { searchParams } = new URL(req.url)
  const year = searchParams.get('year') ? parseInt(searchParams.get('year')!) : new Date().getFullYear()

  // Get schoolId from user
  let schoolId = ''
  if (user.role === 'SCHOOL_ADMIN') {
    const admin = await prisma.schoolAdmin.findUnique({ where: { userId: user.id } })
    schoolId = admin?.schoolId || ''
  } else if (user.role === 'TEACHER') {
    const teacher = await prisma.teacher.findUnique({ where: { userId: user.id } })
    schoolId = teacher?.schoolId || ''
  } else if (user.role === 'STUDENT') {
    const student = await prisma.student.findUnique({ where: { userId: user.id } })
    schoolId = student?.schoolId || ''
  } else if (user.role === 'PARENT') {
    const parent = await prisma.parent.findUnique({ where: { userId: user.id } })
    schoolId = parent?.schoolId || ''
  }

  if (!schoolId) return NextResponse.json({ terms: [] })

  let terms = await prisma.academicCalendar.findMany({
    where: { schoolId, year },
    orderBy: { term: 'asc' },
  })

  // Auto-create default Kenya term structure if no calendar exists for this year
  if (terms.length === 0) {
    const defaults = getKenyaTermDefaults(year)
    for (const d of defaults) {
      await prisma.academicCalendar.upsert({
        where: {
          schoolId_year_term: { schoolId, year, term: d.term },
        },
        create: {
          schoolId,
          year,
          term: d.term,
          termName: d.termName,
          startDate: d.startDate,
          endDate: d.endDate,
          weeksCount: d.weeksCount,
          breaks: d.breaks,
          holidays: d.holidays,
          isOpening: d.isOpening,
        },
        update: {},
      })
    }
    terms = await prisma.academicCalendar.findMany({
      where: { schoolId, year },
      orderBy: { term: 'asc' },
    })
  }

  // Auto-detect current term based on today's date
  const today = new Date()
  const currentTerm = terms.find(t => today >= t.startDate && today <= t.endDate)

  return NextResponse.json({ terms, currentTermId: currentTerm?.id || null, year })
})

// POST — create/update academic calendar for a school year
export const POST = route({ auth: 'SCHOOL_ADMIN', skipSubscriptionCheck: true }, async (req, { user }) => {
  const admin = await prisma.schoolAdmin.findUnique({ where: { userId: user.id } })
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const { year, terms } = await req.json()
  if (!year || !terms || !Array.isArray(terms)) {
    return NextResponse.json({ error: 'year and terms array required' }, { status: 400 })
  }

  const results = []
  for (const term of terms) {
    const upsert = await prisma.academicCalendar.upsert({
      where: {
        schoolId_year_term: {
          schoolId: admin.schoolId,
          year,
          term: term.term,
        },
      },
      create: {
        schoolId: admin.schoolId,
        year,
        term: term.term,
        termName: term.termName || `Term ${term.term}`,
        startDate: new Date(term.startDate),
        endDate: new Date(term.endDate),
        weeksCount: term.weeksCount || 13,
        breaks: term.breaks || [],
        holidays: term.holidays || [],
        isOpening: term.isOpening || false,
      },
      update: {
        termName: term.termName || `Term ${term.term}`,
        startDate: new Date(term.startDate),
        endDate: new Date(term.endDate),
        weeksCount: term.weeksCount || 13,
        breaks: term.breaks || [],
        holidays: term.holidays || [],
        isOpening: term.isOpening || false,
      },
    })
    results.push(upsert)
  }

  return NextResponse.json({ terms: results })
})
