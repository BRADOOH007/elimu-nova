import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { route, apiLogger } from '@/lib/api-middleware'

const log = apiLogger('student/live-metrics')
export const dynamic = 'force-dynamic'

export const GET = route({ auth: 'STUDENT' }, async (req, { user }) => {
  try {
    const student = await prisma.student.findUnique({
      where: { userId: user.id },
      select: { id: true, classId: true }
    })
    if (!student) return NextResponse.json({ error: 'Student not found' }, { status: 404 })

    const today = new Date(); today.setHours(0, 0, 0, 0)

    const [
      pendingAssignments,
      completedToday,
      studyTimeMinutes,
      averageGrade,
      streakDays,
      tomorrowLessons,
    ] = await Promise.all([
      prisma.submission.count({
        where: { studentId: student.id, grade: null, status: 'PENDING' }
      }),
      prisma.submission.count({
        where: { studentId: student.id, submittedAt: { gte: today }, status: { not: 'PENDING' } }
      }),
      prisma.studySession.aggregate({
        where: { studentId: student.id, startTime: { gte: today } },
        _sum: { duration: true }
      }),
      prisma.submission.aggregate({
        where: { studentId: student.id, grade: { not: null } },
        _avg: { grade: true }
      }),
      prisma.studentAnalytics.findUnique({
        where: { studentId: student.id },
        select: { streakDays: true }
      }),
      student.classId
        ? prisma.schedule.count({
            where: { classId: student.classId, startTime: { gte: today }, type: 'CLASS' }
          })
        : Promise.resolve(0),
    ])

    return NextResponse.json({
      pendingAssignments,
      upcomingLessons: tomorrowLessons,
      completedToday,
      studyTimeMinutes: studyTimeMinutes._sum?.duration || 0,
      averageGrade: Math.round(averageGrade._avg?.grade || 0),
      streakDays: streakDays?.streakDays || 0,
    })
  } catch (error) {
    log.error('Error fetching live metrics:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
})
