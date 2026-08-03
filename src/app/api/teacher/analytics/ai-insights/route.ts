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

    // 4. At-Risk Student Detection (cross-signal)
    const studentSignals: Record<string, { name: string; className: string; grades: number[]; lateCount: number; missingCount: number; subject: string }> = {}
    for (const p of studentProgress) {
      const sp = p as any
      const sid = sp.studentId
      if (!studentSignals[sid]) {
        studentSignals[sid] = {
          name: `${sp.student.user.firstName} ${sp.student.user.lastName}`,
          className: sp.student.class?.name || '',
          grades: [],
          lateCount: 0,
          missingCount: 0,
          subject: sp.subject || '',
        }
      }
      if (sp.progress != null) studentSignals[sid].grades.push(sp.progress)
    }
    for (const s of submissions) {
      const sub = s as any
      const sid = sub.studentId
      if (!studentSignals[sid]) {
        studentSignals[sid] = {
          name: `${sub.student.user.firstName} ${sub.student.user.lastName}`,
          className: sub.student.class?.name || '',
          grades: [],
          lateCount: 0,
          missingCount: 0,
          subject: sub.assignment?.subject || '',
        }
      }
      if (sub.grade != null) studentSignals[sid].grades.push(sub.grade)
      const isLate = sub.submittedAt && sub.assignment?.dueDate && new Date(sub.submittedAt) > new Date(sub.assignment.dueDate)
      if (isLate) studentSignals[sid].lateCount++
    }

    const atRiskStudents = Object.entries(studentSignals)
      .map(([sid, sig]) => {
        const avgGrade = sig.grades.length > 0 ? sig.grades.reduce((a, b) => a + b, 0) / sig.grades.length : 0
        const riskScore = (avgGrade < 50 ? 3 : avgGrade < 65 ? 2 : 0) + (sig.lateCount >= 3 ? 2 : sig.lateCount >= 2 ? 1 : 0)
        return { sid, ...sig, avgGrade, riskScore }
      })
      .filter(s => s.riskScore >= 3 && s.grades.length > 0)
      .sort((a, b) => b.riskScore - a.riskScore)

    if (atRiskStudents.length > 0) {
      insights.push({
        type: 'at_risk_students',
        priority: 'high',
        title: `${atRiskStudents.length} Student${atRiskStudents.length !== 1 ? 's' : ''} At Risk`,
        message: `${atRiskStudents.length} student${atRiskStudents.length !== 1 ? 's show' : ' shows'} multiple risk signals (low grades + late submissions).`,
        recommendation: 'Schedule one-on-one check-ins and consider differentiated instruction for these students.',
        students: atRiskStudents.slice(0, 8).map(s => ({
          name: s.name,
          className: s.className,
          avgGrade: Math.round(s.avgGrade),
          lateCount: s.lateCount,
          subject: s.subject,
        })),
        createdAt: new Date(),
      })
    }

    // 5. Differentiated Instruction Suggestions
    const classGroups: Record<string, { high: string[]; mid: string[]; low: string[] }> = {}
    for (const [sid, sig] of Object.entries(studentSignals)) {
      const cls = sig.className || 'Unknown'
      if (!classGroups[cls]) classGroups[cls] = { high: [], mid: [], low: [] }
      const avg = sig.grades.length > 0 ? sig.grades.reduce((a, b) => a + b, 0) / sig.grades.length : 0
      if (avg >= 75) classGroups[cls].high.push(sig.name)
      else if (avg >= 50) classGroups[cls].mid.push(sig.name)
      else classGroups[cls].low.push(sig.name)
    }

    for (const [cls, groups] of Object.entries(classGroups)) {
      const total = groups.high.length + groups.mid.length + groups.low.length
      if (total < 5) continue
      const lowPct = Math.round((groups.low.length / total) * 100)
      if (lowPct > 30) {
        insights.push({
          type: 'differentiated_instruction',
          priority: 'medium',
          title: `Differentiation Needed in ${cls}`,
          message: `${lowPct}% of students in ${cls} are performing below 50%. Consider tiered instruction.`,
          recommendation: `Group students by ability: ${groups.low.length} students need scaffolded support, ${groups.mid.length} need standard instruction, ${groups.high.length} need extension activities.`,
          createdAt: new Date(),
        })
      }
    }

    // 6. Class-Level Performance Summary
    for (const [cls, groups] of Object.entries(classGroups)) {
      const total = groups.high.length + groups.mid.length + groups.low.length
      if (total === 0) continue
      const avgMastery = Math.round(((groups.high.length * 85) + (groups.mid.length * 62) + (groups.low.length * 35)) / total)
      insights.push({
        type: 'class_summary',
        priority: 'low',
        title: `${cls} Performance Distribution`,
        message: `${groups.high.length} high, ${groups.mid.length} medium, ${groups.low.length} low performers. Estimated class mastery: ${avgMastery}%.`,
        recommendation: avgMastery < 50 ? 'Consider re-teaching key concepts with varied approaches.' : 'Maintain current pace with targeted support for struggling students.',
        createdAt: new Date(),
      })
    }

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
      submissionInsights: submissionInsights.length,
      atRiskStudents: atRiskStudents.length,
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
