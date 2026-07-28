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

// POST - Create new study session
export const POST = route({ auth: 'STUDENT' }, async (request, { user }) => {
  const body = await request.json()
  const { subject, topic, duration, startTime, endTime, notes } = body

  // Validate required fields
  if (!subject || !duration || !startTime || !endTime) {
    return NextResponse.json({ 
      error: 'Missing required fields: subject, duration, startTime, endTime' 
    }, { status: 400 })
  }

  // Get student profile
  const student = await prisma.student.findUnique({
    where: { userId: user.id }
  })

  if (!student) {
    return NextResponse.json({ error: 'Student profile not found' }, { status: 404 })
  }

  // Create study session
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

  // Update analytics
  await prisma.studentAnalytics.upsert({
    where: { studentId: student.id },
    update: {
      totalStudyTime: {
        increment: parseInt(duration)
      }
    },
    create: {
      studentId: student.id,
      totalStudyTime: parseInt(duration)
    }
  })

  // Generate notification for teacher
  await NotificationGenerator.studySessionStarted(student.id, subject, parseInt(duration))

  return NextResponse.json({
    success: true,
    studySession
  }, { status: 201 })
})
