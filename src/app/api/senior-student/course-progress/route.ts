import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { route } from '@/lib/api-middleware'
import { z } from 'zod'

const schema = z.object({ courseId: z.string(), lessonId: z.string() })

export const POST = route({ auth: 'SENIOR_STUDENT', schema }, async (_req, { user, body }) => {
  const { courseId, lessonId } = body as z.infer<typeof schema>

  let senior = await prisma.seniorStudent.findUnique({ where: { userId: user.id } })
  if (!senior) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

  const enrollment = await prisma.seniorCourseEnrollment.findUnique({
    where: { seniorStudentId_courseId: { seniorStudentId: senior.id, courseId } },
  })
  if (!enrollment) return NextResponse.json({ error: 'Not enrolled' }, { status: 404 })

  const totalLessons = await prisma.courseLesson.count({ where: { courseId } })
  const ids = enrollment.completedLessonIds ?? []
  const nextIds = ids.includes(lessonId) ? ids : [...ids, lessonId]
  const progress = totalLessons > 0 ? Math.min(100, Math.round((nextIds.length / totalLessons) * 100)) : 0

  await prisma.seniorCourseEnrollment.update({
    where: { id: enrollment.id },
    data: {
      completedLessonIds: nextIds,
      progress,
      status: progress >= 100 ? 'COMPLETED' : 'ACTIVE',
    },
  })

  return NextResponse.json({ courseId, progress, completed: progress >= 100 })
})
