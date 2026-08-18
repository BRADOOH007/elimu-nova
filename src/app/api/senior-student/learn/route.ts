import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { route } from '@/lib/api-middleware'
import { GED_SUBJECTS } from '@/lib/constants/ged'

export const GET = route({ auth: 'SENIOR_STUDENT' }, async (_req, { user }) => {
  let senior = await prisma.seniorStudent.findUnique({ where: { userId: user.id } })
  if (!senior) {
    senior = await prisma.seniorStudent.create({ data: { userId: user.id } })
  }

  // Full GED curriculum tree for the four subjects
  const subjects = await Promise.all(
    GED_SUBJECTS.map(async (subject) => {
      const curriculum = await prisma.curriculum.findFirst({
        where: { type: 'GED', subject, grade: 'Adult' },
        include: {
          strands: {
            orderBy: { order: 'asc' },
            include: {
              substrands: {
                orderBy: { order: 'asc' },
                include: { lessons: { orderBy: { order: 'asc' } } },
              },
            },
          },
        },
      })
      return {
        subject,
        description: curriculum?.description ?? null,
        curriculumId: curriculum?.id ?? null,
        strands: (curriculum?.strands ?? []).map((s) => ({
          id: s.id,
          name: s.name,
          description: s.description,
          substrands: s.substrands.map((ss) => ({
            id: ss.id,
            name: ss.name,
            description: ss.description,
            learningOutcomes: ss.learningOutcomes,
            lessons: ss.lessons.map((l) => ({
              id: l.id,
              title: l.title,
              objectives: l.objectives,
              content: l.content,
              duration: l.duration,
            })),
          })),
        })),
      }
    })
  )

  // Adult essential-skills courses + enrollment state
  const adultTypes = [
    'ADULT_COMPUTER_LITERACY',
    'ADULT_AI_LITERACY',
    'ADULT_FINANCIAL_LITERACY',
    'ADULT_WORKPLACE_READINESS',
    'ADULT_ESL',
  ]
  const courses = await prisma.course.findMany({
    where: { type: { in: adultTypes as any } },
    include: { _count: { select: { lessons: true } } },
    orderBy: { title: 'asc' },
  })
  const enrollments = await prisma.seniorCourseEnrollment.findMany({
    where: { seniorStudentId: senior.id },
  })

  const courseList = courses.map((c) => {
    const enrollment = enrollments.find((e) => e.courseId === c.id)
    return {
      id: c.id,
      title: c.title,
      description: c.description,
      type: c.type,
      difficulty: c.difficulty,
      duration: c.duration,
      objectives: c.objectives,
      lessonCount: c._count?.lessons ?? 0,
      enrolled: !!enrollment,
      progress: enrollment?.progress ?? 0,
      status: enrollment?.status ?? null,
    }
  })

  return NextResponse.json({ subjects, courses: courseList })
})
