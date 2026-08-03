import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { OpenAIService } from '@/lib/openai-service'
import { route } from '@/lib/api-middleware'

export const GET = route({ auth: 'STUDENT' }, async (request, { user }) => {
  // Get student data
  const student = await prisma.student.findUnique({
    where: { userId: user.id },
    include: {
      user: true,
      teacher: {
        include: { user: true }
      },
      class: true,
      school: true,
      analytics: true,
      studySessions: {
        orderBy: { startTime: 'desc' },
        take: 50
      },
      submissions: {
        include: {
          assignment: {
            include: { lessonPlan: { select: { subject: true, title: true } } }
          }
        },
        orderBy: { submittedAt: 'desc' },
        take: 50
      },
      assignments: {
        select: { id: true, dueDate: true, title: true },
        orderBy: { dueDate: 'desc' }
      },
      aiTutorSessions: {
        orderBy: { createdAt: 'desc' },
        take: 20
      }
    }
  })

  if (!student) {
    return NextResponse.json({ error: 'Student not found' }, { status: 404 })
  }

  // Calculate progress metrics
  const now = new Date()
  const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()))
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const startOfYear = new Date(now.getFullYear(), 0, 1)

  // Study time calculations
  const weeklyStudyTime = student.studySessions
    .filter(session => new Date(session.startTime) >= startOfWeek)
    .reduce((total, session) => total + session.duration, 0)

  const monthlyStudyTime = student.studySessions
    .filter(session => new Date(session.startTime) >= startOfMonth)
    .reduce((total, session) => total + session.duration, 0)

  const totalStudyTime = student.studySessions
    .reduce((total, session) => total + session.duration, 0)

  // Assignment calculations
  const completedAssignments = student.submissions.filter(s => (s as any).status === 'SUBMITTED').length
  const pendingAssignments = student.assignments.filter(a => 
    a.dueDate > new Date() && 
    !student.submissions.some(s => (s as any).assignmentId === a.id && (s as any).status === 'SUBMITTED')
  ).length
  const overdueAssignments = student.assignments.filter(a => 
    a.dueDate < new Date() && 
    !student.submissions.some(s => (s as any).assignmentId === a.id && (s as any).status === 'SUBMITTED')
  ).length

  // Grade calculations
  const gradedSubmissions = student.submissions.filter(s => s.grade !== null)
  const averageGrade = gradedSubmissions.length > 0 
    ? gradedSubmissions.reduce((sum, s) => sum + (s.grade || 0), 0) / gradedSubmissions.length
    : null

  // Study streak calculation
  const studyStreak = calculateStudyStreak(student.studySessions)

  // AI Tutor activity
  const recentAISessions = student.aiTutorSessions.slice(0, 5)
  const aiHelpRequests = student.aiTutorSessions.length

  // Subject performance
  const subjectPerformance = calculateSubjectPerformance(student.submissions)

  // Learning patterns
  const learningPatterns = analyzeLearningPatterns(student.studySessions, student.submissions)

  // Generate AI insights
  const aiInsights = await generateAIProgressInsights({
    student,
    weeklyStudyTime,
    monthlyStudyTime,
    totalStudyTime,
    completedAssignments,
    pendingAssignments,
    overdueAssignments,
    averageGrade,
    studyStreak,
    subjectPerformance,
    learningPatterns,
    recentAISessions
  })

  const progressData = {
    // Basic metrics
    totalStudyTime,
    weeklyStudyTime,
    monthlyStudyTime,
    averageGrade,
    completedAssignments,
    pendingAssignments,
    overdueAssignments,
    studyStreak,
    aiHelpRequests,

    // Goals
    weeklyGoal: 300, // 5 hours per week
    monthlyGoal: 1200, // 20 hours per month
    yearlyGoal: 14400, // 240 hours per year

    // Detailed data
    subjectPerformance,
    learningPatterns,
    recentAISessions,
    recentSubmissions: student.submissions.slice(0, 10),
    recentStudySessions: student.studySessions.slice(0, 10),

    // AI Insights
    aiInsights,

    // Teacher info
    teacher: student.teacher ? {
      name: `${student.teacher.user.firstName} ${student.teacher.user.lastName}`,
      email: student.teacher.user.email
    } : { name: 'Unknown', email: '' },

    // Student info
    student: {
      name: `${student.user.firstName} ${student.user.lastName}`,
      grade: student.class?.name || 'Grade 8',
      school: student.school?.name || ''
    }
  }

  return NextResponse.json(progressData)
})

function calculateStudyStreak(studySessions: any[]): number {
  if (studySessions.length === 0) return 0

  const sortedSessions = studySessions
    .map(s => new Date(s.startTime).toDateString())
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())

  let streak = 0
  let currentDate = new Date()

  for (let i = 0; i < 365; i++) { // Check up to a year
    const dateString = currentDate.toDateString()
    if (sortedSessions.includes(dateString)) {
      streak++
      currentDate.setDate(currentDate.getDate() - 1)
    } else {
      break
    }
  }

  return streak
}

