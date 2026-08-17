import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { route } from '@/lib/api-middleware'
import { z } from 'zod'
import { GED_SUBJECTS, GED_READY_MASTERY } from '@/lib/constants/ged'

const schema = z.object({
  subject: z.string(),
  lessonId: z.string(),
})

export const POST = route({ auth: 'SENIOR_STUDENT', schema }, async (_req, { user, body }) => {
  const { subject, lessonId } = body as z.infer<typeof schema>

  if (!GED_SUBJECTS.includes(subject as any)) {
    return NextResponse.json({ error: 'Unknown GED subject' }, { status: 400 })
  }

  let senior = await prisma.seniorStudent.findUnique({ where: { userId: user.id } })
  if (!senior) senior = await prisma.seniorStudent.create({ data: { userId: user.id } })

  const curriculum = await prisma.curriculum.findFirst({
    where: { type: 'GED', subject, grade: 'Adult' },
    include: { strands: { include: { substrands: { include: { _count: { select: { lessons: true } } } } } } },
  })
  const totalLessons = (curriculum?.strands ?? []).reduce(
    (sum, s) => sum + (s.substrands ?? []).reduce((s2, ss) => s2 + (ss._count?.lessons ?? 0), 0),
    0,
  )

  const existing = await prisma.gEDSubjectProgress.findUnique({
    where: { seniorStudentId_subject: { seniorStudentId: senior.id, subject } },
  })
  const ids = existing?.completedLessonIds ?? []
  const nextIds = ids.includes(lessonId) ? ids : [...ids, lessonId]
  const completedLessons = Math.min(nextIds.length, totalLessons || nextIds.length)
  const mastery = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0
  const isReady = mastery >= GED_READY_MASTERY

  const progress = await prisma.gEDSubjectProgress.upsert({
    where: { seniorStudentId_subject: { seniorStudentId: senior.id, subject } },
    update: {
      completedLessonIds: nextIds,
      completedLessons,
      totalLessons,
      mastery,
      isReady,
    },
    create: {
      seniorStudentId: senior.id,
      subject,
      completedLessonIds: nextIds,
      completedLessons,
      totalLessons,
      mastery,
      isReady,
    },
  })

  return NextResponse.json({ subject, completedLessons, totalLessons, mastery, isReady, gedScore: 100 + mastery })
})
