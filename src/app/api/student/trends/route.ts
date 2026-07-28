import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { route, apiLogger } from '@/lib/api-middleware'

const log = apiLogger('student/trends')
export const dynamic = 'force-dynamic'

export const GET = route({ auth: 'STUDENT' }, async (req, { user }) => {
  try {
    const student = await prisma.student.findUnique({ where: { userId: user.id }, select: { id: true } })
    if (!student) return NextResponse.json({ error: 'Student not found' }, { status: 404 })

    const thirtyDaysAgo = new Date(); thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const submissions = await prisma.submission.findMany({
      where: { studentId: student.id, grade: { not: null }, submittedAt: { gte: thirtyDaysAgo } },
      select: { grade: true, submittedAt: true, assignment: { select: { subject: true } } },
      orderBy: { submittedAt: 'asc' }
    })

    const gradeByDay: Record<string, { sum: number; count: number }> = {}
    for (let i = 0; i < 30; i++) {
      const d = new Date(thirtyDaysAgo); d.setDate(d.getDate() + i)
      gradeByDay[d.toISOString().split('T')[0]] = { sum: 0, count: 0 }
    }
    for (const s of submissions) {
      const key = new Date(s.submittedAt).toISOString().split('T')[0]
      if (gradeByDay[key]) { gradeByDay[key].sum += s.grade || 0; gradeByDay[key].count++ }
    }

    const gradeTrend = Object.entries(gradeByDay).map(([date, { sum, count }]) => ({
      date, avgGrade: count > 0 ? Math.round((sum / count) * 100) / 100 : 0, submissions: count,
    }))

    const subjectGrades: Record<string, { sum: number; count: number }> = {}
    for (const s of submissions) {
      const subj = s.assignment.subject || 'General'
      if (!subjectGrades[subj]) subjectGrades[subj] = { sum: 0, count: 0 }
      subjectGrades[subj].sum += s.grade || 0; subjectGrades[subj].count++
    }
    const subjectPerformance = Object.entries(subjectGrades).map(([subject, { sum, count }]) => ({
      subject, avgGrade: count > 0 ? Math.round((sum / count) * 100) / 100 : 0, submissions: count,
    }))

    const studySessions = await prisma.studySession.findMany({
      where: { studentId: student.id, startTime: { gte: thirtyDaysAgo } },
      select: { duration: true, startTime: true }
    })
    const timeByDay: Record<string, number> = {}
    for (let i = 0; i < 30; i++) {
      const d = new Date(thirtyDaysAgo); d.setDate(d.getDate() + i)
      timeByDay[d.toISOString().split('T')[0]] = 0
    }
    for (const s of studySessions) {
      const key = new Date(s.startTime).toISOString().split('T')[0]
      if (timeByDay[key] !== undefined) timeByDay[key] += s.duration || 0
    }
    const studyTimeTrend = Object.entries(timeByDay).map(([date, mins]) => ({
      date, hours: Math.round((mins / 60) * 100) / 100,
    }))

    return NextResponse.json({ gradeTrend, subjectPerformance, studyTimeTrend })
  } catch (error) {
    log.error('Error fetching trends:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
})
