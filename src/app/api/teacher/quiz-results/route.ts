import { NextResponse } from 'next/server'
import { prisma, withRetry } from '@/lib/prisma'
import { route } from '@/lib/api-middleware'

export const GET = route({ auth: 'TEACHER' }, async (req, { user }) => {
  const { searchParams } = new URL(req.url)
  const studentId = searchParams.get('studentId')
  const limit = parseInt(searchParams.get('limit') || '20', 10)

  const teacher = await withRetry(() => prisma.teacher.findUnique({ where: { userId: user.id }, select: { id: true } }))
  if (!teacher) return NextResponse.json({ error: 'Teacher not found' }, { status: 404 })

  const where: any = {}

  if (studentId) {
    const student = await prisma.student.findFirst({
      where: { id: studentId, teacherId: teacher.id, deletedAt: null },
      select: { userId: true },
    })
    if (!student) return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    where.userId = student.userId
  } else {
    const studentUserIds = await prisma.student.findMany({
      where: { teacherId: teacher.id, deletedAt: null },
      select: { userId: true },
    })
    where.userId = { in: studentUserIds.map(s => s.userId) }
  }

  const quizResults = await prisma.quizResult.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: limit,
  })

  return NextResponse.json({ quizResults })
})
