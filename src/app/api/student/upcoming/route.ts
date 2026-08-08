import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { route } from '@/lib/api-middleware'

export const GET = route({}, async (req, { user }) => {
  try {
    const student = await prisma.student.findUnique({
      where: { userId: user.id },
      select: { id: true, classId: true, schoolId: true }
    })
    if (!student) return NextResponse.json([])

    const now = new Date()
    const [schedules, assignments] = await Promise.all([
      prisma.schedule.findMany({
        where: {
          status: { in: ['SCHEDULED', 'IN_PROGRESS'] },
          startTime: { gte: now },
          OR: [
            ...(student.classId ? [{ classId: student.classId }] : []),
            { classId: null, schoolId: student.schoolId || undefined },
          ],
        },
        include: { teacher: { include: { user: true } } },
        orderBy: { startTime: 'asc' },
        take: 5,
      }),
      prisma.assignment.findMany({
        where: {
          dueDate: { gte: now },
          students: { some: { id: student.id } },
        },
        orderBy: { dueDate: 'asc' },
        take: 3,
      }),
    ])

    const events: Array<{ id: string; type: string; title: string; subject: string; teacherName: string; startTime: string; endTime: string; dueDate: string }> = []

    for (const s of schedules) {
      events.push({
        id: s.id,
        type: s.type === 'CLASS' && s.status === 'IN_PROGRESS' ? 'live' : 'class',
        title: s.title,
        subject: s.subject || '',
        teacherName: `${s.teacher?.user?.firstName || ''} ${s.teacher?.user?.lastName || ''}`.trim(),
        startTime: s.startTime.toISOString(),
        endTime: s.endTime.toISOString(),
        dueDate: '',
      })
    }

    for (const a of assignments) {
      events.push({
        id: a.id,
        type: (a.status as string).toLowerCase() === 'overdue' ? 'overdue' : 'assignment',
        title: a.title,
        subject: a.subject || '',
        teacherName: '',
        startTime: '',
        endTime: '',
        dueDate: a.dueDate.toISOString(),
      })
    }

    events.sort((a, b) => new Date(a.startTime || a.dueDate).getTime() - new Date(b.startTime || b.dueDate).getTime())
    return NextResponse.json(events.slice(0, 4))
  } catch { return NextResponse.json([]) }
})
