import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { route } from '@/lib/api-middleware'

export const dynamic = 'force-dynamic'

function todayStr(): string {
  return new Date().toISOString().split('T')[0]
}

async function resolveStudent(user: { id: string; role: string } | undefined) {
  if (!user) return null
  return prisma.student.findUnique({ where: { userId: user.id } })
}

// POST /api/library/reading-log { bookId, minutes } — upsert today's reading minutes
export const POST = route({ auth: ['STUDENT', 'SENIOR_STUDENT'] }, async (request, { user }) => {
  try {
    const student = await resolveStudent(user)
    if (!student) return NextResponse.json({ log: null })

    const { bookId, minutes } = await request.json()
    const mins = Math.max(0, Math.round(Number(minutes) || 0))
    const date = todayStr()

    const existing = await prisma.readingLog.findFirst({
      where: { studentId: student.id, date, bookId: bookId ?? null },
    })
    const log = existing
      ? await prisma.readingLog.update({ where: { id: existing.id }, data: { minutes: { increment: mins } } })
      : await prisma.readingLog.create({ data: { studentId: student.id, bookId: bookId ?? null, minutes: mins, date } })

    return NextResponse.json({ log })
  } catch (e) {
    console.error('[Library] reading-log failed:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
})

// GET /api/library/reading-stats — today's minutes, streak, total
export const GET = route({ auth: ['STUDENT', 'SENIOR_STUDENT'] }, async (request, { user }) => {
  try {
    const student = await resolveStudent(user)
    if (!student) return NextResponse.json({ todayMinutes: 0, totalMinutes: 0, streak: 0 })

    const logs = await prisma.readingLog.findMany({
      where: { studentId: student.id },
      select: { minutes: true, date: true },
      orderBy: { date: 'desc' },
    })

    const today = todayStr()
    const todayMinutes = logs.filter(l => l.date === today).reduce((s, l) => s + l.minutes, 0)
    const totalMinutes = logs.reduce((s, l) => s + l.minutes, 0)

    const dates = Array.from(new Set(logs.map(l => l.date))).sort()
    let streak = 0
    let cursor = new Date(today)
    for (let i = 0; i < 365; i++) {
      const d = cursor.toISOString().split('T')[0]
      if (dates.includes(d)) { streak++; cursor.setDate(cursor.getDate() - 1) }
      else if (i === 0 && !dates.includes(d)) { cursor.setDate(cursor.getDate() - 1); continue }
      else break
    }

    return NextResponse.json({ todayMinutes, totalMinutes, streak })
  } catch (e) {
    console.error('[Library] reading-stats failed:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
})
