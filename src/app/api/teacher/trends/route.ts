import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { route, apiLogger } from '@/lib/api-middleware'

const log = apiLogger('teacher/trends')

export const dynamic = 'force-dynamic'

export const GET = route({ auth: 'TEACHER' }, async (req, { user }) => {
  try {
    const teacher = await prisma.teacher.findUnique({
      where: { userId: user.id },
      select: { id: true }
    })

    if (!teacher) {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 })
    }

    // Grade trend — last 30 days, grouped by date
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const gradedSubmissions = await prisma.submission.findMany({
      where: {
        assignment: { teacherId: teacher.id },
        grade: { not: null },
        submittedAt: { gte: thirtyDaysAgo }
      },
      select: {
        grade: true,
        submittedAt: true,
      },
      orderBy: { submittedAt: 'asc' }
    })

    const gradeByDay: Record<string, { sum: number; count: number }> = {}
    for (let i = 0; i < 30; i++) {
      const d = new Date(thirtyDaysAgo)
      d.setDate(d.getDate() + i)
      const key = d.toISOString().split('T')[0]
      gradeByDay[key] = { sum: 0, count: 0 }
    }

    for (const s of gradedSubmissions) {
      const key = new Date(s.submittedAt).toISOString().split('T')[0]
      if (gradeByDay[key]) {
        gradeByDay[key].sum += s.grade || 0
        gradeByDay[key].count += 1
      }
    }

    const gradeTrend = Object.entries(gradeByDay).map(([date, { sum, count }]) => ({
      date,
      avgGrade: count > 0 ? Math.round((sum / count) * 100) / 100 : 0,
      submissions: count,
    }))

    // Submission trend — last 12 weeks
    const twelveWeeksAgo = new Date()
    twelveWeeksAgo.setDate(twelveWeeksAgo.getDate() - 84)

    const weeklySubmissions = await prisma.submission.findMany({
      where: {
        assignment: { teacherId: teacher.id },
        submittedAt: { gte: twelveWeeksAgo }
      },
      select: { submittedAt: true }
    })

    const weekBuckets: Record<string, number> = {}
    for (let w = 0; w < 12; w++) {
      const d = new Date(twelveWeeksAgo)
      d.setDate(d.getDate() + w * 7)
      const key = d.toISOString().split('T')[0]
      weekBuckets[key] = 0
    }

    for (const s of weeklySubmissions) {
      const d = new Date(s.submittedAt)
      const daysDiff = Math.floor((d.getTime() - twelveWeeksAgo.getTime()) / (7 * 24 * 60 * 60 * 1000))
      const weekIndex = Math.min(Math.max(0, daysDiff), 11)
      const weekStart = new Date(twelveWeeksAgo)
      weekStart.setDate(weekStart.getDate() + weekIndex * 7)
      const key = weekStart.toISOString().split('T')[0]
      weekBuckets[key] = (weekBuckets[key] || 0) + 1
    }

    const submissionTrend = Object.entries(weekBuckets).map(([date, count]) => ({
      week: date,
      submissions: count,
    }))

    return NextResponse.json({ gradeTrend, submissionTrend })
  } catch (error) {
    log.error('Error fetching trends:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
})
