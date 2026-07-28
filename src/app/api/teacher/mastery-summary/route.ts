import { NextResponse } from 'next/server'
import { prisma, withRetry } from '@/lib/prisma'
import { route } from '@/lib/api-middleware'

export const GET = route({ auth: 'TEACHER' }, async (req, { user }) => {
  const teacher = await prisma.teacher.findUnique({
    where: { userId: user.id },
    include: {
      students: {
        include: {
          user: { select: { id: true, firstName: true, lastName: true } },
          studentProgress: {
            include: { skillMastery: true }
          }
        }
      }
    }
  })

  if (!teacher) {
    return NextResponse.json({ students: [], atRiskStudents: [] })
  }

  const students = teacher.students.map(s => {
    const p = s.studentProgress[0]
    return {
      id: s.id,
      name: `${s.user.firstName} ${s.user.lastName}`,
      masteryScore: p?.masteryScore ?? 0,
      xp: p?.xp ?? 0,
      streak: p?.streak ?? 0,
      totalQuestions: p?.totalQuestions ?? 0,
      correctAnswers: p?.correctAnswers ?? 0,
      lastPracticedAt: p?.lastPracticedAt,
      skills: p?.skillMastery.map(sm => ({
        skillName: sm.skillName,
        skillCategory: sm.skillCategory,
        masteryScore: sm.masteryScore,
        timesTested: sm.timesTested,
        timesCorrect: sm.timesCorrect,
        lastPracticedAt: sm.lastPracticedAt
      })) ?? []
    }
  })

  const atRiskStudents = students.filter(s => s.masteryScore < 40 || (s.totalQuestions > 0 && s.correctAnswers / s.totalQuestions < 0.4))

  return NextResponse.json({ students, atRiskStudents })
})
