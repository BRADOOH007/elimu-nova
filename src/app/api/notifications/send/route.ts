import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      title,
      message,
      type,
      target: {
        userIds = [], // Specific users to notify
        roles = [],   // Roles to notify (e.g., ["STUDENT", "PARENT"])
        schoolId      // School to scope the notification (for school admins)
      } = {}
    } = body

    if (!title || !message || !type) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Determine which users to target
    let targetUserIds: string[] = [...userIds]

    // If roles specified, get all users with those roles
    if (roles.length > 0) {
      const roleUsers = await prisma.user.findMany({
        where: {
          role: { in: roles as any },
          isActive: true,
          ...(schoolId && { // Only include users from specific school if schoolId provided
            OR: [
              { teacher: { schoolId } },
              { student: { schoolId } },
              { schoolAdmin: { schoolId } }
            ]
          })
        },
        select: { id: true }
      })
      
      const roleUserIds = roleUsers.map(u => u.id)
      targetUserIds = [...new Set([...targetUserIds, ...roleUserIds])]
    }

    // If no specific targets and no roles, maybe send to all?
    if (targetUserIds.length === 0 && roles.length === 0) {
      // For super admin: send to all users
      // For school admin: send to all users in their school
      // For teacher: send to their students and parents
      if (session.user.role === 'SUPER_ADMIN') {
        const allUsers = await prisma.user.findMany({
          where: { isActive: true },
          select: { id: true }
        })
        targetUserIds = allUsers.map(u => u.id)
      } else if (session.user.role === 'SCHOOL_ADMIN') {
        // Get school admin's school
        const schoolAdmin = await prisma.schoolAdmin.findUnique({
          where: { userId: session.user.id },
          select: { schoolId: true }
        })
        
        if (schoolAdmin?.schoolId) {
          const schoolUsers = await prisma.user.findMany({
            where: {
              isActive: true,
              OR: [
                { teacher: { schoolId: schoolAdmin.schoolId } },
                { student: { schoolId: schoolAdmin.schoolId } },
                { schoolAdmin: { schoolId: schoolAdmin.schoolId } }
              ]
            },
            select: { id: true }
          })
          targetUserIds = schoolUsers.map(u => u.id)
        }
      } else if (session.user.role === 'TEACHER') {
        // Get teacher's students and their parents
        const teacher = await prisma.teacher.findUnique({
          where: { userId: session.user.id },
          include: {
            students: {
              select: {
                id: true,
                userId: true,
                parent: {
                  select: { parentId: true }
                }
              }
            }
          }
        })

        if (teacher?.students) {
          const studentUserIds = teacher.students.map(s => s.userId)
          const parentUserIds = teacher.students
            .flatMap(s => s.parent?.parentId || [])
          targetUserIds = [...new Set([...studentUserIds, ...parentUserIds])]
        }
      }
    }

    // Create notifications for all target users
    const notifications = await Promise.all(
      targetUserIds.map(userId =>
        prisma.notification.create({
          data: {
            title,
            message,
            type,
            userId,
            senderId: session.user.id,
            ...(schoolId && { schoolId })
          }
        })
      )
    )

    return NextResponse.json({
      success: true,
      count: notifications.length,
      notifications
    }, { status: 201 })

  } catch (error) {
    console.error('Error sending notifications:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
