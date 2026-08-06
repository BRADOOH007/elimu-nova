import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { route } from '@/lib/api-middleware'

export const GET = route({ auth: 'STUDENT' }, async (req, { user }) => {
  try {
    const student = await prisma.student.findUnique({
      where: { userId: user.id },
      select: { id: true }
    })
    if (!student) return NextResponse.json({ error: 'Student not found' }, { status: 404 })

    const [studyTime, questions, progress, assignments, topicMastery, sessions] = await Promise.all([
      // Total study time in minutes from study sessions
      prisma.studySession.aggregate({
        where: { studentId: student.id },
        _sum: { duration: true },
      }),
      // Quiz + practice stats
      prisma.studentProgress.findFirst({
        where: { studentId: student.id },
        select: { totalQuestions: true, correctAnswers: true },
      }),
      // Progress record
      prisma.studentProgress.findFirst({
        where: { studentId: student.id },
        orderBy: { updatedAt: 'desc' },
      }),
      // Assignment counts
      Promise.all([
        prisma.submission.count({ where: { studentId: student.id, status: 'GRADED' } }),
        prisma.submission.count({ where: { studentId: student.id } }),
      ]),
      // Topic mastery
      prisma.topicProgress.findMany({
        where: { studentId: student.id },
        select: { topicName: true, masteryScore: true, status: true },
        take: 20,
      }),
      // Recent study sessions (last 30 days)
      prisma.studySession.findMany({
        where: {
          studentId: student.id,
          startTime: { gte: new Date(Date.now() - 30 * 86400000) },
        },
        select: { subject: true, topic: true, duration: true, startTime: true },
        orderBy: { startTime: 'desc' },
        take: 50,
      }),
    ])

    const totalMinutes = studyTime._sum?.duration || 0
    const totalQuestions = questions?.totalQuestions || 0
    const correctAnswers = questions?.correctAnswers || 0
    const accuracy = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0
    const [completedAssignments, totalAssignments] = assignments

    // Micro-progress badges
    const badges: string[] = []
    if (totalQuestions >= 5) badges.push(`Answered ${totalQuestions} questions`)
    if (totalMinutes >= 5) badges.push(`${Math.round(totalMinutes)} min studied`)
    if (completedAssignments > 0) badges.push(`${completedAssignments} assignments done`)
    if (accuracy >= 80) badges.push('High accuracy')

    // Daily study chart (last 30 days)
    const dailyStudy: Record<string, number> = {}
    for (const s of sessions) {
      const day = new Date(s.startTime).toISOString().split('T')[0]
      dailyStudy[day] = (dailyStudy[day] || 0) + (s.duration || 0)
    }
    const studyChart = Object.entries(dailyStudy)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, minutes]) => ({ date: date.slice(5), minutes }))

    // Subject performance from topic mastery
    const subjectPerformance = topicMastery.reduce((acc: Record<string, { total: number; count: number }>, t) => {
      const subj = t.topicName?.split(' ')[0] || 'General'
      if (!acc[subj]) acc[subj] = { total: 0, count: 0 }
      acc[subj].total += t.masteryScore || 0
      acc[subj].count++
      return acc
    }, {})

    const subjects = Object.entries(subjectPerformance).map(([name, data]) => ({
      name,
      mastery: Math.round(data.total / data.count),
    }))

    // Weak topics (< 60% mastery)
    const weakTopics = topicMastery
      .filter(t => (t.masteryScore || 0) < 60)
      .slice(0, 5)
      .map(t => ({ topic: t.topicName, score: t.masteryScore || 0 }))

    // Grade trend — use study sessions per day as proxy
    const gradeTrend = studyChart.slice(-14)

    return NextResponse.json({
      totalMinutes,
      totalQuestions,
      correctAnswers,
      accuracy,
      completedAssignments,
      totalAssignments,
      badges,
      studyChart,
      subjects,
      weakTopics,
      gradeTrend,
    })

  } catch (e) {
    console.error('[ProgressAnalytics] Error:', e)
    return NextResponse.json({ error: 'Failed to load analytics' }, { status: 500 })
  }
})
