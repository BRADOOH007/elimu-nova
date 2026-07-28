import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

import { route, apiLogger } from '@/lib/api-middleware'
const log = apiLogger('curriculum/auto-populate')

export const POST = route({ auth: 'SUPER_ADMIN' }, async (req, { user, params }) => {
  try {

    const { grade, subject, term } = await req.json()
    if (!grade || !subject) {
      return NextResponse.json({ error: 'grade and subject are required' }, { status: 400 })
    }

    const where: any = { type: 'CBC', grade, subject, isActive: true }
    if (term !== undefined) where.term = term

    const curriculums = await prisma.curriculum.findMany({
      where,
      select: { id: true, term: true },
      orderBy: { term: 'asc' },
    })

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
