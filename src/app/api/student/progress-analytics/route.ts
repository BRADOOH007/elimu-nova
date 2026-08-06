import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { route } from '@/lib/api-middleware'

const FALLBACK_SUBJECTS = [
  { name: 'Mathematics', mastery: 0 },
  { name: 'English', mastery: 0 },
  { name: 'Science', mastery: 0 },
  { name: 'Kiswahili', mastery: 0 },
]

const FALLBACK = {
  totalMinutes: 0, totalQuestions: 0, correctAnswers: 0, accuracy: 0,
  completedAssignments: 0, totalAssignments: 0, badges: [],
  studyChart: [], subjects: FALLBACK_SUBJECTS, weakTopics: [], gradeTrend: [],
}

async function safeQuery<T>(label: string, fn: () => Promise<T>, fallback: T): Promise<T> {
  try { return await fn() } catch (e) { console.warn(`[ProgressAnalytics] ${label} failed:`, e); return fallback }
}

export const GET = route({ auth: 'STUDENT' }, async (req, { user }) => {
  try {
    const student = await prisma.student.findUnique({
      where: { userId: user.id },
      select: { id: true }
    })
    if (!student) return NextResponse.json({ ...FALLBACK, _studentNotFound: true })

    const [
      studyTime,
      questions,
      [completedAssignments, totalAssignments],
      topicMastery,
      sessions
    ] = await Promise.all([
      safeQuery('studyTime', () => prisma.studySession.aggregate({ where: { studentId: student.id }, _sum: { duration: true } }), { _sum: { duration: 0 } }),
      safeQuery('questions', () => prisma.studentProgress.findFirst({ where: { studentId: student.id }, select: { totalQuestions: true, correctAnswers: true } }), { totalQuestions: 0, correctAnswers: 0 }),
      Promise.all([
        safeQuery('completed', () => prisma.submission.count({ where: { studentId: student.id, status: 'GRADED' } }), 0),
        safeQuery('total', () => prisma.submission.count({ where: { studentId: student.id } }), 0),
      ]),
      safeQuery('topicMastery', () => prisma.topicProgress.findMany({ where: { studentId: student.id }, take: 20 }), [] as any[]),
      safeQuery('sessions', () => prisma.studySession.findMany({ where: { studentId: student.id, startTime: { gte: new Date(Date.now() - 30 * 86400000) } }, select: { subject: true, topic: true, duration: true, startTime: true }, orderBy: { startTime: 'desc' }, take: 50 }), [] as any[]),
    ])

    const totalMinutes = studyTime._sum?.duration || 0
    const totalQuestions = questions?.totalQuestions || 0
    const correctAnswers = questions?.correctAnswers || 0
    const accuracy = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0

    const badges: string[] = []
    if (totalQuestions >= 5) badges.push(`Answered ${totalQuestions} questions`)
    if (totalMinutes >= 5) badges.push(`${Math.round(totalMinutes)} min studied`)
    if (completedAssignments > 0) badges.push(`${completedAssignments} assignments done`)
    if (accuracy >= 80) badges.push('High accuracy')

    const dailyStudy: Record<string, number> = {}
    for (const s of sessions) {
      const day = new Date(s.startTime).toISOString().split('T')[0]
      dailyStudy[day] = (dailyStudy[day] || 0) + (s.duration || 0)
    }
    const studyChart = Object.entries(dailyStudy).sort(([a], [b]) => a.localeCompare(b)).map(([date, minutes]) => ({ date: date.slice(5), minutes }))

    const subjectPerformance = topicMastery.reduce((acc: Record<string, { total: number; count: number }>, t) => {
      const subj = t.topicName?.split(' ')[0] || 'General'
      const score = t.status === 'COMPLETED' ? 100 : t.status === 'IN_PROGRESS' ? 50 : 0
      if (!acc[subj]) acc[subj] = { total: 0, count: 0 }
      acc[subj].total += score
      acc[subj].count++
      return acc
    }, {})
    const subjects = Object.entries(subjectPerformance).length > 0
      ? Object.entries(subjectPerformance).map(([name, data]) => ({ name, mastery: Math.round(data.total / data.count) }))
      : FALLBACK_SUBJECTS

    const weakTopics = topicMastery.filter((t: any) => t.status !== 'COMPLETED').slice(0, 5).map((t: any) => ({ topic: t.topicName, score: t.status === 'IN_PROGRESS' ? 50 : 0 }))

    return NextResponse.json({ totalMinutes, totalQuestions, correctAnswers, accuracy, completedAssignments, totalAssignments, badges, studyChart, subjects, weakTopics, gradeTrend: studyChart.slice(-14) })

  } catch (e) {
    console.error('[ProgressAnalytics] Error:', e)
    return NextResponse.json({ ...FALLBACK, _fallback: true })
  }
})
