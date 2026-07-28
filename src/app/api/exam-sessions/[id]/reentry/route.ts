import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

import { route, apiLogger } from '@/lib/api-middleware'
const log = apiLogger('exam-sessions/id/reentry')

export const GET = route({ auth: ['STUDENT', 'TEACHER'] }, async (req, { user, params }) => {
  try {
    const { id } = await params
    const examSession = await prisma.examSession.findUnique({
      where: { id },
      select: { id: true, reentryStatus: true }
    })
    if (!examSession) return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    return NextResponse.json({ session: examSession })
  } catch (error) {
    log.error('Error fetching re-entry status:', error)
    return NextResponse.json({ error: 'Failed to fetch status' }, { status: 500 })
  }

})

export const POST = route({ auth: ['STUDENT', 'TEACHER'] }, async (req, { user, params }) => {
  try {

    const { id } = await params
    const { action } = await req.json()

    if (!['request', 'approve', 'deny'].includes(action)) {
      return NextResponse.json({ error: 'Action must be request, approve, or deny' }, { status: 400 })
    }

    const examSession = await prisma.examSession.findUnique({
      where: { id },
      include: { assignment: { select: { teacherId: true } } }
    })
    if (!examSession) return NextResponse.json({ error: 'Session not found' }, { status: 404 })

    if (action === 'request') {
      const student = await prisma.student.findUnique({ where: { userId: user.id } })
      if (!student || examSession.studentId !== student.id) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 })
      }
      const updated = await prisma.examSession.update({
        where: { id },
        data: { reentryStatus: 'PENDING' }
      })
      return NextResponse.json({ session: updated })
    }

    const teacher = await prisma.teacher.findUnique({ where: { userId: user.id } })
    if (!teacher || examSession.assignment.teacherId !== teacher.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const updated = await prisma.examSession.update({
      where: { id },
      data: { reentryStatus: action === 'approve' ? 'APPROVED' : 'DENIED' }
    })

    return NextResponse.json({ session: updated })
  } catch (error) {
    log.error('Error handling re-entry:', error)
    return NextResponse.json({ error: 'Failed to process re-entry' }, { status: 500 })
  }

})
