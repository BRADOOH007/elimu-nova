import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

import { route, apiLogger } from '@/lib/api-middleware'
const log = apiLogger('curriculum/substrands')

export const GET = route({}, async (req, { user, params }) => {
  try {

    const { searchParams } = new URL(req.url)
    const strandId = searchParams.get('strandId')

    if (!strandId) {
      return NextResponse.json({ error: 'strandId is required' }, { status: 400 })
    }

    const substrands = await prisma.curriculumSubstrand.findMany({
      where: { strandId },
      select: {
        id: true,
        name: true,
        learningOutcomes: true,
        activities: true,
        order: true,
      },
      orderBy: { order: 'asc' },
    })

    return NextResponse.json({ substrands, total: substrands.length })
  } catch (error) {
    log.error('Error fetching curriculum substrands:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }

})
