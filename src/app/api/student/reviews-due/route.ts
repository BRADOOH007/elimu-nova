import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { route } from '@/lib/api-middleware'

export const dynamic = 'force-dynamic'

// GET /api/student/reviews-due — spaced-repetition items due for review
export const GET = route({ auth: 'STUDENT' }, async (request, { user }) => {
  try {
    const student = await prisma.student.findUnique({ where: { userId: user.id } })
    if (!student) return NextResponse.json({ error: 'Student profile not found' }, { status: 404 })

    const due = await prisma.reviewSchedule.findMany({
      where: { studentId: student.id, nextReviewAt: { lte: new Date() } },
      orderBy: { nextReviewAt: 'asc' },
      take: 20,
    })

    const overdue = await prisma.reviewSchedule.count({
      where: { studentId: student.id, nextReviewAt: { lte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
    })

    return NextResponse.json({ reviews: due, total: due.length, overdue })
  } catch (e) {
    console.error('[Student] reviews-due failed:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
})

// POST /api/student/reviews-due { topic, subject, quality } — record a review (SM-2 update)
export const POST = route({ auth: 'STUDENT' }, async (request, { user }) => {
  try {
    const student = await prisma.student.findUnique({ where: { userId: user.id } })
    if (!student) return NextResponse.json({ error: 'Student profile not found' }, { status: 404 })

    const { subject, topic, quality = 4 } = await request.json()
    if (!subject || !topic) return NextResponse.json({ error: 'subject and topic are required' }, { status: 400 })

    const q = Math.max(0, Math.min(5, Math.round(Number(quality))))
    const existing = await prisma.reviewSchedule.findFirst({ where: { studentId: student.id, subject, topic } })

    let ease = 2.5
    let interval = 0
    let reps = 0
    if (existing) {
      ease = Math.max(1.3, existing.easeFactor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)))
      reps = existing.repetitions + 1
      interval = reps === 1 ? 1 : reps === 2 ? 6 : Math.round(existing.intervalDays * ease)
      if (q < 3) { reps = 0; interval = 1 }
    } else {
      interval = q >= 3 ? 1 : 0
    }

    const next = new Date(Date.now() + interval * 24 * 60 * 60 * 1000)
    const schedule = existing
      ? await prisma.reviewSchedule.update({
          where: { id: existing.id },
          data: { easeFactor: ease, intervalDays: interval, repetitions: reps, quality: q, nextReviewAt: next, lastReviewAt: new Date(), totalReviews: { increment: 1 } },
        })
      : await prisma.reviewSchedule.create({
          data: { studentId: student.id, subject, topic, easeFactor: ease, intervalDays: interval, repetitions: reps, quality: q, nextReviewAt: next, lastReviewAt: new Date(), totalReviews: 1 },
        })

    return NextResponse.json({ schedule })
  } catch (e) {
    console.error('[Student] reviews-due POST failed:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
})
