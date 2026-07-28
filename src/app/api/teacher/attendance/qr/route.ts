import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { route } from '@/lib/api-middleware'
import { cache } from '@/lib/redis'

function generateToken(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let token = ''
  for (let i = 0; i < 6; i++) {
    token += chars[Math.floor(Math.random() * chars.length)]
  }
  return token
}

export const POST = route({ auth: 'TEACHER' }, async (req, { user }) => {
  const { searchParams } = new URL(req.url)
  const classId = searchParams.get('classId')

  if (!classId) {
    return NextResponse.json({ error: 'classId is required' }, { status: 400 })
  }

  const teacher = await prisma.teacher.findUnique({
    where: { userId: user.id },
    select: { id: true },
  })
  if (!teacher) {
    return NextResponse.json({ error: 'Teacher not found' }, { status: 404 })
  }

  const token = generateToken()
  const payload = JSON.stringify({ classId, teacherId: teacher.id, createdAt: Date.now() })
  await cache.set(`qr:${token}`, payload, 300)

  return NextResponse.json({ token, expiresIn: 300 })
})

export const GET = route({ auth: 'TEACHER' }, async (req, { user }) => {
  const { searchParams } = new URL(req.url)
  const token = searchParams.get('token')
  const studentId = searchParams.get('studentId')

  if (!token || !studentId) {
    return NextResponse.json({ error: 'token and studentId are required' }, { status: 400 })
  }

  const payload = await cache.get(`qr:${token}`)
  if (!payload) {
    return NextResponse.json({ error: 'Invalid or expired token' }, { status: 410 })
  }

  const { classId, teacherId } = JSON.parse(payload)

  const teacher = await prisma.teacher.findUnique({
    where: { userId: user.id },
    select: { id: true, schoolId: true },
  })
  if (!teacher || teacher.id !== teacherId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const student = await prisma.student.findUnique({
    where: { id: studentId },
    select: { id: true, classId: true, user: { select: { firstName: true, lastName: true } } },
  })
  if (!student) {
    return NextResponse.json({ error: 'Student not found' }, { status: 404 })
  }
  if (student.classId !== classId) {
    return NextResponse.json({ error: 'Student does not belong to this class' }, { status: 403 })
  }

  if (!teacher.schoolId) {
    await cache.del(`qr:${token}`)
    return NextResponse.json({
      marked: true,
      student: `${student.user.firstName} ${student.user.lastName}`,
    })
  }

  const weekStart = new Date()
  weekStart.setHours(0, 0, 0, 0)
  const dayOfWeek = weekStart.getDay()
  weekStart.setDate(weekStart.getDate() - dayOfWeek)

  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekEnd.getDate() + 7)

  const existing = await prisma.schedule.findFirst({
    where: {
      teacherId: teacher.id,
      classId,
      type: 'OTHER',
      title: { startsWith: 'ATTENDANCE:' },
      startTime: { gte: weekStart, lt: weekEnd },
    },
  })

  if (existing) {
    const attendance = (existing.metadata as any) || {}
    attendance[student.id] = { present: true, markedAt: new Date().toISOString() }
    await prisma.schedule.update({
      where: { id: existing.id },
      data: { metadata: attendance },
    })
  } else {
    await prisma.schedule.create({
      data: {
        schoolId: teacher.schoolId,
        teacherId: teacher.id,
        classId,
        title: `ATTENDANCE: Week of ${weekStart.toLocaleDateString()}`,
        startTime: weekStart,
        endTime: weekEnd,
        type: 'OTHER',
        status: 'SCHEDULED',
        metadata: { [student.id]: { present: true, markedAt: new Date().toISOString() } },
      },
    })
  }

  await cache.del(`qr:${token}`)

  return NextResponse.json({
    marked: true,
    student: `${student.user.firstName} ${student.user.lastName}`,
  })
})
