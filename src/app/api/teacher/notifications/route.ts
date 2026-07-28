import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { route } from '@/lib/api-middleware'

// GET - Fetch teacher notifications
export const GET = route({ auth: 'TEACHER' }, async (req, { user }) => {
  try {
    const { searchParams } = new URL(req.url)
    const limit = parseInt(searchParams.get('limit') || '20')
    const unreadOnly = searchParams.get('unreadOnly') === 'true'

    // Get teacher profile
    const teacher = await prisma.teacher.findUnique({
      where: { userId: user.id }
    })

    if (!teacher) {
      return NextResponse.json({ error: 'Teacher profile not found' }, { status: 404 })
    }

    // Build where clause
    const whereClause: any = {
      userId: user.id
    }

    if (unreadOnly) {
      whereClause.isRead = false
    }

    const notifications = await prisma.notification.findMany({
      where: whereClause,
      orderBy: {
        createdAt: 'desc'
      },
      take: limit
    })

    return NextResponse.json({
      notifications,
      unreadCount: await prisma.notification.count({
        where: {
          userId: user.id,
          isRead: false
        }
      })
    })

  } catch (error) {
    console.error('Error fetching notifications:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch notifications',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
})

// POST - Create notification
export const POST = route({ auth: 'TEACHER' }, async (req, { user }) => {
  try {
    const body = await req.json()
    const { title, message, type = 'info', studentId } = body

    // Validate required fields
    if (!title || !message) {
      return NextResponse.json({ 
        error: 'Missing required fields: title, message' 
      }, { status: 400 })
    }

    // Get teacher profile
    const teacher = await prisma.teacher.findUnique({
      where: { userId: user.id }
    })

    if (!teacher) {
      return NextResponse.json({ error: 'Teacher profile not found' }, { status: 404 })
    }

    // If studentId is provided, verify the student belongs to this teacher
    if (studentId) {
      const student = await prisma.student.findFirst({
        where: {
          id: studentId,
          teacherId: teacher.id
        }
      })

      if (!student) {
        return NextResponse.json({ 
          error: 'Student not found or not assigned to this teacher' 
        }, { status: 404 })
      }
    }

    // Create notification
    const notification = await prisma.notification.create({
      data: {
        title,
        message,
        type,
        userId: user.id
      }
    })

    return NextResponse.json({
      success: true,
      notification
    }, { status: 201 })

  } catch (error) {
    console.error('Error creating notification:', error)
    return NextResponse.json({ 
      error: 'Failed to create notification',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
})

// PATCH - Mark notification as read
export const PATCH = route({ auth: 'TEACHER' }, async (req, { user }) => {
  try {
    const body = await req.json()
    const { notificationId, markAllAsRead = false } = body

    if (markAllAsRead) {
      // Mark all notifications as read
      await prisma.notification.updateMany({
        where: {
          userId: user.id,
          isRead: false
        },
        data: {
          isRead: true
        }
      })

      return NextResponse.json({
        success: true,
        message: 'All notifications marked as read'
      })
    } else if (notificationId) {
      // Mark specific notification as read
      const notification = await prisma.notification.update({
        where: {
          id: notificationId,
          userId: user.id
        },
        data: {
          isRead: true
        }
      })

      return NextResponse.json({
        success: true,
        notification
      })
    } else {
      return NextResponse.json({ 
        error: 'Missing notificationId or markAllAsRead flag' 
      }, { status: 400 })
    }

  } catch (error) {
    console.error('Error updating notification:', error)
    return NextResponse.json({ 
      error: 'Failed to update notification',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
})
