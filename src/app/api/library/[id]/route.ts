import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { route } from '@/lib/api-middleware'

export const dynamic = 'force-dynamic'

export const GET = route({ auth: ['STUDENT', 'SENIOR_STUDENT', 'TEACHER', 'SCHOOL_ADMIN', 'SUPER_ADMIN'] }, async (request, { params }) => {
  try {
    const { id } = params
    const book = await prisma.book.findUnique({ where: { id } })

    if (!book || !book.isPublished) {
      return NextResponse.json({ error: 'Book not found' }, { status: 404 })
    }

    prisma.book.update({ where: { id }, data: { viewCount: { increment: 1 } } }).catch(() => {})

    const agg = await prisma.bookRating.aggregate({
      where: { bookId: id },
      _avg: { rating: true },
      _count: { rating: true },
    })

    return NextResponse.json({
      book,
      rating: { average: agg._avg.rating, count: agg._count.rating },
    })
  } catch (e) {
    console.error('[Library] GET book failed:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
})
