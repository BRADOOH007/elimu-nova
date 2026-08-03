import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { route } from '@/lib/api-middleware'

export const GET = route({ auth: 'SCHOOL_ADMIN' }, async (req, { user }) => {
  try {
    const schoolAdmin = await prisma.schoolAdmin.findUnique({
      where: { userId: user.id },
      select: { schoolId: true },
    })
    if (!schoolAdmin) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    const schoolId = schoolAdmin.schoolId

    const { searchParams } = new URL(req.url)
    const period = parseInt(searchParams.get('period') || '30')
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - period)

    const [teachers, students, classes, submissions, assignments, subscriptions, activities] = await Promise.all([
      prisma.teacher.findMany({
        where: { schoolId },
        include: {
          user: { select: { firstName: true, lastName: true, isActive: true, createdAt: true } },
          students: { include: { user: { select: { isActive: true } } } },
        },
      }).catch(() => []),
      prisma.student.findMany({
        where: { schoolId },
        include: {
          user: { select: { firstName: true, lastName: true, isActive: true, createdAt: true } },
          class: { select: { name: true } },
          analytics: { select: { averageGrade: true, pendingAssignments: true, streakDays: true } },
          studentProgress: { select: { masteryScore: true, xp: true, streak: true }, take: 1, orderBy: { createdAt: 'desc' } },
          submissions: {
            where: { submittedAt: { gte: startDate } },
            select: { grade: true, status: true, submittedAt: true },
          },
        },
      }).catch(() => []),
      prisma.class.findMany({
        where: { teacher: { schoolId } },
        include: {
          teacher: { include: { user: { select: { firstName: true, lastName: true } } } },
          _count: { select: { students: true } },
        },
      }).catch(() => []),
      prisma.submission.findMany({
        where: {
          assignment: { teacher: { schoolId } },
          submittedAt: { gte: startDate },
        },
        select: { grade: true, status: true, submittedAt: true, assignment: { select: { dueDate: true } } },
      }).catch(() => []),
      prisma.assignment.findMany({
        where: { teacher: { schoolId }, createdAt: { gte: startDate } },
        select: { id: true, createdAt: true },
      }).catch(() => []),
      prisma.subscription.findFirst({
        where: { schoolId },
        include: { package: true },
        orderBy: { createdAt: 'desc' },
      }).catch(null),
      prisma.activity.findMany({
        where: { schoolId, createdAt: { gte: startDate } },
        orderBy: { createdAt: 'desc' },
        take: 100,
      }).catch(() => []),
    ])

    const insights: any[] = []

    // 1. Teacher Productivity
    const teacherData = teachers.map(t => {
      const studentCount = t.students?.length || 0
      const activeStudents = t.students?.filter(s => s.user?.isActive)?.length || 0
      const utilization = studentCount > 0 ? Math.round((activeStudents / studentCount) * 100) : 0
      return {
        name: `${t.user.firstName} ${t.user.lastName}`,
        studentCount,
        activeStudents,
        utilization,
        joinDate: t.user.createdAt,
        isActive: t.user.isActive,
      }
    })
    const avgTeacherUtilization = teacherData.length > 0
      ? Math.round(teacherData.reduce((s, t) => s + t.utilization, 0) / teacherData.length)
      : 0
    if (avgTeacherUtilization < 50) {
      insights.push({
        type: 'teacher_productivity',
        priority: 'high',
        title: 'Low Teacher Utilization',
        message: `Average teacher utilization is ${avgTeacherUtilization}%. Many teachers have few active students.`,
        recommendation: 'Review teacher assignments and consider reallocating students for balanced workloads.',
      })
    }

    // 2. Student At-Risk (low grades, low activity)
    const atRiskStudents = students.filter(s => {
      const grade = s.analytics?.averageGrade ?? 0
      const pending = s.analytics?.pendingAssignments ?? 0
      return (grade > 0 && grade < 50) || pending > 5
    })
    if (atRiskStudents.length > 0) {
      insights.push({
        type: 'student_retention',
        priority: 'high',
        title: `${atRiskStudents.length} Student${atRiskStudents.length !== 1 ? 's' : ''} At Risk`,
        message: `${atRiskStudents.length} student${atRiskStudents.length !== 1 ? 's have' : ' has'} low grades or many overdue assignments and may need intervention.`,
        recommendation: 'Schedule parent-teacher meetings and consider targeted support programs.',
        students: atRiskStudents.slice(0, 5).map(s => ({
          name: `${s.user.firstName} ${s.user.lastName}`,
          grade: s.analytics?.averageGrade ?? null,
          pending: s.analytics?.pendingAssignments ?? 0,
          class: s.class?.name,
        })),
      })
    }

    // 3. Class Performance Spread
    const classPerformances = classes.map(c => {
      const classStudents = students.filter(s => s.class?.name === c.name)
      const avgGrade = classStudents.length > 0
        ? Math.round(classStudents.reduce((s, st) => s + (st.analytics?.averageGrade ?? 0), 0) / classStudents.length)
        : 0
      return { name: c.name, studentCount: c._count.students, avgGrade, teacher: `${c.teacher.user.firstName} ${c.teacher.user.lastName}` }
    })
    const sortedByGrade = [...classPerformances].sort((a, b) => a.avgGrade - b.avgGrade)
    if (sortedByGrade.length >= 2) {
      const gap = sortedByGrade[sortedByGrade.length - 1].avgGrade - sortedByGrade[0].avgGrade
      if (gap > 20) {
        insights.push({
          type: 'performance_gap',
          priority: 'medium',
          title: 'Significant Performance Gap Between Classes',
          message: `A ${gap}% performance gap exists between the highest and lowest performing classes.`,
          recommendation: 'Investigate teaching methods in lower-performing classes and share best practices.',
          details: sortedByGrade.slice(0, 3).map(c => `${c.name}: ${c.avgGrade}% avg`),
        })
      }
    }

    // 4. Submission Trends
    const totalSubs = submissions.length
    const lateSubs = submissions.filter(s => {
      const dueDate = (s as any).assignment?.dueDate
      return dueDate && s.submittedAt && new Date(s.submittedAt) > new Date(dueDate)
    }).length
    const lateRate = totalSubs > 0 ? Math.round((lateSubs / totalSubs) * 100) : 0
    if (lateRate > 25) {
      insights.push({
        type: 'submission_trends',
        priority: 'medium',
        title: 'High Late Submission Rate',
        message: `${lateRate}% of submissions in the last ${period} days were late.`,
        recommendation: 'Consider adjusting assignment deadlines or providing clearer time management guidance.',
      })
    }

    // 5. Enrollment Growth
    const newStudents = students.filter(s => s.user.createdAt >= startDate).length
    const newTeachers = teachers.filter(t => t.user.createdAt >= startDate).length
    if (newStudents === 0 && period >= 14) {
      insights.push({
        type: 'enrollment',
        priority: 'low',
        title: 'No New Student Enrollments',
        message: `No new students enrolled in the last ${period} days.`,
        recommendation: 'Review marketing efforts and consider outreach campaigns.',
      })
    }
    if (newStudents > 0 || newTeachers > 0) {
      insights.push({
        type: 'enrollment',
        priority: 'low',
        title: 'Enrollment Activity',
        message: `${newStudents} new student${newStudents !== 1 ? 's' : ''} and ${newTeachers} new teacher${newTeachers !== 1 ? 's' : ''} enrolled in the last ${period} days.`,
        recommendation: 'Ensure onboarding materials and class assignments are up to date.',
      })
    }

    // 6. Subscription Health
    if (subscriptions) {
      const endDate = subscriptions.endDate
      const daysLeft = Math.ceil((endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      if (daysLeft <= 14 && daysLeft > 0) {
        insights.push({
          type: 'subscription',
          priority: 'high',
          title: 'Subscription Expiring Soon',
          message: `Your ${subscriptions.package.name} plan expires in ${daysLeft} days.`,
          recommendation: 'Renew or upgrade your plan to avoid service interruption.',
        })
      } else if (daysLeft <= 0) {
        insights.push({
          type: 'subscription',
          priority: 'high',
          title: 'Subscription Expired',
          message: `Your subscription expired ${Math.abs(daysLeft)} days ago. Some features may be limited.`,
          recommendation: 'Renew immediately to restore full access.',
        })
      }
    }

    // 7. Resource Allocation Suggestion
    const underutilizedClasses = classPerformances.filter(c => c.studentCount < 10 && c.studentCount > 0)
    if (underutilizedClasses.length > 0) {
      insights.push({
        type: 'resource_allocation',
        priority: 'low',
        title: 'Small Class Sizes Detected',
        message: `${underutilizedClasses.length} class${underutilizedClasses.length !== 1 ? 'es have' : ' has'} fewer than 10 students.`,
        recommendation: 'Consider merging small classes or redistributing students for efficiency.',
        details: underutilizedClasses.map(c => `${c.name}: ${c.studentCount} students`),
      })
    }

    // Sort by priority
    const priorityOrder: Record<string, number> = { high: 3, medium: 2, low: 1 }
    insights.sort((a, b) => (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0))

    return NextResponse.json({
      insights: insights.slice(0, 20),
      summary: {
        total: insights.length,
        high: insights.filter(i => i.priority === 'high').length,
        medium: insights.filter(i => i.priority === 'medium').length,
        low: insights.filter(i => i.priority === 'low').length,
      },
      period,
    })
  } catch (error) {
    console.error('[SchoolAdmin AI Insights] Error:', error)
    return NextResponse.json({ insights: [], summary: { total: 0, high: 0, medium: 0, low: 0 } })
  }
})
