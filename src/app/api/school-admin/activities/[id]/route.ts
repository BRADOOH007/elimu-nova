import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { route } from '@/lib/api-middleware'

export const GET = route({ auth: 'SCHOOL_ADMIN' }, async (req, { user, params }) => {
  const schoolAdmin = await prisma.schoolAdmin.findUnique({
    where: { userId: user.id }
  })

    if (!schoolAdmin) {
      return NextResponse.json({ error: 'School admin not found' }, { status: 404 })
    }

    const { id } = await params

    // Get activity
    const activity = await prisma.activity.findFirst({
      where: {
        id,
        schoolId: schoolAdmin.schoolId
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

    if (!activity) {
      return NextResponse.json({ error: 'Activity not found' }, { status: 404 })
    }

    return NextResponse.json({
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
    })
})

export const PUT = route({ auth: 'SCHOOL_ADMIN' }, async (req, { user, params }) => {
  const schoolAdmin = await prisma.schoolAdmin.findUnique({
    where: { userId: user.id }
  })

    if (!schoolAdmin) {
      return NextResponse.json({ error: 'School admin not found' }, { status: 404 })
    }

    const { id } = await params
    const body = await req.json()
    const { type, action, description, metadata } = body

    // Validate required fields
    if (!type || !action || !description) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if activity exists and belongs to school
    const existingActivity = await prisma.activity.findFirst({
      where: {
        id,
        schoolId: schoolAdmin.schoolId
      }
    })

    if (!existingActivity) {
      return NextResponse.json({ error: 'Activity not found' }, { status: 404 })
    }

    // Update activity
    const activity = await prisma.activity.update({
      where: { id },
      data: {
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

    return NextResponse.json({
      message: 'Activity updated successfully',
      activity: {
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
      }
    })
})

export const DELETE = route({ auth: 'SCHOOL_ADMIN' }, async (req, { user, params }) => {
  const schoolAdmin = await prisma.schoolAdmin.findUnique({
    where: { userId: user.id }
  })

    if (!schoolAdmin) {
      return NextResponse.json({ error: 'School admin not found' }, { status: 404 })
    }

    const { id } = await params

    // Check if activity exists and belongs to school
    const existingActivity = await prisma.activity.findFirst({
      where: {
        id,
        schoolId: schoolAdmin.schoolId
      }
    })

    if (!existingActivity) {
      return NextResponse.json({ error: 'Activity not found' }, { status: 404 })
    }

    // Delete activity
    await prisma.activity.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Activity deleted successfully' })
})
