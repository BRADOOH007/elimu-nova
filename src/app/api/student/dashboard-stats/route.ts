import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { route } from '@/lib/api-middleware'

export const GET = route({ auth: 'STUDENT' }, async (request, { user }) => {
  const userId = user.id

  // Get student-specific statistics
  const student = await prisma.student.findUnique({
    where: { userId },
    include: {
      user: true,
      class: {
        include: {
          teacher: {
            include: {
              user: true
            }
          }
        }
      },
      assignments: {
        include: {
          assignment: true
        }
      }
    }
  } as any) as any

  if (!student) {
    return NextResponse.json({ error: 'Student not found' }, { status: 404 })
  }

  // Calculate assignment statistics
  const totalAssignments = student.assignments.length
  const completedAssignments = student.assignments.filter((a: any) => a.status === 'SUBMITTED' || a.status === 'GRADED').length
  const pendingAssignments = student.assignments.filter((a: any) => a.status === 'PENDING').length
  const overdueAssignments = student.assignments.filter((a: any) => {
    const dueDate = new Date(a.assignment.dueDate)
    return dueDate < new Date() && a.status === 'PENDING'
  }).length

  // Calculate average grade
  const gradedAssignments = student.assignments.filter((a: any) => a.grade !== null)
  const averageGrade = gradedAssignments.length > 0 
    ? gradedAssignments.reduce((sum: number, a: any) => sum + (a.grade || 0), 0) / gradedAssignments.length
    : null

  // Get AI tutor sessions
  const aiTutorSessions = await prisma.aITutorSession.findMany({
    where: { userId } as any,
    orderBy: { createdAt: 'desc' },
    take: 10
  })

  // Calculate study time (mock data for now)
  const studyTime = Math.floor(Math.random() * 300) + 60 // 1-5 hours in minutes

  const dashboardData = {
    student: {
      id: student.id,
      name: `${student.user.firstName} ${student.user.lastName}`,
      email: student.user.email,
      school: student.class?.teacher?.user ? 'School Student' : 'Independent Student',
      teacher: student.class?.teacher ? `${student.class.teacher.user.firstName} ${student.class.teacher.user.lastName}` : 'Independent',
      class: student.class?.name || 'No Class'
    },
    stats: {
      activeAssignments: pendingAssignments,
      completedAssignments,
      averageGrade,
      studyTime,
      overdueAssignments
    },
    assignments: student.assignments.map((a: any) => ({
      id: a.assignment.id,
      title: a.assignment.title,
      description: a.assignment.description,
      dueDate: a.assignment.dueDate.toISOString(),
      status: a.status,
      grade: a.grade,
      teacher: student.class?.teacher ? `${student.class.teacher.user.firstName} ${student.class.teacher.user.lastName}` : 'System',
      subject: a.assignment.subject || 'General'
    })),
    aiTutorSessions: aiTutorSessions.map((session: any) => ({
      id: session.id,
      sessionType: session.sessionType,
      subject: session.subject,
      question: session.question,
      response: session.response,
      rating: session.rating,
      createdAt: session.createdAt.toISOString()
    })),
    analytics: {
      totalStudyTime: studyTime,
      averageGrade,
      completedAssignments,
      pendingAssignments,
      overdueAssignments,
      lastActiveDate: new Date().toISOString(),
      streakDays: Math.floor(Math.random() * 30),
      longestStreak: Math.floor(Math.random() * 60),
      weeklyGoal: 10,
      monthlyGoal: 40
    }
  }

  return NextResponse.json(dashboardData)
})
