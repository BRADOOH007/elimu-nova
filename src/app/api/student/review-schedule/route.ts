import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { route } from '@/lib/api-middleware'

// GET — fetch due reviews and schedule info
export const GET = route({ auth: 'STUDENT' }, async (request, { user }) => {
  const { searchParams } = new URL(request.url)
  const subject = searchParams.get('subject')

  const student = await prisma.student.findUnique({ where: { userId: user.id } })
  if (!student) return NextResponse.json({ error: 'Student not found' }, { status: 404 })

  const now = new Date()
  const where: any = { studentId: student.id }
  if (subject) where.subject = subject

  // Get items due for review
  const dueForReview = await prisma.reviewSchedule.findMany({
    where: { ...where, nextReviewAt: { lte: now } },
    orderBy: { nextReviewAt: 'asc' },
    take: 20,
  })

  // Get upcoming reviews (next 7 days)
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
  const upcoming = await prisma.reviewSchedule.findMany({
    where: { ...where, nextReviewAt: { gt: now, lte: nextWeek } },
    orderBy: { nextReviewAt: 'asc' },
    take: 20,
  })

  // Stats
  const totalScheduled = await prisma.reviewSchedule.count({ where })
  const masteredCount = await prisma.reviewSchedule.count({
    where: { ...where, intervalDays: { gte: 21 } }, // SM-2: 21+ days = well learned
  })

  return NextResponse.json({ dueForReview, upcoming, totalScheduled, masteredCount })
})

// POST — record a review and calculate next review time (SM-2 algorithm)
export const POST = route({ auth: 'STUDENT' }, async (request, { user }) => {
  const { subject, topic, quality, unitName } = await request.json()
  // quality: 0-5 (0=complete blackout, 5=perfect response)

  if (!subject || !topic || quality === undefined) {
    return NextResponse.json({ error: 'subject, topic, and quality (0-5) required' }, { status: 400 })
  }

  const student = await prisma.student.findUnique({ where: { userId: user.id } })
  if (!student) return NextResponse.json({ error: 'Student not found' }, { status: 404 })

  const q = Math.max(0, Math.min(5, Math.round(quality)))

  // Fetch existing schedule
  const existing = await prisma.reviewSchedule.findUnique({
    where: { studentId_subject_topic: { studentId: student.id, subject, topic } },
  })

  let easeFactor = existing?.easeFactor ?? 2.5
  let interval = existing?.intervalDays ?? 0
  let reps = existing?.repetitions ?? 0

  // SM-2 algorithm
  if (q < 3) {
    // Failed review — reset
    reps = 0
    interval = 1
  } else {
    // Successful review
    reps += 1
    if (reps === 1) {
      interval = 1
    } else if (reps === 2) {
      interval = 6
    } else {
      interval = Math.round(interval * easeFactor)
    }
  }

  // Update ease factor
  easeFactor = easeFactor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
  if (easeFactor < 1.3) easeFactor = 1.3

  const nextReview = new Date()
  nextReview.setDate(nextReview.getDate() + interval)

  const schedule = await prisma.reviewSchedule.upsert({
    where: { studentId_subject_topic: { studentId: student.id, subject, topic } },
    update: {
      easeFactor,
      intervalDays: interval,
      repetitions: reps,
      nextReviewAt: nextReview,
      lastReviewAt: new Date(),
      quality: q,
      totalReviews: { increment: 1 },
      unitName,
    },
    create: {
      studentId: student.id,
      subject,
      topic,
      unitName,
      easeFactor,
      intervalDays: interval,
      repetitions: reps,
      nextReviewAt: nextReview,
      lastReviewAt: new Date(),
      quality: q,
      totalReviews: 1,
    },
  })

  return NextResponse.json({ schedule, nextReviewAt: nextReview, intervalDays: interval })
})
