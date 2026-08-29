import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { route } from '@/lib/api-middleware'

export const dynamic = 'force-dynamic'

export const GET = route({ auth: ['STUDENT', 'SENIOR_STUDENT', 'TEACHER', 'SCHOOL_ADMIN', 'SUPER_ADMIN'] }, async (request) => {
  try {
    const { searchParams } = new URL(request.url)
    const search     = searchParams.get('search') || ''
    const category   = searchParams.get('category') || undefined
    const subject    = searchParams.get('subject') || undefined
    const language   = searchParams.get('language') || undefined
    const gradeRaw   = parseInt(searchParams.get('grade') || '0', 10)
    const grade      = gradeRaw > 0 ? gradeRaw : undefined
    const readingLevel = searchParams.get('readingLevel') || undefined
    const featured   = searchParams.get('featured') === '1'
    const limit      = Math.min(parseInt(searchParams.get('limit') || '40', 10) || 40, 100)
    const offset     = parseInt(searchParams.get('offset') || '0', 10) || 0

    const where: any = { isPublished: true }
    if (featured) where.isFeatured = true
    if (category) where.category = category
    if (subject)  where.subjects = { has: subject }
    if (language) where.language = language
    if (grade)    where.AND = [{ gradeMin: { lte: grade } }, { gradeMax: { gte: grade } }]
    if (readingLevel) where.readingLevel = readingLevel
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { author: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { subjects: { has: search } },
      ]
    }

    const orderBy: any = featured
      ? [{ isFeatured: 'desc' }, { viewCount: 'desc' }]
      : { viewCount: 'desc' }

    const [books, total] = await Promise.all([
      prisma.book.findMany({
        where,
        orderBy,
        skip: offset,
        take: limit,
        select: {
          id: true, title: true, author: true, description: true, coverUrl: true,
          category: true, subjects: true, gradeMin: true, gradeMax: true,
          language: true, readingLevel: true, isFeatured: true, viewCount: true,
          source: true, createdAt: true,
        },
      }),
      prisma.book.count({ where }),
    ])

    const ids = books.map(b => b.id)
    const agg = ids.length
      ? await prisma.bookRating.groupBy({
          by: ['bookId'],
          where: { bookId: { in: ids } },
          _avg: { rating: true },
          _count: { rating: true },
        })
      : []
    const ratingMap = new Map(agg.map(a => [a.bookId, { average: a._avg.rating, count: a._count.rating }]))

    const categories = await prisma.book.findMany({
      where: { isPublished: true },
      select: { category: true },
      distinct: ['category'],
    })

    return NextResponse.json({
      books: books.map(b => ({ ...b, rating: ratingMap.get(b.id) ?? { average: null, count: 0 } })),
      categories: categories.map(c => c.category),
      pagination: { limit, offset, total },
    })
  } catch (e) {
    console.error('[Library] GET failed:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
})

export const POST = route({ auth: ['TEACHER', 'SCHOOL_ADMIN', 'SUPER_ADMIN'] }, async (request, { user }) => {
  try {
    const body = await request.json()
    const {
      title, author, description, coverUrl, content, fileUrl, audioUrl,
      category, subjects, gradeMin, gradeMax, language, readingLevel,
      isFeatured, source, isPublished,
    } = body

    if (!title || !category) {
      return NextResponse.json({ error: 'Title and category are required' }, { status: 400 })
    }

    const book = await prisma.book.create({
      data: {
        title,
        author: author ?? null,
        description: description ?? null,
        coverUrl: coverUrl ?? null,
        content: content ?? null,
        fileUrl: fileUrl ?? null,
        audioUrl: audioUrl ?? null,
        category,
        subjects: Array.isArray(subjects) ? subjects.filter(Boolean) : [],
        gradeMin: gradeMin ?? null,
        gradeMax: gradeMax ?? null,
        language: language || 'English',
        readingLevel: readingLevel ?? null,
        isFeatured: !!isFeatured,
        isPublished: isPublished === undefined ? true : !!isPublished,
        source: source || 'upload',
        addedBy: user.id,
      },
    })

    return NextResponse.json({ book }, { status: 201 })
  } catch (e) {
    console.error('[Library] POST failed:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
})
