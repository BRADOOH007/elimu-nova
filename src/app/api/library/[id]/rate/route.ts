import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { route } from '@/lib/api-middleware'

// Resolve the requester to a Student profile. SENIOR_STUDENT ratings are stored
// under their linked Student profile when one exists; otherwise we silently skip
// persistence so the reader UI works for seniors without a school Student record.
async function resolveStudent(user: { id: string; role: string }) {
  const student = await prisma.student.findUnique({ where: { userId: user.id } })
  if (student) return student
  return null
}

export const POST = route({ auth: ['STUDENT', 'SENIOR_STUDENT'] }, async (request, { user, params }) => {
  try {
    const { id } = params
    const student = await resolveStudent(user)
    const book = await prisma.book.findUnique({ where: { id } })
    if (!book) return NextResponse.json({ error: 'Book not found' }, { status: 404 })

    const { rating } = await request.json()
    const parsed = Math.round(Number(rating))
    if (!Number.isFinite(parsed) || parsed < 1 || parsed > 5) {
      return NextResponse.json({ error: 'Rating must be between 1 and 5' }, { status: 400 })
    }

    if (student) {
      await prisma.bookRating.upsert({
        where: { studentId_bookId: { studentId: student.id, bookId: id } },
        create: { studentId: student.id, bookId: id, rating: parsed },
        update: { rating: parsed },
      })
    }

    const agg = await prisma.bookRating.aggregate({
      where: { bookId: id },
      _avg: { rating: true },
      _count: { rating: true },
    })

    return NextResponse.json({ aggregate: { average: agg._avg.rating, count: agg._count.rating } })
  } catch (e) {
    console.error('[Library] POST rate failed:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
})
