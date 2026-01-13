import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { OpenAIService } from '@/lib/openai-service'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get student data
    const student = await prisma.student.findUnique({
      where: { userId: session.user.id },
      include: {
        user: true,
        teacher: {
          include: {
            user: true
          }
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
              include: {
                lessonPlan: true
              }
            }
          },
          orderBy: { submittedAt: 'desc' },
          take: 50
        },
        assignments: {
          include: {
            lessonPlan: true
          },
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
    const completedAssignments = student.submissions.filter(s => s.status === 'submitted').length
    const pendingAssignments = student.assignments.filter(a => 
      a.dueDate > new Date() && 
      !student.submissions.some(s => s.assignmentId === a.id && s.status === 'submitted')
    ).length
    const overdueAssignments = student.assignments.filter(a => 
      a.dueDate < new Date() && 
      !student.submissions.some(s => s.assignmentId === a.id && s.status === 'submitted')
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
      teacher: {
        name: `${student.teacher.user.firstName} ${student.teacher.user.lastName}`,
        email: student.teacher.user.email
      },

      // Student info
      student: {
        name: `${student.user.firstName} ${student.user.lastName}`,
        grade: student.class?.name || 'Grade 8',
        school: student.school.name
      }
    }

    return NextResponse.json(progressData)

  } catch (error) {
    console.error('Error fetching student progress:', error)
    return NextResponse.json(
      { error: 'Failed to fetch progress data' },
      { status: 500 }
    )
  }
}

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
    
    if (submission.status === 'submitted') {
      data.completedAssignments++
    }
    
    if (submission.grade !== null) {
      data.totalGrade += submission.grade
    }
  })

  return Array.from(subjectMap.values()).map(data => ({
    ...data,
    averageGrade: data.totalGrade > 0 ? data.totalGrade / data.completedAssignments : 0,
    completionRate: (data.completedAssignments / data.totalAssignments) * 100
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
  try {
    const context = {
      student: data.student,
      metrics: {
        weeklyStudyTime: data.weeklyStudyTime,
        monthlyStudyTime: data.monthlyStudyTime,
        averageGrade: data.averageGrade,
        completedAssignments: data.completedAssignments,
        pendingAssignments: data.pendingAssignments,
        overdueAssignments: data.overdueAssignments,
        studyStreak: data.studyStreak,
        aiHelpRequests: data.aiHelpRequests
      },
      subjectPerformance: data.subjectPerformance,
      learningPatterns: data.learningPatterns,
      recentAISessions: data.recentAISessions
    }

    const aiResponse = await OpenAIService.generateAITutorResponse({
      sessionType: 'progress_review',
      question: 'Please provide comprehensive progress analysis and recommendations for this student',
      context,
      student: data.student
    })

    return {
      analysis: aiResponse,
      recommendations: [
        'Focus on improving study consistency',
        'Set specific daily study goals',
        'Use AI tutor for difficult topics',
        'Review completed assignments regularly'
      ],
      strengths: [
        'Good study streak',
        'Active AI tutor usage',
        'Consistent assignment completion'
      ],
      areasForImprovement: [
        'Time management',
        'Subject balance',
        'Study technique optimization'
      ]
    }
  } catch (error) {
    console.error('Error generating AI insights:', error)
    return {
      analysis: 'AI analysis temporarily unavailable. Your progress looks good overall!',
      recommendations: ['Continue your current study routine', 'Ask AI tutor for help when needed'],
      strengths: ['Consistent learning', 'Good engagement'],
      areasForImprovement: ['Keep up the great work!']
    }
  }
}
