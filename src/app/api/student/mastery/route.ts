import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { route } from '@/lib/api-middleware'

// GET — fetch mastery data for student
export const GET = route({ auth: 'STUDENT' }, async (request, { user }) => {
  const { searchParams } = new URL(request.url)
  const subject = searchParams.get('subject')

  const student = await prisma.student.findUnique({ where: { userId: user.id } })
  if (!student) return NextResponse.json({ error: 'Student not found' }, { status: 404 })

  const where: any = { studentId: student.id }
  if (subject) where.subject = subject

  const masteries = await prisma.unitMastery.findMany({
    where,
    orderBy: { updatedAt: 'desc' },
  })

  // Calculate overall mastery per subject
  const subjectMastery: Record<string, { total: number; count: number; mastered: number }> = {}
  for (const m of masteries) {
    if (!subjectMastery[m.subject]) subjectMastery[m.subject] = { total: 0, count: 0, mastered: 0 }
    subjectMastery[m.subject].total += m.masteryScore
    subjectMastery[m.subject].count++
    if (m.masteryLevel === 'MASTERED') subjectMastery[m.subject].mastered++
  }

  const subjectSummary = Object.entries(subjectMastery).map(([subj, data]) => ({
    subject: subj,
    averageMastery: data.count > 0 ? Math.round(data.total / data.count) : 0,
    totalUnits: data.count,
    masteredUnits: data.mastered,
  }))

  // Get items due for review
  const now = new Date()
  const dueForReview = await prisma.reviewSchedule.findMany({
    where: {
      studentId: student.id,
      nextReviewAt: { lte: now },
    },
    orderBy: { nextReviewAt: 'asc' },
    take: 10,
  })

  return NextResponse.json({ masteries, subjectSummary, dueForReview })
})

// POST — update mastery for a unit (called after quiz, study session, etc.)
export const POST = route({ auth: 'STUDENT' }, async (request, { user }) => {
  const { subject, unitName, scoreDelta, correctDelta, totalDelta, studyTimeDelta, lessonCompleted } = await request.json()

  if (!subject || !unitName) {
    return NextResponse.json({ error: 'subject and unitName required' }, { status: 400 })
  }

  const student = await prisma.student.findUnique({ where: { userId: user.id } })
  if (!student) return NextResponse.json({ error: 'Student not found' }, { status: 404 })

  // Upsert unit mastery
  const existing = await prisma.unitMastery.findUnique({
    where: { studentId_subject_unitName: { studentId: student.id, subject, unitName } },
  })

  let mastery
  if (existing) {
    const newTotal = existing.totalQuestions + (totalDelta || 0)
    const newCorrect = existing.correctAnswers + (correctDelta || 0)
    const newMastery = newTotal > 0 ? Math.round((newCorrect / newTotal) * 100) : existing.masteryScore
    const clampedMastery = Math.max(0, Math.min(100, scoreDelta !== undefined ? Math.round((existing.masteryScore + scoreDelta) / 2) : newMastery))
    const level = getMasteryLevel(clampedMastery)

    mastery = await prisma.unitMastery.update({
      where: { id: existing.id },
      data: {
        totalQuestions: newTotal,
        correctAnswers: newCorrect,
        masteryScore: clampedMastery,
        masteryLevel: level,
        studyTimeMins: existing.studyTimeMins + (studyTimeDelta || 0),
        quizzesTaken: existing.quizzesTaken + (totalDelta ? 1 : 0),
        lessonsCompleted: existing.lessonsCompleted + (lessonCompleted ? 1 : 0),
        lastPracticedAt: new Date(),
      },
    })
  } else {
    const initialScore = scoreDelta !== undefined ? scoreDelta : (totalDelta && correctDelta ? Math.round((correctDelta / totalDelta) * 100) : 0)
    const level = getMasteryLevel(initialScore)

    mastery = await prisma.unitMastery.create({
      data: {
        studentId: student.id,
        subject,
        unitName,
        masteryScore: initialScore,
        masteryLevel: level,
        totalQuestions: totalDelta || 0,
        correctAnswers: correctDelta || 0,
        studyTimeMins: studyTimeDelta || 0,
        quizzesTaken: totalDelta ? 1 : 0,
        lessonsCompleted: lessonCompleted ? 1 : 0,
        lastPracticedAt: new Date(),
      },
    })
  }

  return NextResponse.json({ mastery })
})

