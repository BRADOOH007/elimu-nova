import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { route } from '@/lib/api-middleware'

export const GET = route({}, async (req, { user }) => {
  try {
    const student = await prisma.student.findUnique({
      where: { userId: user.id },
      select: { id: true }
    })
    if (!student) return NextResponse.json([])

    const [quizResults, sessions, challenges] = await Promise.all([
      prisma.quizResult.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
      prisma.studySession.findMany({
        where: { studentId: student.id },
        orderBy: { startTime: 'desc' },
        take: 5,
      }),
      prisma.courseChallenge.findMany({
        where: { studentId: student.id, completedAt: { not: null } },
        orderBy: { completedAt: 'desc' },
        take: 3,
      }),
    ])

    const items: Array<{ id: string; type: 'quiz' | 'class' | 'lesson' | 'streak'; label: string; time: string; icon: string }> = []

    for (const q of quizResults) {
      items.push({
        id: q.id, type: 'quiz',
        label: `Scored ${q.scorePercent}% on ${q.subject} ${q.topic || ''} (+${q.correctCount * 20} XP)`,
        time: relativeTime(q.createdAt), icon: '✅',
      })
    }

    for (const s of sessions.slice(0, 3)) {
      items.push({
        id: s.id, type: 'lesson',
        label: `Studied ${s.subject}: ${s.topic || s.subject}`,
        time: relativeTime(s.startTime), icon: '📖',
      })
    }

    for (const c of challenges) {
      if (c.passed) {
        items.push({
          id: c.id, type: 'streak',
          label: `Passed ${c.unitName} challenge (${c.score}%)`,
          time: relativeTime(c.completedAt!), icon: '🔥',
        })
      }
    }

    return NextResponse.json(items.slice(0, 5))
  } catch { return NextResponse.json([]) }
})

function relativeTime(date: Date): string {
  const diff = Date.now() - new Date(date).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins} min ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}
