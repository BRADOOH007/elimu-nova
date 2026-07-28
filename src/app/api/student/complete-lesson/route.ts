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

  // Update or create analytics
  const analytics = await prisma.studentAnalytics.upsert({
    where: { studentId: student.id },
    update: {
      completedAssignments: { increment: 1 },
      lastActiveDate: now,
      totalStudyTime: { increment: 30 },
    },
    create: {
      studentId: student.id,
      completedAssignments: 1,
      totalStudyTime: 30,
      lastActiveDate: now,
      streakDays: 1,
      longestStreak: 1,
    }
  })

  // Calculate streak
  if (analytics.lastActiveDate) {
    const lastDate = new Date(analytics.lastActiveDate)
    const diffDays = Math.floor((today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24))
    const newStreak = diffDays <= 1 ? analytics.streakDays + 1 : 1
    const newLongest = Math.max(analytics.longestStreak, newStreak)
    await prisma.studentAnalytics.update({
      where: { studentId: student.id },
      data: { streakDays: newStreak, longestStreak: newLongest, lastActiveDate: now }
    })
  }

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
