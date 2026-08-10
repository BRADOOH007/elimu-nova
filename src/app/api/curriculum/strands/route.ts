import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

import { route, apiLogger } from '@/lib/api-middleware'
const log = apiLogger('curriculum/strands')

export const GET = route({}, async (req, { user, params }) => {
  try {

    const { searchParams } = new URL(req.url)
    const grade = searchParams.get('grade')
    const subject = searchParams.get('subject')
    const curriculum = searchParams.get('curriculum') || 'cbc'
    const term = searchParams.get('term') ? parseInt(searchParams.get('term')!) : undefined

    if (!grade || !subject) {
      return NextResponse.json({ error: 'grade and subject are required' }, { status: 400 })
    }

    const curriculumType = curriculum === 'cbc' ? 'CBC' : 'OTHER'
    const where: any = { type: curriculumType, grade, subject: { contains: subject, mode: 'insensitive' }, isActive: true }
    if (term !== undefined) where.term = term

    const curriculums = await prisma.curriculum.findMany({
      where,
      select: { id: true },
    })

    if (curriculums.length === 0) {
      return NextResponse.json({ strands: [], total: 0 })
    }

    const strands = await prisma.curriculumStrand.findMany({
      where: { curriculumId: { in: curriculums.map(c => c.id) } },
      select: {
        id: true,
        name: true,
        order: true,
        substrands: {
          select: { id: true, name: true, description: true, learningOutcomes: true, order: true },
          orderBy: { order: 'asc' },
        },
      },
      orderBy: { order: 'asc' },
    })

    return NextResponse.json({ strands, total: strands.length })
  } catch (error) {
    log.error('Error fetching curriculum strands:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }

})
