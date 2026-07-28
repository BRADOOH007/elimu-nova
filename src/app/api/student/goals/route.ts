import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { route, apiLogger } from '@/lib/api-middleware'

const log = apiLogger('student/goals')
export const dynamic = 'force-dynamic'

export const GET = route({ auth: 'STUDENT' }, async (req, { user }) => {
  try {
    const student = await prisma.student.findUnique({ where: { userId: user.id }, select: { id: true } })
    if (!student) return NextResponse.json({ error: 'Student not found' }, { status: 404 })

    const today = new Date(); today.setHours(0, 0, 0, 0)
    const weekStart = new Date(today); weekStart.setDate(weekStart.getDate() - weekStart.getDay())

    const [submissionsWeek, studyTimeWeek, totalPending, averageGrade] = await Promise.all([
      prisma.submission.count({
        where: { studentId: student.id, submittedAt: { gte: weekStart }, status: { not: 'PENDING' } }
      }),
      prisma.studySession.aggregate({
        where: { studentId: student.id, startTime: { gte: weekStart } },
        _sum: { duration: true }
      }),
      prisma.submission.count({
        where: { studentId: student.id, status: 'PENDING' }
      }),
      prisma.submission.aggregate({
        where: { studentId: student.id, grade: { not: null } },
        _avg: { grade: true }
      }),
    ])

    const studyHours = Math.round(((studyTimeWeek._sum?.duration || 0) / 60) * 10) / 10
    const avgGrade = Math.round(averageGrade._avg?.grade || 0)

    return NextResponse.json({
      goals: {
        assignmentsCompleted: { current: submissionsWeek, target: Math.max(5, Math.ceil(submissionsWeek * 1.5)) },
        studyHours: { current: studyHours, target: Math.max(10, Math.ceil(studyHours * 1.5)) },
        averageGrade: { current: avgGrade, target: Math.max(80, avgGrade + 5) },
      },
      weeklyProgress: {
        assignmentsDone: submissionsWeek,
        studyHours,
        pendingTotal: totalPending,
      }
    })
  } catch (error) {
    log.error('Error fetching goals:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
})
