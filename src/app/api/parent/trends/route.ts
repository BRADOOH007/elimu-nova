import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { route, apiLogger } from '@/lib/api-middleware'

const log = apiLogger('parent/trends')
export const dynamic = 'force-dynamic'

export const GET = route({ auth: 'PARENT' }, async (req, { user }) => {
  try {
    const parent = await prisma.parent.findUnique({ where: { userId: user.id } })
    if (!parent) return NextResponse.json({ error: 'Parent not found' }, { status: 404 })

    const parentStudents = await prisma.parentStudent.findMany({
      where: { parentId: parent.id },
      include: { student: { include: { user: { select: { firstName: true, lastName: true } } } } }
    })

    const childPerformance = await Promise.all(parentStudents.map(async (ps) => {
      const child = ps.student
      const thirtyDaysAgo = new Date(); thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      const submissions = await prisma.submission.findMany({
        where: { studentId: child.id, grade: { not: null }, submittedAt: { gte: thirtyDaysAgo } },
        select: { grade: true, submittedAt: true, assignment: { select: { subject: true } } },
        orderBy: { submittedAt: 'asc' },
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
      const trend = Object.entries(gradeByDay).map(([date, { sum, count }]) => ({
        date, avgGrade: count > 0 ? Math.round((sum / count) * 100) / 100 : 0,
      }))

      const subjectGrades: Record<string, number[]> = {}
      for (const s of submissions) {
        const subj = s.assignment.subject || 'General'
        if (!subjectGrades[subj]) subjectGrades[subj] = []
        subjectGrades[subj].push(s.grade || 0)
      }
      const subjects = Object.entries(subjectGrades).map(([subject, grades]) => ({
        subject,
        avgGrade: Math.round((grades.reduce((a, b) => a + b, 0) / grades.length) * 100) / 100,
      }))

      return {
        id: child.id,
        name: `${child.user.firstName} ${child.user.lastName}`,
        trend,
        subjects,
        averageGrade: trend.filter(t => t.avgGrade > 0).length > 0
          ? Math.round(trend.filter(t => t.avgGrade > 0).reduce((s, t) => s + t.avgGrade, 0) / trend.filter(t => t.avgGrade > 0).length * 100) / 100
          : 0,
      }
    }))

    return NextResponse.json({ children: childPerformance })
  } catch (error) {
    log.error('Error fetching trends:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
})
