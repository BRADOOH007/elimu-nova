import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { NotificationGenerator } from '@/lib/notification-generator'
import { route } from '@/lib/api-middleware'

// GET - Fetch study sessions
export const GET = route({ auth: 'STUDENT' }, async (request, { user }) => {
  const { searchParams } = new URL(request.url)
  const period = searchParams.get('period') || 'week' // week, month, all
  const subject = searchParams.get('subject')

  // Get student profile
  const student = await prisma.student.findUnique({
    where: { userId: user.id }
  })

  if (!student) {
    return NextResponse.json({ error: 'Student profile not found' }, { status: 404 })
  }

  // Calculate date range based on period
  let startDate: Date
  const endDate = new Date()

  switch (period) {
    case 'week':
      startDate = new Date()
      startDate.setDate(startDate.getDate() - 7)
      break
    case 'month':
      startDate = new Date()
      startDate.setMonth(startDate.getMonth() - 1)
      break
    default:
      startDate = new Date('2020-01-01') // All time
  }

  // Build where clause
  const whereClause: any = {
    studentId: student.id,
    startTime: {
      gte: startDate,
      lte: endDate
    }
  }

  if (subject) {
    whereClause.subject = subject
  }

  const studySessions = await prisma.studySession.findMany({
    where: whereClause,
    orderBy: {
      startTime: 'desc'
    }
  })

  // Calculate statistics
  const totalDuration = studySessions.reduce((total, session) => total + session.duration, 0)
  const averageSessionDuration = studySessions.length > 0 ? totalDuration / studySessions.length : 0

  // Group by subject
  const subjectStats = studySessions.reduce((acc, session) => {
    if (!acc[session.subject]) {
      acc[session.subject] = {
        totalDuration: 0,
        sessionCount: 0
      }
    }
    acc[session.subject].totalDuration += session.duration
    acc[session.subject].sessionCount += 1
    return acc
  }, {} as Record<string, { totalDuration: number; sessionCount: number }>)

  return NextResponse.json({
    sessions: studySessions,
    statistics: {
      totalSessions: studySessions.length,
      totalDuration,
      averageSessionDuration: Math.round(averageSessionDuration),
      subjectStats
    }
  })
})

// POST - Create or update study session
export const POST = route({ auth: 'STUDENT' }, async (request, { user }) => {
  const body = await request.json()
  const { subject, topic, duration, startTime, endTime, notes, action, sessionId } = body

  // Get student profile
  const student = await prisma.student.findUnique({
    where: { userId: user.id }
  })

  if (!student) {
    return NextResponse.json({ error: 'Student profile not found' }, { status: 404 })
  }

  // Action: start — create a new session with zero duration
  if (action === 'start') {
    if (!subject) {
      return NextResponse.json({ error: 'Subject is required' }, { status: 400 })
    }
    const now = new Date()
    const studySession = await prisma.studySession.create({
      data: {
        studentId: student.id,
        subject,
        topic: topic || null,
        duration: 0,
        startTime: now,
        endTime: now,
      }
    })
    return NextResponse.json({ success: true, session: studySession }, { status: 201 })
  }

  // Action: stop — update existing session with final duration
  if (action === 'stop') {
    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 })
    }
    const session = await prisma.studySession.findFirst({
      where: { id: sessionId, studentId: student.id }
    })
    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }
    const durationSec = parseInt(duration) || 0
    const endTime = new Date()
    const startTimeFinal = new Date(endTime.getTime() - durationSec * 1000)
    const studySession = await prisma.studySession.update({
      where: { id: sessionId },
      data: {
        duration: durationSec,
        startTime: startTimeFinal,
        endTime,
        notes: notes || null,
      }
    })

    // Update analytics
    await prisma.studentAnalytics.upsert({
      where: { studentId: student.id },
      update: { totalStudyTime: { increment: durationSec } },
      create: { studentId: student.id, totalStudyTime: durationSec }
    })

    // Generate notification for teacher
    await NotificationGenerator.studySessionStarted(student.id, session.subject, durationSec)

    return NextResponse.json({ success: true, session: studySession })
  }

  // Default: create session with full details (legacy path)
  if (!subject || !duration || !startTime || !endTime) {
    return NextResponse.json({
      error: 'Missing required fields: subject, duration, startTime, endTime'
    }, { status: 400 })
  }

  const studySession = await prisma.studySession.create({
    data: {
      studentId: student.id,
      subject,
      topic: topic || null,
      duration: parseInt(duration),
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      notes: notes || null
    }
  })

  await prisma.studentAnalytics.upsert({
    where: { studentId: student.id },
    update: { totalStudyTime: { increment: parseInt(duration) } },
    create: { studentId: student.id, totalStudyTime: parseInt(duration) }
  })

  await NotificationGenerator.studySessionStarted(student.id, subject, parseInt(duration))

  return NextResponse.json({ success: true, studySession }, { status: 201 })
})

// DELETE - Remove a study session
export const DELETE = route({ auth: 'STUDENT' }, async (request, { user }) => {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  if (!id) {
    return NextResponse.json({ error: 'Session ID is required' }, { status: 400 })
  }

  const student = await prisma.student.findUnique({ where: { userId: user.id } })
  if (!student) {
    return NextResponse.json({ error: 'Student profile not found' }, { status: 404 })
  }

  const session = await prisma.studySession.findFirst({
    where: { id, studentId: student.id }
  })
  if (!session) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 })
  }

  await prisma.studySession.delete({ where: { id } })

  return NextResponse.json({ success: true })
})
