import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { route } from '@/lib/api-middleware'

// GET - Fetch student progress for teacher
export const GET = route({ auth: 'TEACHER' }, async (req, { user }) => {
  try {
    const { searchParams } = new URL(req.url)
    const studentId = searchParams.get('studentId')
    const period = searchParams.get('period') || 'week'

    // Get teacher profile
    const teacher = await prisma.teacher.findUnique({
      where: { userId: user.id }
    })

    if (!teacher) {
      return NextResponse.json({ error: 'Teacher profile not found' }, { status: 404 })
    }

    // Calculate date range
    let startDate: Date
    const endDate = new Date()

    switch (period) {
      case 'week':
        startDate = new Date()
        startDate.setDate(startDate.getDate() - 7)
        break
      case 'month':
        startDate = new Date()
        startDate.setMonth(startDate.getMonth() - 1)
        break
      default:
        startDate = new Date('2020-01-01')
    }

    // Build where clause for students
    const whereClause: any = {
      teacherId: teacher.id
    }

    if (studentId) {
      whereClause.id = studentId
    }

    // Get students with their progress data
    const students = await prisma.student.findMany({
      where: whereClause,
      include: {
        user: true,
        class: true,
        analytics: true,
        studySessions: {
          where: {
            startTime: {
              gte: startDate,
              lte: endDate
            }
          },
          orderBy: {
            startTime: 'desc'
          }
        },
        assignments: {
          include: {
            submissions: {
              where: {
                studentId: {
                  in: studentId ? [studentId] : undefined
                }
              }
            }
          }
        },
        aiTutorSessions: {
          where: {
            createdAt: {
              gte: startDate,
              lte: endDate
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    })

    // Process student data
    const studentProgress = students.map(student => {
      const totalStudyTime = student.studySessions.reduce((total, session) => total + session.duration, 0)
      
      const completedAssignments = student.assignments.filter(assignment => 
        assignment.submissions.some(submission => submission.status === 'GRADED')
      ).length

      const pendingAssignments = student.assignments.filter(assignment => 
        !assignment.submissions.some(submission => submission.status === 'GRADED') &&
        assignment.dueDate > new Date()
      ).length

      const overdueAssignments = student.assignments.filter(assignment => 
        !assignment.submissions.some(submission => submission.status === 'GRADED') &&
        assignment.dueDate <= new Date()
      ).length

      // Calculate average grade
      const gradedSubmissions = student.assignments.flatMap(assignment => 
        assignment.submissions.filter(submission => submission.grade !== null)
      )
      
      const averageGrade = gradedSubmissions.length > 0 
        ? gradedSubmissions.reduce((sum, submission) => sum + (submission.grade || 0), 0) / gradedSubmissions.length
        : null

      return {
        id: student.id,
        name: `${student.user.firstName} ${student.user.lastName}`,
        email: student.user.email,
        class: student.class?.name || 'Not assigned',
        analytics: {
          totalStudyTime,
          averageGrade: averageGrade ? Math.round(averageGrade) : null,
          completedAssignments,
          pendingAssignments,
          overdueAssignments,
          lastActiveDate: student.analytics?.lastActiveDate,
          streakDays: student.analytics?.streakDays || 0
        },
        recentStudySessions: student.studySessions.slice(0, 5).map(session => ({
          id: session.id,
          subject: session.subject,
          topic: session.topic,
          duration: session.duration,
          startTime: session.startTime,
          notes: session.notes
        })),
        recentAITutorSessions: student.aiTutorSessions.slice(0, 3).map(session => ({
          id: session.id,
          sessionType: session.sessionType,
          subject: session.subject,
          topic: session.topic,
          question: session.question,
          rating: session.rating,
          isHelpful: session.isHelpful,
          createdAt: session.createdAt
        })),
        assignments: student.assignments.map(assignment => ({
          id: assignment.id,
          title: assignment.title,
          dueDate: assignment.dueDate,
          status: assignment.submissions.length > 0 ? 
            (assignment.submissions[0].status === 'GRADED' ? 'Completed' : 'Submitted') : 
            (assignment.dueDate < new Date() ? 'Overdue' : 'Pending'),
          grade: assignment.submissions.find(s => s.grade !== null)?.grade || null
        }))
      }
    })

    return NextResponse.json({
      students: studentProgress,
      period,
      summary: {
        totalStudents: students.length,
        averageStudyTime: studentProgress.reduce((sum, student) => sum + student.analytics.totalStudyTime, 0) / studentProgress.length || 0,
        averageGrade: studentProgress.filter(s => s.analytics.averageGrade).reduce((sum, student) => sum + (student.analytics.averageGrade || 0), 0) / studentProgress.filter(s => s.analytics.averageGrade).length || null
      }
    })

  } catch (error) {
    console.error('Error fetching student progress:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch student progress',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
})

// POST - Create notification for teacher about student progress
export const POST = route({ auth: 'TEACHER' }, async (req, { user }) => {
  try {
    const body = await req.json()
    const { studentId, type, message, priority = 'medium' } = body

    // Validate required fields
    if (!studentId || !type || !message) {
      return NextResponse.json({ 
        error: 'Missing required fields: studentId, type, message' 
      }, { status: 400 })
    }

    // Get teacher profile
    const teacher = await prisma.teacher.findUnique({
      where: { userId: user.id }
    })

    if (!teacher) {
      return NextResponse.json({ error: 'Teacher profile not found' }, { status: 404 })
    }

    // Verify student belongs to this teacher
    const student = await prisma.student.findFirst({
      where: {
        id: studentId,
        teacherId: teacher.id
      },
      include: {
        user: true
      }
    })

    if (!student) {
      return NextResponse.json({ error: 'Student not found or not assigned to this teacher' }, { status: 404 })
    }

    // Create notification for teacher
    const notification = await prisma.notification.create({
      data: {
        title: `Student Progress Update - ${student.user.firstName} ${student.user.lastName}`,
        message,
        type: priority,
        userId: user.id
      }
    })

    return NextResponse.json({
      success: true,
      notification
    }, { status: 201 })

  } catch (error) {
    console.error('Error creating teacher notification:', error)
    return NextResponse.json({ 
      error: 'Failed to create notification',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
})
