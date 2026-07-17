import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || session.user.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { lessonId, rating, notes } = await request.json()
    if (!lessonId) {
      return NextResponse.json({ error: 'lessonId is required' }, { status: 400 })
    }

    const student = await prisma.student.findUnique({ where: { userId: session.user.id } })
    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
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
  } catch (error) {
    console.error('[COMPLETE_LESSON]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