// PUT — adaptive difficulty recommendation based on recent performance
export const PUT = route({ auth: 'STUDENT' }, async (request, { user }) => {
  const student = await prisma.student.findUnique({ where: { userId: user.id } })
  if (!student) return NextResponse.json({ error: 'Student not found' }, { status: 404 })

  const progress = await prisma.studentProgress.findFirst({
    where: { studentId: student.id },
    orderBy: { updatedAt: 'desc' },
  })

  if (!progress) return NextResponse.json({ recommendation: 'medium', reason: 'No data yet', confidence: 0 })

  // Analyze recent mastery across subjects
  const recentMasteries = await prisma.unitMastery.findMany({
    where: { studentId: student.id, lastPracticedAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
    orderBy: { lastPracticedAt: 'desc' },
    take: 20,
  })

  if (recentMasteries.length === 0) {
    return NextResponse.json({ recommendation: progress.preferredDifficulty, reason: 'No recent practice data', confidence: 0.3 })
  }

  const avgMastery = recentMasteries.reduce((s, m) => s + m.masteryScore, 0) / recentMasteries.length
  const recentCorrect = recentMasteries.reduce((s, m) => s + m.correctAnswers, 0)
  const recentTotal = recentMasteries.reduce((s, m) => s + m.totalQuestions, 0)
  const accuracy = recentTotal > 0 ? recentCorrect / recentTotal : 0.5

  // Adaptive logic
  let recommendation: string
  let reason: string
  let confidence: number

  if (avgMastery >= 85 && accuracy >= 0.85) {
    recommendation = 'hard'
    reason = `Strong performance: ${Math.round(avgMastery)}% mastery, ${Math.round(accuracy * 100)}% accuracy. Ready for harder challenges.`
    confidence = Math.min(0.95, 0.5 + (avgMastery - 85) / 100)
  } else if (avgMastery >= 70 && accuracy >= 0.7) {
    recommendation = 'medium'
    reason = `Solid performance: ${Math.round(avgMastery)}% mastery, ${Math.round(accuracy * 100)}% accuracy. Standard difficulty is appropriate.`
    confidence = 0.7
  } else if (avgMastery < 50 || accuracy < 0.5) {
    recommendation = 'easy'
    reason = `Struggling: ${Math.round(avgMastery)}% mastery, ${Math.round(accuracy * 100)}% accuracy. Easier questions will build confidence.`
    confidence = Math.min(0.9, 0.5 + (50 - avgMastery) / 100)
  } else {
    recommendation = 'medium'
    reason = `Moderate performance: ${Math.round(avgMastery)}% mastery, ${Math.round(accuracy * 100)}% accuracy.`
    confidence = 0.6
  }

  // Auto-update if confidence is high enough
  if (confidence >= 0.7 && recommendation !== progress.preferredDifficulty) {
    await prisma.studentProgress.update({
      where: { id: progress.id },
      data: { preferredDifficulty: recommendation },
    }).catch(() => {})
  }

  return NextResponse.json({ recommendation, reason, confidence, currentDifficulty: progress.preferredDifficulty })
})

function getMasteryLevel(score: number): 'NOT_STARTED' | 'BEGINNER' | 'DEVELOPING' | 'PROFICIENT' | 'MASTERED' {
  if (score >= 90) return 'MASTERED'
  if (score >= 70) return 'PROFICIENT'
  if (score >= 50) return 'DEVELOPING'
  if (score > 0) return 'BEGINNER'
  return 'NOT_STARTED'
}
