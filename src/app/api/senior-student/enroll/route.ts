import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { route } from '@/lib/api-middleware'
import { z } from 'zod'

const schema = z.object({ courseId: z.string() })

export const POST = route({ auth: 'SENIOR_STUDENT', schema }, async (_req, { user, body }) => {
  const { courseId } = body as z.infer<typeof schema>

  const course = await prisma.course.findUnique({ where: { id: courseId } })
  if (!course) return NextResponse.json({ error: 'Course not found' }, { status: 404 })

  let senior = await prisma.seniorStudent.findUnique({ where: { userId: user.id } })
  if (!senior) senior = await prisma.seniorStudent.create({ data: { userId: user.id } })

  const enrollment = await prisma.seniorCourseEnrollment.upsert({
    where: { seniorStudentId_courseId: { seniorStudentId: senior.id, courseId } },
    update: { status: 'ACTIVE' },
    create: { seniorStudentId: senior.id, courseId },
  })

  return NextResponse.json({ enrolled: true, enrollmentId: enrollment.id })
})
