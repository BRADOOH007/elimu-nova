import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { route } from '@/lib/api-middleware'

export const GET = route({ auth: 'SCHOOL_ADMIN' }, async (req, { user }) => {
  const schoolAdmin = await prisma.schoolAdmin.findUnique({
    where: { userId: user.id }
  })

    if (!schoolAdmin) {
      console.error('School admin not found for user:', user.id)
      return NextResponse.json({ error: 'School admin not found' }, { status: 404 })
    }

    console.log('School admin found:', schoolAdmin.schoolId)

    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const type = searchParams.get('type') || ''
    const search = searchParams.get('search') || ''
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {
      schoolId: schoolAdmin.schoolId
    }

    if (type && type !== 'all') {
      where.type = type
    }

    // Add search functionality
    if (search) {
      where.OR = [
        { action: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ]
    }

    // Get activities with pagination
    const [activities, total] = await Promise.all([
      prisma.activity.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          [sortBy]: sortOrder
        },
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
              role: true
            }
          }
        }
      }).catch((error) => {
        console.error('Error fetching activities:', error)
        return []
      }),
      prisma.activity.count({ where }).catch((error) => {
        console.error('Error counting activities:', error)
        return 0
      })
    ])

    const formattedActivities = activities.map(activity => ({
      id: activity.id,
      type: activity.type,
      action: activity.action,
      description: activity.description,
      metadata: activity.metadata,
      user: activity.user ? {
        name: `${activity.user.firstName} ${activity.user.lastName}`,
        email: activity.user.email,
        role: activity.user.role
      } : null,
      createdAt: activity.createdAt
    }))

    return NextResponse.json({
      activities: formattedActivities,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
})

export const POST = route({ auth: 'SCHOOL_ADMIN' }, async (req, { user }) => {
  const schoolAdmin = await prisma.schoolAdmin.findUnique({
    where: { userId: user.id }
  })

    if (!schoolAdmin) {
      return NextResponse.json({ error: 'School admin not found' }, { status: 404 })
    }

    const body = await req.json()
    const { type, action, description, metadata } = body

    // Validate required fields
    if (!type || !action || !description) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Create activity
    const activity = await prisma.activity.create({
      data: {
        schoolId: schoolAdmin.schoolId,
        userId: user.id,
        type,
        action,
        description,
        metadata: metadata || null
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            role: true
          }
        }
      }
    })

    const activityUser = activity.user!
    return NextResponse.json({
      message: 'Activity created successfully',
      activity: {
        id: activity.id,
        type: activity.type,
        action: activity.action,
        description: activity.description,
        metadata: activity.metadata,
        user: {
          name: `${activityUser.firstName} ${activityUser.lastName}`,
          email: activityUser.email,
          role: activityUser.role
        },
        createdAt: activity.createdAt
      }
    }, { status: 201 })
})
