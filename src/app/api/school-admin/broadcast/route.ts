import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { route } from '@/lib/api-middleware'

export const POST = route({ auth: 'SCHOOL_ADMIN' }, async (req, { user }) => {
  const admin = await prisma.schoolAdmin.findUnique({ where: { userId: user.id } })
  if (!admin) return NextResponse.json({ error: 'Not authorized' }, { status: 403 })

  const { title, message, targetRole, targetGrade, priority } = await req.json()
  if (!title || !message) return NextResponse.json({ error: 'Title and message required' }, { status: 400 })

  let recipientUserIds: string[] = []

  if (targetRole === 'ALL') {
    const teachers = await prisma.teacher.findMany({ where: { schoolId: admin.schoolId }, select: { userId: true } })
    const students = await prisma.student.findMany({ where: { schoolId: admin.schoolId }, select: { userId: true } })
    const parents = await prisma.parent.findMany({ where: { schoolId: admin.schoolId }, include: { user: { select: { id: true } } } })
    recipientUserIds = [...teachers.map(t => t.userId), ...students.map(s => s.userId), ...parents.map(p => p.user.id)]
  } else if (targetRole === 'TEACHERS') {
    const where: any = { schoolId: admin.schoolId }
    if (targetGrade) where.gradeLevels = { has: targetGrade }
    const teachers = await prisma.teacher.findMany({ where, select: { userId: true } })
    recipientUserIds = teachers.map(t => t.userId)
  } else if (targetRole === 'STUDENTS') {
    const where: any = { schoolId: admin.schoolId }
    if (targetGrade) where.class = { grade: targetGrade }
    const students = await prisma.student.findMany({ where, select: { userId: true } })
    recipientUserIds = students.map(s => s.userId)
  } else if (targetRole === 'PARENTS') {
    if (targetGrade) {
      const students = await prisma.student.findMany({ where: { schoolId: admin.schoolId, class: { grade: targetGrade } }, select: { userId: true } })
      const parentStudents = await prisma.parentStudent.findMany({ where: { studentId: { in: students.map(s => s.userId) } }, include: { parent: { include: { user: { select: { id: true } } } } } })
      recipientUserIds = [...new Set(parentStudents.map(ps => ps.parent.user.id))]
    } else {
      const parents = await prisma.parent.findMany({ where: { schoolId: admin.schoolId }, include: { user: { select: { id: true } } } })
      recipientUserIds = parents.map(p => p.user.id)
    }
  }

  const created = await Promise.all(
    recipientUserIds.map(userId =>
      (prisma as any).notification.create({
        data: {
          title: `${priority === 'URGENT' ? 'URGENT: ' : ''}${title}`, message,
          type: priority === 'URGENT' ? 'urgent' : 'announcement', userId,
          senderId: user.id, targetRole: targetRole || 'ALL', schoolId: admin.schoolId,
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
