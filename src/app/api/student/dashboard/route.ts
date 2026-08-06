import { NextResponse } from 'next/server'
import { prisma, withRetry } from '@/lib/prisma'
import { route } from '@/lib/api-middleware'

export const GET = route({ auth: 'STUDENT' }, async (req, { user }) => {
  let student = await withRetry(() => prisma.student.findUnique({
    where: { userId: user.id },
    include: {
      user: true,
      school: true,
      teacher: true,
      class: true,
      analytics: true,
      studentProgress: {
        include: {
          skillMastery: true
        }
      }
    }
  }))

  if (!student) {
    student = await prisma.student.create({
      data: { userId: user.id },
      include: {
        user: true,
        school: true,
        teacher: true,
        class: true,
        analytics: true,
        studentProgress: {
          include: {
            skillMastery: true
          }
        }
      }
    })
  }

  if (!student) {
    return NextResponse.json({ error: 'Failed to create student profile' }, { status: 500 })
  }

  // Get all dashboard data in parallel for faster loading
  const startOfWeek = new Date()
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay())
  startOfWeek.setHours(0, 0, 0, 0)
  const endOfWeek = new Date(startOfWeek)
  endOfWeek.setDate(endOfWeek.getDate() + 7)
  const today = new Date()
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  tomorrow.setHours(23, 59, 59, 999)
  const s = student as any

  const [assignments, studySessionsResult, aiTutorResult, upcomingLessonsResult] = await Promise.all([
    prisma.assignment.findMany({
      where: { students: { some: { id: student.id } } },
      include: {
        teacher: { include: { user: true } },
        submissions: { where: { studentId: student.id } },
        lessonPlan: { select: { subject: true } },
      },
      orderBy: { dueDate: 'asc' },
    }).catch(() => []),
    prisma.studySession.findMany({
      where: { studentId: student.id, startTime: { gte: startOfWeek, lt: endOfWeek } },
      orderBy: { startTime: 'desc' },
    }).catch(() => []),
    prisma.aITutorSession.findMany({
      where: { studentId: student.id },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }).catch(() => []),
    s.schoolId ? prisma.schedule.findMany({
      where: { schoolId: s.schoolId, startTime: { gte: today, lte: tomorrow }, type: 'CLASS' },
      include: { teacher: { include: { user: true } }, class: true },
      orderBy: { startTime: 'asc' },
    }).catch(() => []) : Promise.resolve([]),
  ])

  const assignmentsList = assignments as any[]
  const studySessions = studySessionsResult as any[]
  const aiTutorSessions = aiTutorResult as any[]
  const upcomingLessons = upcomingLessonsResult as any[]

  // Calculate analytics
  const totalStudyTime = studySessions.reduce((total, session) => total + session.duration, 0)

  const completedAssignments = assignments.filter(assignment => 
    assignment.submissions.some(submission => submission.status === 'GRADED' || submission.grade !== null)
  ).length

  const pendingAssignments = assignments.filter(assignment => 
    assignment.submissions.length === 0 &&
    assignment.dueDate > new Date()
  ).length

  const overdueAssignments = assignments.filter(assignment => 
    assignment.submissions.length === 0 &&
    assignment.dueDate <= new Date()
  ).length

  // Calculate average grade
  const gradedSubmissions = assignments.flatMap(assignment => 
    assignment.submissions.filter(submission => submission.grade !== null)
  )

  const averageGrade = gradedSubmissions.length > 0 
    ? gradedSubmissions.reduce((sum, submission) => sum + (submission.grade || 0), 0) / gradedSubmissions.length
    : null

  // Get upcoming lessons already fetched in Promise.all above
  const analyticsData = {
    totalStudyTime: s.analytics?.totalStudyTime || 0,
    averageGrade: averageGrade,
    completedAssignments,
    pendingAssignments,
    overdueAssignments,
    lastActiveDate: new Date(),
    weeklyGoal: s.analytics?.weeklyGoal || 300,
    monthlyGoal: s.analytics?.monthlyGoal || 1200,
    streakDays: s.analytics?.streakDays || 0,
    longestStreak: s.analytics?.longestStreak || 0
  }

  try {
    await prisma.studentAnalytics.upsert({
      where: { studentId: student.id },
      update: analyticsData,
      create: {
        studentId: student.id,
        ...analyticsData
      }
    })
  } catch (error) {
    console.log('StudentAnalytics table might not exist, using default values...')
  }

  const teacherName = s.teacherId
    ? (await prisma.teacher.findUnique({ where: { id: s.teacherId }, include: { user: true } }))
    : null

  const progress = s.studentProgress?.[0]

  const dashboardData = {
    student: {
      id: s.id,
      name: `${s.user.firstName} ${s.user.lastName}`,
      email: s.user.email,
      school: s.school?.name || 'Independent Learning',
      teacher: teacherName ? `${teacherName.user.firstName} ${teacherName.user.lastName}` : 'Self-directed',
      class: s.class?.name || 'Independent Study'
    },
    stats: {
      activeAssignments: pendingAssignments,
      completedAssignments,
      averageGrade: averageGrade ? Math.round(averageGrade) : null,
      studyTime: totalStudyTime,
      overdueAssignments
    },
    progress: progress ? {
      xp: progress.xp,
      streak: progress.streak,
      consecutiveCorrect: progress.consecutiveCorrect,
      masteryScore: progress.masteryScore,
      preferredDifficulty: progress.preferredDifficulty,
      commonMistakes: progress.commonMistakes,
      totalQuestions: progress.totalQuestions,
      correctAnswers: progress.correctAnswers,
      skillMastery: (progress.skillMastery || []).map((sm: any) => ({
        skillName: sm.skillName,
        skillCategory: sm.skillCategory,
        masteryScore: sm.masteryScore,
        timesCorrect: sm.timesCorrect,
        timesTested: sm.timesTested
      }))
    } : null,
    assignments: assignments.map(assignment => ({
      id: assignment.id,
      title: assignment.title,
      description: assignment.description,
      dueDate: assignment.dueDate,
      status: assignment.submissions.length > 0 ? 
        (assignment.submissions[0].status === 'GRADED' ? 'Completed' : 'Submitted') : 
        (assignment.dueDate < new Date() ? 'Overdue' : 'Pending'),
      grade: assignment.submissions.find(s => s.grade !== null)?.grade || null,
      teacher: assignment.teacher ? `${assignment.teacher.user.firstName} ${assignment.teacher.user.lastName}` : 'Self-assigned',
      subject: assignment.lessonPlan?.subject || 'General'
    })),
    upcomingLessons: upcomingLessons.map(lesson => ({
      id: lesson.id,
      title: lesson.title,
      subject: lesson.subject || 'General',
      topic: lesson.description,
      time: lesson.startTime.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
      }),
      teacher: lesson.teacher ? `${lesson.teacher.user.firstName} ${lesson.teacher.user.lastName}` : 'AI Teacher',
      location: lesson.location
    })),
    studySessions: studySessions.map(session => ({
      id: session.id,
      subject: session.subject,
      topic: session.topic,
      duration: session.duration,
      startTime: session.startTime,
      endTime: session.endTime,
      notes: session.notes
    })),
    aiTutorSessions: aiTutorSessions.map(session => ({
      id: session.id,
      sessionType: session.sessionType,
      subject: session.subject,
      topic: session.topic,
      question: session.question,
      response: session.response,
      rating: session.rating,
      isHelpful: session.isHelpful,
      createdAt: session.createdAt
    })),
    analytics: analyticsData
  }

  let unreadNotificationCount = 0
  try {
    unreadNotificationCount = await prisma.notification.count({
      where: { userId: user.id, isRead: false },
    })
  } catch { /* notifications table may not exist */ }

  ;(dashboardData as any).unreadNotificationCount = unreadNotificationCount

  return NextResponse.json(dashboardData)
})
