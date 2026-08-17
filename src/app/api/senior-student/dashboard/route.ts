import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { route } from '@/lib/api-middleware'
import { GED_SUBJECTS, GED_READY_MASTERY, masteryToGEDScore } from '@/lib/constants/ged'

export const GET = route({ auth: 'SENIOR_STUDENT' }, async (_req, { user }) => {
  let senior = await prisma.seniorStudent.findUnique({
    where: { userId: user.id },
    include: {
      gedSubjectProgress: true,
      certificates: { orderBy: { awardedAt: 'desc' } },
      courseEnrollments: { include: { course: { include: { _count: { select: { lessons: true } } } } } },
    },
  })

  if (!senior) {
    senior = await prisma.seniorStudent.create({
      data: { userId: user.id },
      include: {
        gedSubjectProgress: true,
        certificates: true,
        courseEnrollments: { include: { course: { include: { _count: { select: { lessons: true } } } } } },
      },
    })
  }

  // Total lessons per GED subject (from the seeded curriculum)
  const subjects = await Promise.all(
    GED_SUBJECTS.map(async (subject) => {
      const curriculum = await prisma.curriculum.findFirst({
        where: { type: 'GED', subject, grade: 'Adult' },
        include: { strands: { include: { substrands: { include: { _count: { select: { lessons: true } } } } } } },
      })
      const totalLessons = (curriculum?.strands ?? []).reduce(
        (sum, s) => sum + (s.substrands ?? []).reduce((s2, ss) => s2 + (ss._count?.lessons ?? 0), 0),
        0,
      )
      const progress = senior.gedSubjectProgress.find((p) => p.subject === subject)
      const completedLessons = progress?.completedLessons ?? 0
      const mastery = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0
      const isReady = mastery >= GED_READY_MASTERY
      return {
        subject,
        completedLessons,
        totalLessons,
        mastery,
        isReady,
        practiceScore: progress?.practiceScore ?? null,
        gedScore: masteryToGEDScore(mastery),
      }
    })
  )

  const allReady = GED_SUBJECTS.every((s) => subjects.find((x) => x.subject === s)?.isReady)

  // Sync derived mastery / readiness back to the profile rows (best-effort)
  await Promise.all(
    subjects.map((s) =>
      prisma.gEDSubjectProgress.upsert({
        where: { seniorStudentId_subject: { seniorStudentId: senior.id, subject: s.subject } },
        update: { totalLessons: s.totalLessons, mastery: s.mastery, isReady: s.isReady },
        create: {
          seniorStudentId: senior.id,
          subject: s.subject,
          totalLessons: s.totalLessons,
          mastery: s.mastery,
          isReady: s.isReady,
        },
      }).catch(() => null)
    )
  )

  const certificate = senior.certificates[0] ?? null

  return NextResponse.json({
    senior: {
      id: senior.id,
      name: user.name,
      email: user.email,
      ageBracket: senior.ageBracket,
      priorEducation: senior.priorEducation,
      englishLevel: senior.englishLevel,
      goals: senior.goals,
      selectedGEDSubjects: senior.selectedGEDSubjects,
      isGEDReady: senior.isGEDReady,
    },
    gedSubjects: subjects,
    allReady,
    certificate: certificate
      ? {
          id: certificate.id,
          certNumber: certificate.certNumber,
          awardedAt: certificate.awardedAt,
          subjectScores: certificate.subjectScores,
          pdfUrl: certificate.pdfUrl,
        }
      : null,
    courses: senior.courseEnrollments.map((e) => ({
      id: e.course.id,
      title: e.course.title,
      description: e.course.description,
      type: e.course.type,
      duration: e.course.duration,
      progress: e.progress,
      status: e.status,
      lessonCount: e.course._count?.lessons ?? 0,
    })),
  })
})
