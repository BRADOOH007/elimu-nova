import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { route } from '@/lib/api-middleware'

const FALLBACK_SUBJECTS = [
  { name: 'Mathematics', mastery: 0 }, { name: 'English', mastery: 0 },
  { name: 'Science', mastery: 0 }, { name: 'Kiswahili', mastery: 0 },
]

const FALLBACK = {
  totalMinutes: 0, totalQuestions: 0, correctAnswers: 0, accuracy: 0,
  completedAssignments: 0, totalAssignments: 0, badges: [],
  studyChart: [], subjects: FALLBACK_SUBJECTS, weakTopics: [], gradeTrend: [],
}

async function safeQuery<T>(label: string, fn: () => Promise<T>, fallback: T): Promise<T> {
  try { return await fn() } catch (e) { console.warn(`[ProgressAnalytics] ${label}:`, e); return fallback }
}

export const GET = route({}, async (req, { user }) => {
  try {
    const uid = user.id

    const [
      studySessions,
      quizResults,
      practiceAttempts,
      topicProgress,
      submissions,
    ] = await Promise.all([
      safeQuery('studySessions', () => prisma.studySession.findMany({
        where: { studentId: uid, startTime: { gte: new Date(Date.now() - 30 * 86400000) } },
        select: { duration: true, subject: true, topic: true, startTime: true },
        orderBy: { startTime: 'desc' }, take: 200,
      }), [] as any[]),
      safeQuery('quizResults', () => prisma.quizResult.findMany({
        where: { userId: uid },
        select: { subject: true, scorePercent: true, correctCount: true, totalQuestions: true, createdAt: true },
        orderBy: { createdAt: 'desc' }, take: 100,
      }), [] as any[]),
      safeQuery('practiceAttempts', () => prisma.practiceAttempt.findMany({
        where: { userId: uid },
        select: { isCorrect: true },
        take: 500,
      }), [] as any[]),
      safeQuery('topicProgress', () => prisma.topicProgress.findMany({
        where: { studentId: uid },
        take: 50,
      }), [] as any[]),
      Promise.all([
        safeQuery('completedSubs', () => prisma.submission.count({ where: { studentId: uid, status: 'GRADED' } }), 0),
        safeQuery('totalSubs', () => prisma.submission.count({ where: { studentId: uid } }), 0),
      ]),
    ])

    const [completedAssignments, totalAssignments] = submissions
    const totalMinutes = studySessions.reduce((sum, s) => sum + (s.duration || 0), 0)
    const quizCorrect = quizResults.reduce((sum, q) => sum + (q.correctCount || 0), 0)
    const quizTotal = quizResults.reduce((sum, q) => sum + (q.totalQuestions || 0), 0)
    const practiceCorrect = practiceAttempts.filter(p => p.isCorrect).length
    const totalQuestions = quizTotal + practiceAttempts.length
    const correctAnswers = quizCorrect + practiceCorrect
    const accuracy = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0

    const badges: string[] = []
    if (totalQuestions >= 5) badges.push(`Answered ${totalQuestions} questions`)
    if (totalMinutes >= 5) badges.push(`${Math.round(totalMinutes)} min studied`)
    if (completedAssignments > 0) badges.push(`${completedAssignments} assignments done`)
    if (accuracy >= 80) badges.push('High accuracy')

    const dailyStudy: Record<string, number> = {}
    for (const s of studySessions) {
      const day = new Date(s.startTime).toISOString().split('T')[0]
      dailyStudy[day] = (dailyStudy[day] || 0) + (s.duration || 0)
    }
    const studyChart = Object.entries(dailyStudy).sort(([a], [b]) => a.localeCompare(b)).map(([date, minutes]) => ({ date: date.slice(5), minutes }))

    const subjectPerformance = topicProgress.reduce((acc: Record<string, { total: number; count: number }>, t) => {
      const subj = t.topicName?.split(' ')[0] || 'General'
      const score = t.status === 'COMPLETED' ? 100 : t.status === 'IN_PROGRESS' ? 50 : 0
      if (!acc[subj]) acc[subj] = { total: 0, count: 0 }
      acc[subj].total += score; acc[subj].count++
      return acc
    }, {})
    const subjects = Object.entries(subjectPerformance).length > 0
      ? Object.entries(subjectPerformance).map(([name, data]) => ({ name, mastery: Math.round(data.total / data.count) }))
      : FALLBACK_SUBJECTS

    const weakTopics = topicProgress.filter((t: any) => t.status !== 'COMPLETED').slice(0, 5).map((t: any) => ({ topic: t.topicName, score: t.status === 'IN_PROGRESS' ? 50 : 0 }))

    return NextResponse.json({ totalMinutes, totalQuestions, correctAnswers, accuracy, completedAssignments, totalAssignments, badges, studyChart, subjects, weakTopics, gradeTrend: studyChart.slice(-14) })

  } catch (e) {
    console.error('[ProgressAnalytics] Error:', e)
    return NextResponse.json({ ...FALLBACK, _fallback: true })
  }
})
