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
        class: true,
        teacher: {
          include: {
            user: true
          }
        },
        school: true
      }
    })

    if (!student || !student.class) {
      return NextResponse.json({ error: 'Student or class not found' }, { status: 404 })
    }

    // Get upcoming schedules for the next 7 days
    const now = new Date()
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

    const upcomingSchedules = await prisma.schedule.findMany({
      where: {
        classId: student.class.id,
        startTime: {
          gte: now,
          lte: nextWeek
        }
      },
      include: {
        class: true,
        teacher: {
          include: {
            user: true
          }
        }
      },
      orderBy: {
        startTime: 'asc'
      }
    })

    // Get recent study sessions
    const recentStudySessions = await prisma.studySession.findMany({
      where: {
        studentId: student.id
      },
      orderBy: {
        startTime: 'desc'
      },
      take: 10
    })

    // Get recent assignments
    const recentAssignments = await prisma.assignment.findMany({
      where: {
        classId: student.class.id
      },
      include: {
        lessonPlan: true
      },
      orderBy: {
        dueDate: 'asc'
      },
      take: 10
    })

    // Generate AI insights
    const aiInsights = await generateAIScheduleInsights({
      student,
      upcomingSchedules,
      recentStudySessions,
      recentAssignments
    })

    // Calculate schedule statistics
    const today = new Date()
    const todaySchedules = upcomingSchedules.filter(schedule => 
      new Date(schedule.startTime).toDateString() === today.toDateString()
    )

    const thisWeekSchedules = upcomingSchedules.filter(schedule => {
      const scheduleDate = new Date(schedule.startTime)
      const weekStart = new Date(today)
      weekStart.setDate(today.getDate() - today.getDay())
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekStart.getDate() + 6)
      return scheduleDate >= weekStart && scheduleDate <= weekEnd
    })

    const scheduleStats = {
      todayCount: todaySchedules.length,
      thisWeekCount: thisWeekSchedules.length,
      totalUpcoming: upcomingSchedules.length,
      classTypes: [...new Set(upcomingSchedules.map(s => s.type))],
      subjects: [...new Set(upcomingSchedules.map(s => s.subject).filter(Boolean))],
      teachers: [...new Set(upcomingSchedules.map(s => s.teacher.user.firstName + ' ' + s.teacher.user.lastName))]
    }

    const insights = {
      aiInsights,
      scheduleStats,
      upcomingSchedules: upcomingSchedules.map(schedule => ({
        id: schedule.id,
        title: schedule.title,
        description: schedule.description,
        subject: schedule.subject,
        grade: schedule.grade,
        startTime: schedule.startTime.toISOString(),
        endTime: schedule.endTime.toISOString(),
        location: schedule.location,
        type: schedule.type,
        status: schedule.status,
        recurring: schedule.recurring,
        teacher: {
          name: `${schedule.teacher.user.firstName} ${schedule.teacher.user.lastName}`,
          email: schedule.teacher.user.email
        },
        class: schedule.class
      })),
      student: {
        name: `${student.user.firstName} ${student.user.lastName}`,
        grade: student.class.name,
        school: student.school.name
      }
    }

    return NextResponse.json(insights)

  } catch (error) {
    console.error('Error fetching schedule insights:', error)
    return NextResponse.json(
      { error: 'Failed to fetch schedule insights' },
      { status: 500 }
    )
  }
}

async function generateAIScheduleInsights(data: any): Promise<any> {
  try {
    const context = {
      student: data.student,
      upcomingSchedules: data.upcomingSchedules,
      recentStudySessions: data.recentStudySessions,
      recentAssignments: data.recentAssignments
    }

    const aiResponse = await OpenAIService.generateAITutorResponse({
      sessionType: 'progress_review',
      question: 'Please analyze my upcoming schedule and provide insights, recommendations, and study planning advice based on my classes, assignments, and study patterns.',
      context,
      student: data.student
    })

    return {
      analysis: aiResponse,
      recommendations: [
        'Review your schedule daily to stay organized',
        'Prepare materials before each class',
        'Use study breaks between classes effectively',
        'Set reminders for important deadlines'
      ],
      studyTips: [
        'Create a study plan based on your class schedule',
        'Use time between classes for quick reviews',
        'Prepare questions for your teachers in advance',
        'Take notes during each class session'
      ],
      upcomingFocus: [
        'Pay attention to upcoming exams and assignments',
        'Prepare for class discussions and presentations',
        'Review previous lessons before new classes',
        'Stay engaged during all scheduled activities'
      ]
    }
  } catch (error) {
    console.error('Error generating AI schedule insights:', error)
    return {
      analysis: 'AI analysis temporarily unavailable. Your schedule looks well-organized!',
      recommendations: ['Stay on top of your schedule', 'Prepare for upcoming classes'],
      studyTips: ['Review your schedule daily', 'Plan your study time effectively'],
      upcomingFocus: ['Focus on upcoming classes', 'Stay organized and prepared']
    }
  }
}

