import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { COMPREHENSIVE_SUBJECTS } from '@/lib/subjects'
import { route } from '@/lib/api-middleware'

export const GET = route({}, async (req, { user }) => {
  const [lessonPlanSubjects, schemeSubjects] = await Promise.all([
    prisma.lessonPlan.findMany({
      select: { subject: true },
      distinct: ['subject']
    }),
    prisma.schemeOfWork.findMany({
      select: { subject: true },
      distinct: ['subject']
    })
  ])

  const allSubjects = new Set([
    ...lessonPlanSubjects.map(lp => lp.subject),
    ...schemeSubjects.map(sw => sw.subject)
  ])

  let subjects = Array.from(allSubjects).filter(Boolean).sort()

  if (subjects.length === 0) {
    subjects = COMPREHENSIVE_SUBJECTS
  }

  return NextResponse.json({ subjects })
})
