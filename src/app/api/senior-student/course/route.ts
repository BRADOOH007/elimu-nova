import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { route } from '@/lib/api-middleware'

// Returns a single course with its lessons (content included) and the senior
// student's completion state for each lesson.
export const GET = route({ auth: 'SENIOR_STUDENT' }, async (req, { user }) => {
  const { searchParams } = new URL(req.url)
  const courseId = searchParams.get('courseId')

  if (!courseId) {
    return NextResponse.json({ error: 'courseId is required' }, { status: 400 })
  }

  let senior = await prisma.seniorStudent.findUnique({ where: { userId: user.id } })
  if (!senior) senior = await prisma.seniorStudent.create({ data: { userId: user.id } })

  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: { lessons: { orderBy: { order: 'asc' } } },
  })
  if (!course) return NextResponse.json({ error: 'Course not found' }, { status: 404 })

  const enrollment = await prisma.seniorCourseEnrollment.findUnique({
    where: { seniorStudentId_courseId: { seniorStudentId: senior.id, courseId } },
  })

  const completedIds = enrollment?.completedLessonIds ?? []

  return NextResponse.json({
    course: {
      id: course.id,
      title: course.title,
      description: course.description,
      type: course.type,
      duration: course.duration,
      objectives: course.objectives,
    },
    enrollment: enrollment
      ? { progress: enrollment.progress, status: enrollment.status }
      : null,
    lessons: course.lessons.map((l) => ({
      id: l.id,
      title: l.title,
      description: l.description,
      content: l.content,
      duration: l.duration,
      completed: completedIds.includes(l.id),
    })),
  })
})
