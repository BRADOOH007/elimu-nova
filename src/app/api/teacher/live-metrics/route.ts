import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { route, apiLogger } from '@/lib/api-middleware'

const log = apiLogger('teacher/live-metrics')

export const dynamic = 'force-dynamic'

export const GET = route({ auth: 'TEACHER' }, async (req, { user }) => {
  try {
    const teacher = await prisma.teacher.findUnique({
      where: { userId: user.id },
      select: { id: true, schoolId: true }
    })

    if (!teacher) {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 })
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const weekStart = new Date(today)
    weekStart.setDate(weekStart.getDate() - weekStart.getDay())

    const [
      studentsTotal,
      submissionsToday,
      pendingGrading,
      lessonsThisWeek,
      averagePerformance,
      activeStudents30d,
    ] = await Promise.all([
      prisma.student.count({
        where: { class: { teacherId: teacher.id } }
      }),
      prisma.submission.count({
        where: {
          assignment: { teacherId: teacher.id },
          submittedAt: { gte: today }
        }
      }),
      prisma.submission.count({
        where: {
          assignment: { teacherId: teacher.id },
          grade: null
        }
      }),
      prisma.schedule.count({
        where: {
          teacherId: teacher.id,
          type: 'CLASS',
          startTime: { gte: weekStart }
        }
      }),
      prisma.submission.aggregate({
        where: {
          assignment: { teacherId: teacher.id },
          grade: { not: null }
        },
        _avg: { grade: true }
      }),
      prisma.student.count({
        where: {
          class: { teacherId: teacher.id },
          submissions: {
            some: {
              submittedAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
            }
          }
        }
      }),
    ])

    return NextResponse.json({
      studentsTotal,
      submissionsToday,
      pendingGrading,
      lessonsThisWeek,
      averagePerformance: Math.round((averagePerformance._avg.grade || 0) * 100) / 100,
      activeStudents30d,
    })
  } catch (error) {
    log.error('Error fetching live metrics:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
})
