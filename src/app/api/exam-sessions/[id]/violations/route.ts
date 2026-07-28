import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

import { route, apiLogger } from '@/lib/api-middleware'
const log = apiLogger('exam-sessions/id/violations')

export const POST = route({ auth: 'STUDENT' }, async (req, { user, params }) => {
  try {
    const { id } = await params
    const { type, details } = await req.json()

    const validTypes = ['TAB_SWITCH', 'FULLSCREEN_EXIT', 'COPY_PASTE', 'RIGHT_CLICK', 'OTHER']
    if (!validTypes.includes(type)) {
      return NextResponse.json({ error: 'Invalid violation type' }, { status: 400 })
    }

    const student = await prisma.student.findUnique({ where: { userId: user.id } })
    if (!student) return NextResponse.json({ error: 'Student not found' }, { status: 404 })

    const examSession = await prisma.examSession.findUnique({
      where: { id },
      select: { id: true, studentId: true, reentryStatus: true }
    })
    if (!examSession) return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    if (examSession.studentId !== student.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const violation = await prisma.lockdownViolation.create({
      data: { sessionId: id, type, details }
    })

    return NextResponse.json({ violation })
  } catch (error) {
    log.error('Error recording violation:', error)
    return NextResponse.json({ error: 'Failed to record violation' }, { status: 500 })
  }

})
