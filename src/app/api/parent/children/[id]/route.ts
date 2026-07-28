import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { route } from '@/lib/api-middleware'

export const GET = route({ auth: 'PARENT' }, async (_req, { user, params }) => {
  try {
    const { id } = await params
    const parent = await prisma.parent.findUnique({
      where: { userId: user.id },
      include: { students: { select: { studentId: true } } }
    })

    if (!parent) {
      return NextResponse.json({ error: 'Parent not found' }, { status: 404 })
    }

    const childIds = parent.students.map(ps => ps.studentId)
    if (!childIds.includes(id)) {
      return NextResponse.json({ error: 'Child not linked to parent' }, { status: 403 })
    }

    const student = await prisma.student.findUnique({
      where: { id },
      include: {
        user: { select: { firstName: true, lastName: true, email: true } },
        class: { select: { id: true, name: true, grade: true, subject: true } },
        school: { select: { id: true, name: true } },
        analytics: true,
        studentProgress: {
          select: {
            subject: true,
            masteryScore: true,
            status: true,
            lastPracticedAt: true,
            commonMistakes: true,
          }
        },
        assignments: {
          select: { id: true, title: true, dueDate: true, status: true, grade: true },
          orderBy: { dueDate: 'desc' },
          take: 20,
        },
      }
    })

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }

    const child = {
      id: student.id,
      name: `${student.user.firstName} ${student.user.lastName}`,
      email: student.user.email,
      class: student.class,
      school: student.school,
      analytics: student.analytics ? {
        totalStudyTime: student.analytics.totalStudyTime,
        averageGrade: student.analytics.averageGrade,
        completedAssignments: student.analytics.completedAssignments,
        pendingAssignments: student.analytics.pendingAssignments,
        overdueAssignments: student.analytics.overdueAssignments,
        streakDays: student.analytics.streakDays,
        lastActiveDate: student.analytics.lastActiveDate,
      } : null,
      progress: student.studentProgress,
      assignments: student.assignments,
    }

    return NextResponse.json({ child })
  } catch (error) {
    console.error('[GET_PARENT_CHILDREN_ID]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
})
