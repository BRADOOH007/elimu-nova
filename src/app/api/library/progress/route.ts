import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { route } from '@/lib/api-middleware'
import { rateLimitLibrary } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

async function resolveStudent(user: { id: string; role: string } | undefined) {
  if (!user) return null
  return prisma.student.findUnique({ where: { userId: user.id } })
}

export const GET = route({ auth: ['STUDENT', 'SENIOR_STUDENT'] }, async (request, { user }) => {
  try {
    const student = await resolveStudent(user)
    if (!student) return NextResponse.json({ progress: [] })

    const progress = await prisma.bookProgress.findMany({
      where: { studentId: student.id },
      orderBy: { lastReadAt: 'desc' },
    })

    const bookIds = progress.map(p => p.bookId)
    const books = bookIds.length
      ? await prisma.book.findMany({
          where: { id: { in: bookIds } },
          select: {
            id: true, title: true, author: true, coverUrl: true, category: true,
            readingLevel: true, language: true,
          },
        })
      : []
    const bookMap = new Map(books.map(b => [b.id, b]))

    return NextResponse.json({
      progress: progress.map(p => ({ ...p, book: bookMap.get(p.bookId) ?? null })),
    })
  } catch (e) {
    console.error('[Library] GET progress failed:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
})

export const PUT = route({ auth: ['STUDENT', 'SENIOR_STUDENT'], rateLimit: rateLimitLibrary }, async (request, { user }) => {
  try {
    const student = await resolveStudent(user)
    if (!student) return NextResponse.json({ progress: null })

    const { bookId, position, progressPct, completed } = await request.json()
    if (!bookId) return NextResponse.json({ error: 'bookId is required' }, { status: 400 })

    const book = await prisma.book.findUnique({ where: { id: bookId } })
    if (!book) return NextResponse.json({ error: 'Book not found' }, { status: 404 })

    const progress = await prisma.bookProgress.upsert({
      where: { studentId_bookId: { studentId: student.id, bookId } },
      create: {
        studentId: student.id,
        bookId,
        position: position ?? 0,
        progressPct: progressPct ?? 0,
        completed: !!completed,
      },
      update: {
        position: position ?? undefined,
        progressPct: progressPct ?? undefined,
        completed: completed === undefined ? undefined : !!completed,
      },
    })

    return NextResponse.json({ progress })
  } catch (e) {
    console.error('[Library] PUT progress failed:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
})
