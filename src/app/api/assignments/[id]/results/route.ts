import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { route } from '@/lib/api-middleware'

export const GET = route({ auth: ['TEACHER', 'STUDENT', 'PARENT'] }, async (req, { user, params }) => {
  const assignmentId = params.id

  const assignment = await prisma.assignment.findUnique({
    where: { id: assignmentId },
    include: {
      teacher: { include: { user: true } },
      students: { include: { user: true } },
      submissions: { include: { student: { include: { user: true } } } },
      class: true
    }
  })

  if (!assignment) {
    return NextResponse.json({ error: 'Assignment not found' }, { status: 404 })
  }

  if (user.role === 'TEACHER') {
    const teacher = await prisma.teacher.findUnique({ where: { userId: user.id } })
    if (!teacher || teacher.id !== assignment.teacherId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }
  } else if (user.role === 'STUDENT') {
    const student = await prisma.student.findUnique({ where: { userId: user.id } })
    if (!student || !assignment.students.some(s => s.id === student.id)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }
  } else if (user.role === 'PARENT') {
    const parent = await prisma.parent.findUnique({
      where: { userId: user.id },
      include: { students: { include: { student: true } } }
    })
    const studentIds = parent?.students.map((ps: any) => ps.studentId) || []
    const hasAccess = assignment.students.some(s => studentIds.includes(s.id))
    if (!hasAccess) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }
  }

  const totalStudents = assignment.students.length
  const submittedCount = assignment.submissions.length
  const gradedCount = assignment.submissions.filter(s => s.grade !== null).length
  const avgGrade = gradedCount > 0
    ? assignment.submissions.reduce((sum, s) => sum + (s.grade || 0), 0) / gradedCount
    : null
  const maxGrade = gradedCount > 0
    ? Math.max(...assignment.submissions.map(s => s.grade || 0))
    : null
  const minGrade = gradedCount > 0
    ? Math.min(...assignment.submissions.map(s => s.grade || 0))
    : null

  const results = {
    assignment: {
      id: assignment.id,
      title: assignment.title,
      description: assignment.description,
      subject: assignment.subject,
      grade: assignment.grade,
      isTimed: assignment.isTimed,
      timeLimit: assignment.timeLimit,
      dueDate: assignment.dueDate,
      class: assignment.class
    },
    stats: {
      totalStudents,
      submittedCount,
      pendingCount: totalStudents - submittedCount,
      gradedCount,
      avgGrade: avgGrade ? Math.round(avgGrade * 100) / 100 : null,
      maxGrade,
      minGrade
    },
    submissions: assignment.submissions.map(sub => ({
      id: sub.id,
      student: {
        id: sub.student.id,
        name: `${sub.student.user.firstName} ${sub.student.user.lastName}`,
        email: sub.student.user.email
      },
      grade: sub.grade,
      feedback: sub.feedback,
      isAiGraded: sub.isAiGraded,
      aiConfidence: sub.aiConfidence,
      submittedAt: sub.submittedAt,
      gradedAt: sub.gradedAt,
      timeSpent: sub.timeSpent,
      questionScores: sub.questionScores,
      needsRevision: sub.needsRevision,
      revisionNotes: sub.revisionNotes
    }))
  }

  return NextResponse.json(results)
})
