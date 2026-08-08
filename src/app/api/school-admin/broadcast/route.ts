import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { route } from '@/lib/api-middleware'

export const POST = route({ auth: 'SCHOOL_ADMIN' }, async (req, { user }) => {
  const admin = await prisma.schoolAdmin.findUnique({ where: { userId: user.id } })
  if (!admin) return NextResponse.json({ error: 'Not authorized' }, { status: 403 })

  const { title, message, targetRole, targetGrade } = await req.json()
  if (!title || !message) return NextResponse.json({ error: 'Title and message required' }, { status: 400 })

  // Determine recipients based on targeting
  let recipientUserIds: string[] = []

  if (targetRole === 'ALL') {
    // Broadcast to all teachers + students in the school
    const teachers = await prisma.teacher.findMany({ where: { schoolId: admin.schoolId }, select: { userId: true } })
    const students = await prisma.student.findMany({ where: { schoolId: admin.schoolId }, select: { userId: true } })
    recipientUserIds = [...teachers.map(t => t.userId), ...students.map(s => s.userId)]
  } else if (targetRole === 'TEACHERS') {
    if (targetGrade) {
      const teachers = await prisma.teacher.findMany({ where: { schoolId: admin.schoolId, gradeLevels: { has: targetGrade } }, select: { userId: true } })
      recipientUserIds = teachers.map(t => t.userId)
    } else {
      const teachers = await prisma.teacher.findMany({ where: { schoolId: admin.schoolId }, select: { userId: true } })
      recipientUserIds = teachers.map(t => t.userId)
    }
  } else if (targetRole === 'STUDENTS') {
    const students = await prisma.student.findMany({
      where: { schoolId: admin.schoolId, ...(targetGrade ? { class: { grade: targetGrade } } : {}) },
      select: { userId: true },
    })
    recipientUserIds = students.map(s => s.userId)
  }

  // Create notifications for all recipients
  const created = await Promise.all(
    recipientUserIds.map(userId =>
      (prisma as any).notification.create({
        data: {
          title: `ADMIN: ${title}`, message, type: 'announcement', userId, senderId: user.id,
          targetRole: targetRole || 'ALL', schoolId: admin.schoolId,
        },
      })
    )
  )

  return NextResponse.json({ sent: created.length, targetCount: recipientUserIds.length })
})

export const GET = route({ auth: 'SCHOOL_ADMIN' }, async (req, { user }) => {
  const admin = await prisma.schoolAdmin.findUnique({ where: { userId: user.id } })
  if (!admin) return NextResponse.json({ error: 'Not authorized' }, { status: 403 })

  const notifications = await (prisma as any).notification.findMany({
    where: { senderId: user.id },
    orderBy: { createdAt: 'desc' },
    take: 50,
    include: { sender: { select: { firstName: true, lastName: true } } },
  })

  return NextResponse.json({
    messages: notifications.map((n: any) => ({
      id: n.id, title: n.title, message: n.message, type: n.type,
      targetRole: n.targetRole, createdAt: n.createdAt,
      sender: n.sender ? `${n.sender.firstName} ${n.sender.lastName}` : 'System',
    })),
  })
})
