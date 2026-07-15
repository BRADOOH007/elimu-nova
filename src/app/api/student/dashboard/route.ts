import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma, withRetry } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    console.log('📊 Fetching student dashboard data...')
    const session = await getServerSession(authOptions)
    
    console.log('Session:', session?.user?.email, session?.user?.role)
    
    if (!session || session.user.role !== 'STUDENT') {
      console.log('❌ Unauthorized - not a student')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('🔍 Looking for student with userId:', session.user.id)
    
    // Get student profile
    let student = await withRetry(() => prisma.student.findUnique({
      where: { userId: session.user.id },
      include: {
        user: true,
        school: true,
        teacher: {
          include: {
            user: true
          }
        },
        class: true,
        analytics: true
      }
    }))

    // If no student profile exists, create one for independent learning
    if (!student) {
      console.log('🆕 Creating independent student profile for userId:', session.user.id)
      student = await prisma.student.create({
        data: {
          userId: session.user.id,
          // schoolId, teacherId, and classId are optional and will be undefined
        },
        include: {
          user: true,
          school: true,
          teacher: {
            include: {
              user: true
            }
          },
          class: true,
          analytics: true
        }
      })
      console.log('✅ Created independent student profile')
    }

    if (!student) {
      console.log('❌ Failed to create or find student profile')
      return NextResponse.json({ error: 'Failed to create student profile' }, { status: 500 })
    }
    
    console.log('✅ Found student:', student.user.email)

    // Get assignments data (for independent students, this might be empty)
    const assignments = await prisma.assignment.findMany({
      where: {
        students: {
          some: {
            id: student.id
          }
        }
      },
      include: {
        teacher: {
          include: {
            user: true
          }
        },
        submissions: {
          where: {
            studentId: student.id
          }
        },
        lessonPlan: {
          select: {
            subject: true
          }
        }
      },
      orderBy: {
        dueDate: 'asc'
      }
    })

    // Get study sessions for the current week
    const startOfWeek = new Date()
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay())
    startOfWeek.setHours(0, 0, 0, 0)

    const endOfWeek = new Date(startOfWeek)
    endOfWeek.setDate(endOfWeek.getDate() + 7)

    // Get study sessions for the current week (might be empty for new independent students)
    let studySessions: any[] = []
    let aiTutorSessions: any[] = []
    
    try {
      studySessions = await prisma.studySession.findMany({
        where: {
          studentId: student.id,
          startTime: {
            gte: startOfWeek,
            lt: endOfWeek
          }
        },
        orderBy: {
          startTime: 'desc'
        }
      })
    } catch (error) {
      console.log('Study sessions table might not exist, skipping...')
    }

    // Get recent AI tutor sessions (might be empty for new independent students)
    try {
      aiTutorSessions = await prisma.aITutorSession.findMany({
        where: {
          studentId: student.id
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 5
      })
    } catch (error) {
      console.log('AI tutor sessions table might not exist, skipping...')
    }

    // Calculate analytics
    const totalStudyTime = studySessions.reduce((total, session) => total + session.duration, 0)
    
    const completedAssignments = assignments.filter(assignment => 
      assignment.submissions.some(submission => submission.status === 'GRADED')
    ).length

    const pendingAssignments = assignments.filter(assignment => 
      !assignment.submissions.some(submission => submission.status === 'GRADED') &&
      assignment.dueDate > new Date()
    ).length

    const overdueAssignments = assignments.filter(assignment => 
      !assignment.submissions.some(submission => submission.status === 'GRADED') &&
      assignment.dueDate <= new Date()
    ).length

    // Calculate average grade
    const gradedSubmissions = assignments.flatMap(assignment => 
      assignment.submissions.filter(submission => submission.grade !== null)
    )
    
    const averageGrade = gradedSubmissions.length > 0 
      ? gradedSubmissions.reduce((sum, submission) => sum + (submission.grade || 0), 0) / gradedSubmissions.length
      : null

    // Get upcoming lessons (from schedules)
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(23, 59, 59, 999)

    // Get upcoming lessons (only if student has school association)
    const upcomingLessons = student.schoolId ? await prisma.schedule.findMany({
      where: {
        schoolId: student.schoolId,
        startTime: {
          gte: today,
          lte: tomorrow
        },
        type: 'CLASS'
      },
      include: {
        teacher: {
          include: {
            user: true
          }
        },
        class: true
      },
      orderBy: {
        startTime: 'asc'
      }
    }) : []

    // Update or create analytics record (safely handle if table doesn't exist)
    const analyticsData = {
      totalStudyTime: student.analytics?.totalStudyTime || 0,
      averageGrade: averageGrade,
      completedAssignments,
      pendingAssignments,
      overdueAssignments,
      lastActiveDate: new Date(),
      weeklyGoal: student.analytics?.weeklyGoal || 300,
      monthlyGoal: student.analytics?.monthlyGoal || 1200,
      streakDays: student.analytics?.streakDays || 0,
      longestStreak: student.analytics?.longestStreak || 0
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

    // Prepare dashboard data
    const dashboardData = {
      student: {
        id: student.id,
        name: `${student.user.firstName} ${student.user.lastName}`,
        email: student.user.email,
        school: student.school?.name || 'Independent Learning',
        teacher: student.teacher ? `${student.teacher.user.firstName} ${student.teacher.user.lastName}` : 'Self-directed',
        class: student.class?.name || 'Independent Study'
      },
      stats: {
        activeAssignments: pendingAssignments,
        completedAssignments,
        averageGrade: averageGrade ? Math.round(averageGrade) : null,
        studyTime: totalStudyTime,
        overdueAssignments
      },
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

    return NextResponse.json(dashboardData)

  } catch (error) {
    console.error('Error fetching student dashboard data:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch dashboard data',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
