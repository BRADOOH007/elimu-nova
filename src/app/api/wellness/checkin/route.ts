import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { mentalHealthService } from '@/lib/mental-health-checkin'
import { route } from '@/lib/api-middleware'

export const GET = route({ auth: ['STUDENT', 'TEACHER', 'PARENT'] }, async () => {
  const questions = await mentalHealthService.getQuestions()
  return NextResponse.json({ questions })
})

export const POST = route({ auth: 'STUDENT' }, async (req, { user }) => {
  const body = await req.json()
  const student = await prisma.student.findUnique({ where: { userId: user.id } })
  if (!student) return NextResponse.json({ error: 'Student record not found' }, { status: 404 })

  const result = await mentalHealthService.submitCheckIn(student.id, { studentId: student.id, ...body })
  return NextResponse.json(result)
})
