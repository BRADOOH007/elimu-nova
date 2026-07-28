import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { route } from '@/lib/api-middleware'

export const GET = route({ auth: 'TEACHER' }, async (req, { user }) => {
  try {
    // Get teacher's school ID
    const teacher = await prisma.teacher.findUnique({
      where: { userId: user.id }
    })

    if (!teacher) {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 })
    }

    const { searchParams } = new URL(req.url)
    const period = searchParams.get('period') || '30' // days
    const classId = searchParams.get('classId') || ''

    const startDate = new Date()
    startDate.setDate(startDate.getDate() - parseInt(period))

    // Build where clause for class filtering
    const whereClause: any = {
      student: {
        class: {
          teacherId: teacher.id
        }
      }
    }

    if (classId && classId !== 'all') {
      whereClause.student = {
        classId: classId,
        class: {
          teacherId: teacher.id
        }
      }
    }

    // Get AI insights from student progress and submissions - with error handling
    const [studentProgress, submissions, assignments] = await Promise.all([
      prisma.studentProgress.findMany({
        where: {
          ...whereClause,
          createdAt: {
            gte: startDate
          }
        },
        include: {
          student: {
            include: {
              class: true,
              user: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      }).catch(() => []),
      
      prisma.submission.findMany({
        where: {
          assignment: {
            teacherId: teacher.id
          },
          submittedAt: {
            gte: startDate
          }
        },
        include: {
          student: {
            include: {
              class: true,
              user: true
            }
          },
          assignment: true
        },
        orderBy: {
          submittedAt: 'desc'
        }
      }).catch(() => []),
      
      prisma.assignment.findMany({
        where: {
          teacherId: teacher.id,
          createdAt: {
            gte: startDate
          }
        },
        include: {
          submissions: {
            include: {
              student: {
                include: {
                  user: true
                }
              }
            }
          }
        }
      }).catch(() => [])
    ])

    // Process AI insights
    const insights = []

    // 1. Student Performance Insights
    const studentPerformance = studentProgress.map(p => {
      const sp = p as any
      return {
        type: 'performance',
        studentName: `${sp.student.user.firstName} ${sp.student.user.lastName}`,
        className: sp.student.class?.name,
        subject: sp.subject,
        progress: sp.progress,
        notes: sp.notes,
        recommendation: sp.progress < 50 ? 
          'Student needs additional support and intervention' :
          sp.progress < 75 ? 
          'Student is progressing but may benefit from extra practice' :
          'Student is performing well and on track',
        priority: sp.progress < 50 ? 'high' : sp.progress < 75 ? 'medium' : 'low',
        createdAt: sp.createdAt
      }
    })

    // 2. Assignment Completion Insights
    const assignmentInsights = assignments.map(assignment => {
      const totalSubmissions = assignment.submissions.length
      const completedSubmissions = assignment.submissions.filter(s => s.status === 'SUBMITTED').length
      const completionRate = totalSubmissions > 0 ? (completedSubmissions / totalSubmissions) * 100 : 0
      const averageGrade = completedSubmissions > 0 ?
        assignment.submissions
          .filter(s => s.status === 'SUBMITTED' && s.grade !== null)
          .reduce((sum, s) => sum + (s.grade || 0), 0) / completedSubmissions : 0

      return {
        type: 'assignment',
        assignmentTitle: assignment.title,
        completionRate,
        averageGrade,
        totalStudents: totalSubmissions,
        completedStudents: completedSubmissions,
        recommendation: completionRate < 60 ? 
          'Assignment may be too difficult or unclear - consider reviewing instructions' :
          completionRate < 80 ? 
          'Most students are completing - consider additional support for struggling students' :
          'Assignment is well-received and appropriately challenging',
        priority: completionRate < 60 ? 'high' : completionRate < 80 ? 'medium' : 'low',
        createdAt: assignment.createdAt
      }
    })

    // 3. Submission Quality Insights
    const submissionInsights = submissions.map(s => {
      const sub = s as any
      const grade = sub.grade || 0
      const isLate = sub.submittedAt && sub.assignment.dueDate && 
        new Date(sub.submittedAt) > new Date(sub.assignment.dueDate)
      
      return {
        type: 'submission',
        studentName: `${sub.student.user.firstName} ${sub.student.user.lastName}`,
        assignmentTitle: sub.assignment.title,
        grade,
        isLate,
        quality: grade >= 90 ? 'excellent' : grade >= 75 ? 'good' : grade >= 60 ? 'fair' : 'needs_improvement',
        recommendation: grade < 60 ? 
          'Student needs immediate intervention and additional support' :
          grade < 75 ? 
          'Student would benefit from targeted practice and feedback' :
          grade < 90 ? 
          'Student is performing adequately with room for improvement' :
          'Student is excelling - consider advanced challenges',
        priority: grade < 60 ? 'high' : grade < 75 ? 'medium' : 'low',
        createdAt: sub.createdAt
      }
    })

    // Combine all insights
    insights.push(...studentPerformance, ...assignmentInsights, ...submissionInsights)

    // Sort by priority and date
    insights.sort((a, b) => {
      const priorityOrder: Record<string, number> = { high: 3, medium: 2, low: 1 }
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[b.priority] - priorityOrder[a.priority]
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })

    // Generate summary insights
    const summaryInsights = {
      totalInsights: insights.length,
      highPriority: insights.filter(i => i.priority === 'high').length,
      mediumPriority: insights.filter(i => i.priority === 'medium').length,
      lowPriority: insights.filter(i => i.priority === 'low').length,
      performanceInsights: studentPerformance.length,
      assignmentInsights: assignmentInsights.length,
      submissionInsights: submissionInsights.length
    }

    return NextResponse.json({
      insights: insights.slice(0, 50), // Limit to 50 most recent insights
      summary: summaryInsights,
      period: parseInt(period),
      classId: classId || 'all'
    })

  } catch (error) {
    console.error('Error fetching AI insights:', error)
    return NextResponse.json(
      { error: 'Failed to fetch AI insights' },
      { status: 500 }
    )
  }
})
