import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { route } from '@/lib/api-middleware'

export const POST = route({ auth: 'STUDENT' }, async (request, { user, params }) => {
  try {
    const { id } = params
    const student = await prisma.student.findUnique({ where: { userId: user.id } })
    if (!student) return NextResponse.json({ error: 'Student profile not found' }, { status: 404 })

    const book = await prisma.book.findUnique({ where: { id } })
    if (!book) return NextResponse.json({ error: 'Book not found' }, { status: 404 })

    const { rating } = await request.json()
    const parsed = Math.round(Number(rating))
    if (!Number.isFinite(parsed) || parsed < 1 || parsed > 5) {
      return NextResponse.json({ error: 'Rating must be between 1 and 5' }, { status: 400 })
    }

    const result = await prisma.bookRating.upsert({
      where: { studentId_bookId: { studentId: student.id, bookId: id } },
      create: { studentId: student.id, bookId: id, rating: parsed },
      update: { rating: parsed },
    })

    const agg = await prisma.bookRating.aggregate({
      where: { bookId: id },
      _avg: { rating: true },
      _count: { rating: true },
    })

    return NextResponse.json({ rating: result, aggregate: { average: agg._avg.rating, count: agg._count.rating } })
  } catch (e) {
    console.error('[Library] POST rate failed:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
})