function calculateSubjectPerformance(submissions: any[]): any[] {
  const subjectMap = new Map()

  submissions.forEach(submission => {
    const subject = submission.assignment.lessonPlan?.subject || 'General'
    if (!subjectMap.has(subject)) {
      subjectMap.set(subject, {
        subject,
        totalAssignments: 0,
        completedAssignments: 0,
        averageGrade: 0,
        totalGrade: 0
      })
    }

    const data = subjectMap.get(subject)
    data.totalAssignments++

    if (submission.status === 'SUBMITTED' || submission.status === 'GRADED') {
      data.completedAssignments++
    }

    if (submission.grade !== null) {
      data.totalGrade += submission.grade
    }
  })

  return Array.from(subjectMap.values()).map(data => ({
    ...data,
    averageGrade: data.completedAssignments > 0 ? data.totalGrade / data.completedAssignments : 0,
    completionRate: data.totalAssignments > 0 ? (data.completedAssignments / data.totalAssignments) * 100 : 0
  }))
}

function analyzeLearningPatterns(studySessions: any[], submissions: any[]): any {
  const hourlyPattern = new Array(24).fill(0)
  const dailyPattern = new Array(7).fill(0)
  const monthlyPattern = new Array(12).fill(0)

  studySessions.forEach(session => {
    const date = new Date(session.startTime)
    hourlyPattern[date.getHours()] += session.duration
    dailyPattern[date.getDay()] += session.duration
    monthlyPattern[date.getMonth()] += session.duration
  })

  return {
    peakStudyHour: hourlyPattern.indexOf(Math.max(...hourlyPattern)),
    peakStudyDay: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][
      dailyPattern.indexOf(Math.max(...dailyPattern))
    ],
    monthlyTrend: monthlyPattern,
    averageSessionDuration: studySessions.length > 0 
      ? studySessions.reduce((sum, s) => sum + s.duration, 0) / studySessions.length 
      : 0,
    totalSessions: studySessions.length
  }
}

async function generateAIProgressInsights(data: any): Promise<any> {
  const fallback = {
    analysis: 'Keep up the great work! Your learning progress is being tracked. Complete more assignments and study sessions to see detailed AI insights.',
    recommendations: ['Set a daily study goal of at least 30 minutes', 'Ask the AI tutor when you get stuck', 'Review completed assignments before tests'],
    strengths: ['Consistent engagement', 'Using AI tools for learning'],
    areasForImprovement: ['Study more consistently', 'Complete pending assignments on time']
  }

  try {
    // Only call AI if student has meaningful data to analyse
    if (data.completedAssignments === 0 && data.totalStudyTime === 0) {
      return fallback
    }

    const summary = `Student metrics: weeklyStudy=${data.weeklyStudyTime}min, avgGrade=${data.averageGrade?.toFixed(1)||'N/A'}%, completed=${data.completedAssignments}, pending=${data.pendingAssignments}, overdue=${data.overdueAssignments}, streak=${data.studyStreak}days`

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 8000)

    const aiResponse = await Promise.race([
      OpenAIService.generateText([
        {
          role: 'system',
          content: 'You are an AI educational analyst for ElimuNova. Analyse this student\'s data and give concise, encouraging insights in 2-3 sentences. Be specific and actionable.',
        },
        { role: 'user', content: summary },
      ], { maxTokens: 300, temperature: 0.7 }),
      new Promise<string>((_, reject) => setTimeout(() => reject(new Error('timeout')), 8000))
    ])

    clearTimeout(timeout)

    return {
      analysis: aiResponse as string,
      recommendations: [
        data.pendingAssignments > 0 ? `Complete ${data.pendingAssignments} pending assignment${data.pendingAssignments > 1 ? 's' : ''}` : 'Keep submitting assignments on time',
        data.weeklyStudyTime < 120 ? 'Increase weekly study time to at least 2 hours' : 'Maintain your current study rhythm',
        'Use the AI tutor for subjects you find challenging',
      ],
      strengths: [
        data.studyStreak > 3 ? `${data.studyStreak}-day study streak — great consistency!` : 'Engaged with the platform',
        data.completedAssignments > 0 ? `${data.completedAssignments} assignment${data.completedAssignments > 1 ? 's' : ''} completed` : 'Starting your learning journey',
      ],
      areasForImprovement: [
        data.overdueAssignments > 0 ? `${data.overdueAssignments} overdue assignment${data.overdueAssignments > 1 ? 's' : ''} need attention` : 'Keep assignments on track',
        data.weeklyStudyTime < 60 ? 'Increase daily study time' : 'Maintain your study schedule',
      ]
    }
  } catch (error) {
    return fallback
  }
}

// POST — update quiz results for the student
export const POST = route({ auth: 'STUDENT' }, async (request, { user }) => {
  const { subject, topic, totalQuestions, correctAnswers, masteryScore } = await request.json()

  const student = await prisma.student.findUnique({ where: { userId: user.id }, include: { teacher: true } })
  if (!student?.teacherId) return NextResponse.json({ error: 'Student not found' }, { status: 404 })

  // Upsert StudentProgress for this subject+topic
  const existing = await prisma.studentProgress.findFirst({
    where: { studentId: student.id, subject: subject || 'General', topic: topic || 'General' },
  })

  if (existing) {
    await prisma.studentProgress.update({
      where: { id: existing.id },
      data: {
        totalQuestions: { increment: totalQuestions || 0 },
        correctAnswers: { increment: correctAnswers || 0 },
        masteryScore: masteryScore ?? existing.masteryScore,
        lastPracticedAt: new Date(),
      },
    })
  } else {
    await prisma.studentProgress.create({
      data: {
        studentId: student.id,
        teacherId: student.teacherId,
        subject: subject || 'General',
        topic: topic || 'General',
        totalQuestions: totalQuestions || 0,
        correctAnswers: correctAnswers || 0,
        masteryScore: masteryScore || 0,
        lastPracticedAt: new Date(),
      },
    })
  }

  return NextResponse.json({ success: true })
})
