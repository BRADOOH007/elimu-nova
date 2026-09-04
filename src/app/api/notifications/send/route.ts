import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { checkRateLimit, getClientIdentifier, rateLimitAuth } from '@/lib/rate-limit'
import { emitNewNotification } from '@/lib/notification-events'
import { route } from '@/lib/api-middleware'

export const POST = route({}, async (req, { user }) => {

    const rl = await checkRateLimit(`notif-send:${user.id}`, { maxRequests: 30, windowMs: 60000, keyPrefix: 'ratelimit:notif' })
    if (!rl.allowed) {
      return NextResponse.json({ error: 'Too many notifications sent. Try again later.' }, { status: 429 })
    }

    const body = await req.json()
    const {
      title,
      message,
      type,
      expiresAt, // optional ISO datetime; banner stops showing after this
      target: {
        userIds = [], // Specific users to notify
        roles = [],   // Roles to notify (e.g., ["STUDENT", "PARENT"])
        schoolId      // School to scope the notification (for school admins)
      } = {}
    } = body

    if (!title || !message || !type) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Validate expiresAt if provided
    let expiresAtDate: Date | null = null
    if (expiresAt) {
      const d = new Date(expiresAt)
      if (isNaN(d.getTime())) {
        return NextResponse.json({ error: 'Invalid expiresAt date' }, { status: 400 })
      }
      expiresAtDate = d
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
      if (user.role === 'SUPER_ADMIN') {
        const allUsers = await prisma.user.findMany({
          where: { isActive: true },
          select: { id: true }
        })
        targetUserIds = allUsers.map(u => u.id)
      } else if (user.role === 'SCHOOL_ADMIN') {
        // Get school admin's school
        const schoolAdmin = await prisma.schoolAdmin.findUnique({
          where: { userId: user.id },
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
      } else if (user.role === 'TEACHER') {
        // Get teacher's students and their parents
        const teacher = await prisma.teacher.findUnique({
          where: { userId: user.id },
          include: {
            students: {
              select: {
                id: true,
                userId: true,
                parents: {
                  select: { parentId: true }
                }
              }
            }
          }
        })

        const teacherWithStudents = teacher as any
        if (teacherWithStudents?.students) {
          const studentUserIds = teacherWithStudents.students.map((s: any) => s.userId)
          const parentUserIds = teacherWithStudents.students
            .flatMap((s: any) => s.parents?.map((p: any) => p.parentId) || [])
          targetUserIds = [...new Set([...studentUserIds, ...parentUserIds])]
        }
      }
    }

    // Create notifications for all target users
    if (targetUserIds.length > 0) {
      await prisma.notification.createMany({
        data: targetUserIds.map(userId => ({
          title,
          message,
          type,
          userId,
          senderId: user.id,
          expiresAt: expiresAtDate,
          ...(schoolId && { schoolId })
        }))
      })

      // Push a realtime event so open dashboards refresh instantly.
      for (const targetId of targetUserIds) {
        emitNewNotification(targetId, { title, type })
      }
    }

    return NextResponse.json({
      success: true,
      count: targetUserIds.length
    }, { status: 201 })
})
