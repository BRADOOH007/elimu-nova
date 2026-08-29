import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { route } from '@/lib/api-middleware'

export const POST = route({ auth: 'STUDENT' }, async (request, { user }) => {
  const { lessonId, rating, notes } = await request.json()
  if (!lessonId) {
    return NextResponse.json({ error: 'lessonId is required' }, { status: 400 })
  }

  let student = await prisma.student.findUnique({ where: { userId: user.id } })
  if (!student) {
    student = await prisma.student.create({ data: { userId: user.id } })
  }

  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  // Read previous analytics BEFORE upsert so streak calculation uses the real lastActiveDate
  const previousAnalytics = await prisma.studentAnalytics.findUnique({
    where: { studentId: student.id },
    select: { lastActiveDate: true, streakDays: true, longestStreak: true },
  })

  // Calculate streak from previous state
  const previousLastActive = previousAnalytics?.lastActiveDate ? new Date(previousAnalytics.lastActiveDate) : null
  const diffDays = previousLastActive
    ? Math.floor((today.getTime() - previousLastActive.getTime()) / (1000 * 60 * 60 * 24))
    : 999
  const newStreak = diffDays <= 1 ? (previousAnalytics?.streakDays || 0) + 1 : 1
  const newLongest = Math.max(previousAnalytics?.longestStreak || 0, newStreak)

  // Update or create analytics with correct streak
  await prisma.studentAnalytics.upsert({
    where: { studentId: student.id },
    update: {
      completedAssignments: { increment: 1 },
      lastActiveDate: now,
      streakDays: newStreak,
      longestStreak: newLongest,
      totalStudyTime: { increment: 30 },
    },
    create: {
      studentId: student.id,
      completedAssignments: 1,
      totalStudyTime: 30,
      lastActiveDate: now,
      streakDays: newStreak,
      longestStreak: newLongest,
    }
  })

  // Create study session record
  await prisma.studySession.create({
    data: {
      studentId: student.id,
      subject: 'General',
      duration: 30,
      startTime: now,
      endTime: new Date(now.getTime() + 30 * 60 * 1000),
      isCompleted: true,
    }
  })

  return NextResponse.json({ success: true })
})
