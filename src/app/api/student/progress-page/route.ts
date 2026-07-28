import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { route } from '@/lib/api-middleware'

export const GET = route({ auth: 'STUDENT' }, async (request, { user }) => {
  const student = await prisma.student.findUnique({
    where: { userId: user.id },
    select: { id: true, classId: true }
  })

  if (!student) {
    return NextResponse.json({ error: 'Student not found' }, { status: 404 })
  }

  const progressRecords = await prisma.studentProgress.findMany({
    where: { studentId: student.id, classId: student.classId ?? undefined },
    include: { skillMastery: true },
    orderBy: { updatedAt: 'desc' }
  })

  const totalXP = progressRecords.reduce((sum, p) => sum + p.xp, 0)
  const totalQuestions = progressRecords.reduce((sum, p) => sum + p.totalQuestions, 0)
  const correctAnswers = progressRecords.reduce((sum, p) => sum + p.correctAnswers, 0)

  const now = new Date()
  let streak = 0
  const dayStrings = new Set(
    progressRecords
      .filter(p => p.lastPracticedAt)
      .map(p => p.lastPracticedAt!.toDateString())
  )
  for (let i = 0; i < 365; i++) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    if (dayStrings.has(d.toDateString())) {
      streak++
    } else {
      break
    }
  }

  const latestProgress = progressRecords[0]
  const consecutiveCorrect = latestProgress?.consecutiveCorrect ?? 0

  const skills = progressRecords.flatMap(p =>
    p.skillMastery.map(s => ({
      name: s.skillName,
      mastery: s.masteryScore,
      category: s.skillCategory
    }))
  )

  const topics = progressRecords.map(p => ({
    name: p.topic,
    mastery: p.masteryScore,
    subject: p.subject
  }))

  return NextResponse.json({
    xp: totalXP,
    streak,
    consecutiveCorrect,
    totalQuestions,
    correctAnswers,
    skills,
    topics
  })
})
