import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { route, apiLogger } from '@/lib/api-middleware'

const log = apiLogger('teacher/activity-log')

export const dynamic = 'force-dynamic'

export const GET = route({ auth: 'TEACHER' }, async (req, { user }) => {
  try {
    const teacher = await prisma.teacher.findUnique({
      where: { userId: user.id },
      select: { id: true, schoolId: true }
    })

    if (!teacher) {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 })
    }

    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search') || ''

    const where: any = {
      schoolId: teacher.schoolId,
      userId: user.id,
    }

    if (search) {
      where.OR = [
        { action: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [activities, total] = await Promise.all([
      prisma.activity.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.activity.count({ where }),
    ])

    return NextResponse.json({
      activities,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    log.error('Error fetching activity log:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
})
