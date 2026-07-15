import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get teacher's school ID
    const teacher = await prisma.teacher.findUnique({
      where: { userId: session.user.id }
    })

    if (!teacher) {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 })
    }

    console.log('Analytics API - Teacher found:', teacher.id, 'School ID:', teacher.schoolId)

    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || '30' // days
    const classId = searchParams.get('classId') || ''

    const startDate = new Date()
    startDate.setDate(startDate.getDate() - parseInt(period))

    // Build where clause for class filtering
    const whereClause: any = {
      teacherId: teacher.id
    }

    if (classId && classId !== 'all') {
      whereClause.classId = classId
    }

    // Get analytics data with proper error handling
    const [
      totalStudents,
      totalAssignments,
      completedAssignments,
      averageGrade,
      activeStudents,
      totalHours,
      studentProgress,
      assignmentStats,
      recentActivity,
      aiInsights
    ] = await Promise.all([
      // Total students
      prisma.student.count({
        where: {
          class: {
            teacherId: teacher.id
          }
        }
      }).catch(() => 0),
      
      // Total assignments
      prisma.assignment.count({
        where: whereClause
      }).catch(() => 0),
      
      // Completed assignments (count all submissions for now)
      prisma.submission.count({
        where: {
          assignment: whereClause
        }
      }).catch(() => 0),
      
      // Average grade
      prisma.submission.aggregate({
        where: {
          assignment: whereClause,
          grade: { not: null }
        },
        _avg: {
          grade: true
        }
      }).catch(() => ({ _avg: { grade: 0 } })),
      
      // Active students (students who submitted assignments in the period)
      prisma.student.count({
        where: {
          class: {
            teacherId: teacher.id
          },
          submissions: {
            some: {
              submittedAt: {
                gte: startDate
              }
            }
          }
        }
      }).catch(() => 0),
      
      // Total hours (placeholder - will be calculated later)
      Promise.resolve(0),
      
      // Student progress data
      prisma.student.findMany({
        where: {
          class: {
            teacherId: teacher.id
          }
        },
        include: {
          user: true,
          submissions: {
            where: {
              submittedAt: {
                gte: startDate
              }
            },
            include: {
              assignment: true
            }
          },
          class: true
        },
        take: 10
      }).catch(() => []),
      
      // Assignment statistics
      prisma.assignment.findMany({
        where: whereClause,
        include: {
          submissions: {
            where: {
              submittedAt: {
                gte: startDate
              }
            }
          }
        },
        take: 10
      }).catch(() => []),
      
      // Recent activity - with error handling
      prisma.activity.findMany({
        where: {
          schoolId: teacher.schoolId ?? undefined,
          type: {
            in: ['STUDENT_ENROLLED', 'USER_LOGIN', 'OTHER']
          },
          createdAt: {
            gte: startDate
          }
        },
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 10
      }).catch(() => []),
      
      // AI insights (from student progress and submissions) - with error handling
      prisma.studentProgress.findMany({
        where: {
          student: {
            class: {
              teacherId: teacher.id
            }
          },
          createdAt: {
            gte: startDate
          }
        },
        include: {
          student: {
            include: {
              user: true,
              class: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 20
      }).catch(() => [])
    ])

    // Calculate completion rate
    const completionRate = totalAssignments > 0 ? (completedAssignments / totalAssignments) * 100 : 0

    // Calculate total hours from schedules - with error handling
    const schedules = await prisma.schedule.findMany({
      where: {
        teacherId: teacher.id,
        startTime: {
          gte: startDate
        },
        type: 'CLASS'
      },
      select: {
        startTime: true,
        endTime: true
      }
    }).catch(() => [])

    const calculatedTotalHours = schedules.reduce((total, schedule) => {
      const duration = (schedule.endTime.getTime() - schedule.startTime.getTime()) / (1000 * 60 * 60)
      return total + duration
    }, 0)

    // Process student progress for AI insights
    const processedAiInsights = (aiInsights as any[]).map(p => ({
      id: p.id,
      studentName: p.student?.user ? `${p.student.user.firstName} ${p.student.user.lastName}` : 'Unknown Student',
      className: p.student?.class?.name || 'No Class',
      subject: p.subject || 'Unknown Subject',
      progress: p.progress || 0,
      notes: p.notes || '',
      submittedAt: p.createdAt
    }))

    // Process assignment statistics
    const processedAssignmentStats = assignmentStats.map(assignment => ({
      id: assignment.id,
      title: assignment.title,
      totalSubmissions: assignment.submissions.length,
      completionRate: assignment.submissions.length > 0 ? 
        (assignment.submissions.length / assignment.submissions.length) * 100 : 0,
      averageGrade: assignment.submissions.length > 0 ?
        assignment.submissions.reduce((sum, s) => sum + (s.grade || 0), 0) / assignment.submissions.length : 0
    }))

    // Process recent activity
    const processedRecentActivity = (recentActivity as any[]).map(a => ({
      id: a.id,
      type: a.type,
      description: a.description,
      user: a.user ? `${a.user.firstName} ${a.user.lastName}` : 'System',
      submittedAt: a.createdAt
    }))

    const result = {
      analytics: {
        totalStudents,
        totalAssignments,
        completedAssignments,
        averageGrade: averageGrade._avg.grade || 0,
        completionRate: Math.round(completionRate * 100) / 100,
        activeStudents,
        totalHours: Math.round(calculatedTotalHours * 100) / 100
      },
      studentProgress: studentProgress.map(student => ({
        id: student.id,
        name: student.user ? `${student.user.firstName} ${student.user.lastName}` : 'Unknown Student',
        className: student.class?.name || 'No Class',
        totalSubmissions: student.submissions.length,
        averageGrade: student.submissions.length > 0 ?
          student.submissions.reduce((sum, s) => sum + (s.grade || 0), 0) / student.submissions.length : 0,
        lastActivity: student.submissions.length > 0 ?
          student.submissions.sort((a, b) => b.submittedAt.getTime() - a.submittedAt.getTime())[0].submittedAt : null
      })),
      assignmentStats: processedAssignmentStats,
      recentActivity: processedRecentActivity,
      aiInsights: processedAiInsights
    }

    console.log('Analytics API - Returning data:', JSON.stringify(result, null, 2))
    return NextResponse.json(result)

  } catch (error) {
    console.error('Error fetching analytics:', error)
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    console.error('Error message:', error instanceof Error ? error.message : String(error))
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch analytics data',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}