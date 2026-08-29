import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { route } from '@/lib/api-middleware'

export const dynamic = 'force-dynamic'

export const GET = route({ auth: ['STUDENT', 'SENIOR_STUDENT', 'TEACHER', 'SCHOOL_ADMIN', 'SUPER_ADMIN'] }, async (request, { params }) => {
  try {
    const { id } = params
    const book = await prisma.book.findUnique({ where: { id }, select: { subjects: true } })
    if (!book) return NextResponse.json({ error: 'Book not found' }, { status: 404 })

    const related = await prisma.book.findMany({
      where: { isPublished: true, id: { not: id }, subjects: { hasSome: book.subjects } },
      select: {
        id: true, title: true, author: true, coverUrl: true, category: true,
        readingLevel: true, viewCount: true,
      },
      orderBy: { viewCount: 'desc' },
      take: 4,
    })

    return NextResponse.json({ related })
  } catch (e) {
    console.error('[Library] related failed:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
})
