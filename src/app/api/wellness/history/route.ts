import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { mentalHealthService } from '@/lib/mental-health-checkin'
import { route } from '@/lib/api-middleware'

export const GET = route({ auth: ['STUDENT', 'TEACHER', 'PARENT'] }, async (req, { user }) => {
  const { searchParams } = new URL(req.url)
  const limit = parseInt(searchParams.get('limit') || '10')

  let studentId = searchParams.get('studentId')
  if (!studentId && user.role === 'STUDENT') {
    const student = await prisma.student.findUnique({ where: { userId: user.id } })
    if (!student) return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    studentId = student.id
  }

  if (!studentId) return NextResponse.json({ error: 'studentId required' }, { status: 400 })
  const history = await mentalHealthService.getStudentHistory(studentId, limit)
  return NextResponse.json({ history })
})
