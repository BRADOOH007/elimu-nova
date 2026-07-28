import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

import { route, apiLogger } from '@/lib/api-middleware'
const log = apiLogger('exam-sessions')

export const POST = route({ auth: ['STUDENT', 'TEACHER'] }, async (req, { user, params }) => {
  try {
    const { assignmentId } = await req.json()
    if (!assignmentId) {
      return NextResponse.json({ error: 'assignmentId required' }, { status: 400 })
    }

    const student = await prisma.student.findUnique({ where: { userId: user.id } })
    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }

    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
      select: { id: true, timeLimit: true, students: { where: { id: student.id }, select: { id: true } } }
    })
    if (!assignment || assignment.students.length === 0) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const existing = await prisma.examSession.findUnique({
      where: { assignmentId_studentId: { assignmentId, studentId: student.id } }
    })
    if (existing) {
      return NextResponse.json({ session: existing })
    }

    const examSession = await prisma.examSession.create({
      data: {
        assignmentId,
        studentId: student.id,
        timeLimitMins: assignment.timeLimit || null,
      }
    })

    return NextResponse.json({ session: examSession })
  } catch (error) {
    log.error('Error creating exam session:', error)
    return NextResponse.json({ error: 'Failed to create session' }, { status: 500 })
  }

})

export const GET = route({ auth: ['STUDENT', 'TEACHER'] }, async (req, { user, params }) => {
  try {

    const url = new URL(req.url)
    const assignmentId = url.searchParams.get('assignmentId')
    const studentId = url.searchParams.get('studentId')
    const pageParam = url.searchParams.get('page')
    const limitParam = url.searchParams.get('limit')

    const where: any = {}
    if (assignmentId) where.assignmentId = assignmentId
    if (studentId) where.studentId = studentId

    if (user.role === 'TEACHER') {
      const teacher = await prisma.teacher.findUnique({ where: { userId: user.id } })
      if (!teacher) return NextResponse.json({ error: 'Teacher not found' }, { status: 404 })
      where.assignment = { teacherId: teacher.id }
    } else if (user.role === 'STUDENT') {
      const student = await prisma.student.findUnique({ where: { userId: user.id } })
      if (!student) return NextResponse.json({ error: 'Student not found' }, { status: 404 })
      where.studentId = student.id
    }

    if (pageParam) {
      const page = Math.max(1, parseInt(pageParam) || 1)
      const limit = Math.min(200, Math.max(1, parseInt(limitParam ?? '50') || 50))
      const skip = (page - 1) * limit
      const [sessions, total] = await Promise.all([
        prisma.examSession.findMany({
          where,
          include: {
            violations: { orderBy: { createdAt: 'asc' } },
            student: { include: { user: { select: { firstName: true, lastName: true } } } },
            assignment: { select: { id: true, title: true } }
          },
          skip,
          take: limit,
          orderBy: { startedAt: 'desc' }
        }),
        prisma.examSession.count({ where })
      ])
      return NextResponse.json({ sessions, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } })
    }

    const sessions = await prisma.examSession.findMany({
      where,
      include: {
        violations: { orderBy: { createdAt: 'asc' } },
        student: { include: { user: { select: { firstName: true, lastName: true } } } },
        assignment: { select: { id: true, title: true } }
      },
      orderBy: { startedAt: 'desc' }
    })

    return NextResponse.json({ sessions })
  } catch (error) {
    log.error('Error fetching exam sessions:', error)
    return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 })
  }

})
