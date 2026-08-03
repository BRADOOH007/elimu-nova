import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { route, apiLogger } from '@/lib/api-middleware'

const log = apiLogger('teacher/alerts')

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

    const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000)
    const today = new Date()
    today.setHours(23, 59, 59, 999)

    const [
      overdueGradingCount,
      atRiskStudents,
      unreadMessages,
      upcomingMeetings,
      todayScheduleCount,
    ] = await Promise.all([
      prisma.submission.count({
        where: {
          assignment: { teacherId: teacher.id },
          grade: null,
          submittedAt: { lte: twoDaysAgo }
        }
      }),
      prisma.student.findMany({
        where: {
          class: { teacherId: teacher.id },
          submissions: {
            some: {
              grade: { not: null },
              submittedAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
            }
          }
        },
        include: {
          user: { select: { firstName: true, lastName: true } },
          submissions: {
            where: { grade: { not: null } },
            orderBy: { submittedAt: 'desc' },
            take: 3,
            select: { grade: true }
          }
        }
      }),
      prisma.message.count({
        where: {
          recipientId: user.id,
          readAt: null,
        }
      }),
      prisma.meeting.count({
        where: {
          createdBy: user.id,
          status: { notIn: ['COMPLETED', 'CANCELLED'] },
          date: { gte: new Date() },
        }
      }),
      prisma.schedule.count({
        where: {
          teacherId: teacher.id,
          startTime: { lte: today },
          endTime: { gte: new Date() },
        }
      }),
    ])

    const flagged: any[] = []
    for (const student of atRiskStudents) {
      const grades = student.submissions.map(s => s.grade || 0)
      if (grades.length >= 2) {
        // grades are ordered newest-first (submittedAt: 'desc')
        const newest = grades[0]
        const oldest = grades[grades.length - 1]
        const decline = oldest - newest
        if (decline > 15) {
          flagged.push({
            studentId: student.id,
            name: `${student.user.firstName} ${student.user.lastName}`,
            recentGrades: grades,
            decline: Math.round(decline),
          })
        }
      }
    }

    const alerts = [
      ...(overdueGradingCount > 0 ? [{
        id: 'overdue-grading',
        type: 'warning' as const,
        title: 'Grading Overdue',
        description: `${overdueGradingCount} submission${overdueGradingCount > 1 ? 's have' : ' has'} been waiting over 48 hours for grading.`,
        action: { label: 'Grade Now', href: '/teacher/marks' },
      }] : []),
      ...(flagged.length > 0 ? [{
        id: 'at-risk-students',
        type: 'danger' as const,
        title: 'Students at Risk',
        description: `${flagged.length} student${flagged.length > 1 ? 's show' : ' shows'} a significant performance decline.`,
        action: { label: 'View Students', href: '/teacher/students' },
      }] : []),
      ...(unreadMessages > 0 ? [{
        id: 'unread-messages',
        type: 'info' as const,
        title: 'Unread Messages',
        description: `You have ${unreadMessages} unread message${unreadMessages > 1 ? 's' : ''}.`,
        action: { label: 'Open Messages', href: '/teacher/messages' },
      }] : []),
      ...(upcomingMeetings > 0 ? [{
        id: 'upcoming-meetings',
        type: 'info' as const,
        title: 'Upcoming Meetings',
        description: `You have ${upcomingMeetings} upcoming meeting${upcomingMeetings > 1 ? 's' : ''}.`,
        action: { label: 'View Meetings', href: '/teacher/meetings' },
      }] : []),
      ...(todayScheduleCount > 0 ? [{
        id: 'schedule-reminder',
        type: 'success' as const,
        title: 'Today\'s Schedule',
        description: `You have ${todayScheduleCount} class${todayScheduleCount > 1 ? 'es' : ''} scheduled for today.`,
        action: { label: 'View Schedule', href: '/teacher/schedule' },
      }] : []),
    ]

    return NextResponse.json({ alerts, atRiskDetails: flagged })
  } catch (error) {
    log.error('Error fetching alerts:', error)
    return NextResponse.json({ alerts: [], atRiskDetails: [] })
  }
})
