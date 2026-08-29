import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurriculumType } from '@/lib/curriculum-type-map'

import { route, apiLogger } from '@/lib/api-middleware'
const log = apiLogger('curriculum/subjects')

export const GET = route({}, async (req, { user, params }) => {
  try {

    const { searchParams } = new URL(req.url)
    const grade = searchParams.get('grade')
    const term = searchParams.get('term') ? parseInt(searchParams.get('term')!) : undefined
    const curriculum = searchParams.get('curriculum')

    const where: any = { type: getCurriculumType(curriculum), isActive: true }
    if (grade) where.grade = grade
    if (term !== undefined) where.term = term

    const curriculums = await prisma.curriculum.findMany({
      where,
      select: { subject: true, grade: true, term: true },
      distinct: ['subject'],
      orderBy: { subject: 'asc' },
    })

    const subjects = curriculums.map(c => c.subject)

    return NextResponse.json({ subjects, total: subjects.length })
  } catch (error) {
    log.error('Error fetching curriculum subjects:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }

})
