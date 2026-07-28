import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { route } from '@/lib/api-middleware'

export const GET = route({ auth: 'TEACHER' }, async (req, { user }) => {
  const { searchParams } = new URL(req.url)
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '10')
  const type = searchParams.get('type')
  const skip = (page - 1) * limit

  const teacher = await prisma.teacher.findFirst({
    where: { userId: user.id },
    include: { user: true }
  })

  if (!teacher) {
    return NextResponse.json({ error: 'Teacher not found' }, { status: 404 })
  }

  const where: any = {
    schoolId: teacher.schoolId,
    userId: user.id
  }

  if (type) {
    where.type = type
  }

  const [activities, totalCount] = await Promise.all([
    prisma.activity.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      }
    }),
    prisma.activity.count({ where })
  ])

  return NextResponse.json({
    activities: activities.map(activity => ({
      id: activity.id,
      type: activity.type,
      action: activity.action,
      description: activity.description,
      metadata: activity.metadata,
      createdAt: activity.createdAt,
      user: activity.user ? `${activity.user.firstName} ${activity.user.lastName}` : 'System'
    })),
    pagination: {
      page,
      limit,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
      hasNext: page * limit < totalCount,
      hasPrev: page > 1
    }
  })
})

export const POST = route({ auth: 'TEACHER' }, async (req, { user }) => {
  const body = await req.json()
  const { type, action, description, metadata } = body

  const teacher = await prisma.teacher.findFirst({
    where: { userId: user.id }
  })

  if (!teacher) {
    return NextResponse.json({ error: 'Teacher not found' }, { status: 404 })
  }

  const activity = await prisma.activity.create({
    data: {
      schoolId: teacher.schoolId || undefined,
      userId: user.id,
      type,
      action,
      description,
      metadata: metadata as any
    } as any,
    include: {
      user: {
        select: {
          firstName: true,
          lastName: true
        }
      }
    }
  })

  const activityAny = activity as any
  return NextResponse.json({
    activity: {
      id: activity.id,
      type: activity.type,
      action: activity.action,
      description: activity.description,
      metadata: activity.metadata,
      createdAt: activity.createdAt,
      user: activityAny.user ? `${activityAny.user.firstName} ${activityAny.user.lastName}` : 'System'
    }
  })
})
