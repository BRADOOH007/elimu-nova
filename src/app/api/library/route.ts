import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { route } from '@/lib/api-middleware'
import { cache } from '@/lib/redis'

export const dynamic = 'force-dynamic'

const OPENLIB_SEARCH = 'https://openlibrary.org/search.json'
const OPENLIB_COVERS = 'https://covers.openlibrary.org/b'
const USER_AGENT = 'ElimuNova/1.0 (contact@elimunova.com)'
const CACHE_TTL = 3600 // 1 hour

/** Fetch books from Open Library — free, no API key, millions of books */
async function fetchFromOpenLibrary(params: {
  query: string; subject?: string; limit: number; offset: number
}): Promise<{ books: any[]; total: number }> {
  try {
    const q = new URLSearchParams({
      limit: String(params.limit),
      offset: String(params.offset),
      fields: 'key,title,author_name,first_publish_year,subject,cover_i,isbn,language,number_of_pages_median,ratings_average,ratings_count',
    })

    if (params.subject) {
      // Subject search is more precise
      q.set('subject', params.subject)
      q.set('q', params.query || params.subject)
    } else {
      q.set('q', params.query || 'education')
    }

    const cacheKey = `library:openlib:${q.toString()}`
    const cached = await cache.get(cacheKey).catch(() => null)
    if (cached) return JSON.parse(cached)

    const res = await fetch(`${OPENLIB_SEARCH}?${q}`, {
      headers: { 'User-Agent': USER_AGENT },
      signal: AbortSignal.timeout(8000),
    })

    if (!res.ok) return { books: [], total: 0 }

    const data = await res.json()
    const books = (data.docs || []).map((b: any) => {
      const coverId = b.cover_i
      const coverUrl = coverId
        ? `${OPENLIB_COVERS}/id/${coverId}-M.jpg`
        : null

      return {
        id: `openlib:${(b.key || '').replace('/works/', '')}`,
        title: b.title || 'Untitled',
        author: (b.author_name || ['Unknown'])[0],
        description: `Published ${b.first_publish_year || 'unknown'}. ${(b.subject || []).slice(0, 3).join(', ')}`,
        coverUrl,
        category: inferCategory(b.subject || []),
        subjects: (b.subject || []).slice(0, 5),
        language: (b.language || ['en'])[0] === 'eng' ? 'English' : (b.language || ['en'])[0],
        pages: b.number_of_pages_median || null,
        rating: { average: b.ratings_average || null, count: b.ratings_count || 0 },
        source: 'openlibrary',
        openLibKey: b.key,
        viewCount: 0,
        isFeatured: false,
        gradeMin: null,
        gradeMax: null,
        readingLevel: null,
      }
    })

    const result = { books, total: data.numFound || books.length }
    await cache.set(cacheKey, JSON.stringify(result), CACHE_TTL).catch(() => {})
    return result
  } catch (e) {
    console.error('[Library] Open Library fetch failed:', e)
    return { books: [], total: 0 }
  }
}

function inferCategory(subjects: string[]): string {
  const lower = subjects.map(s => s.toLowerCase()).join(' ')
  if (lower.includes('math')) return 'Mathematics'
  if (lower.includes('science') || lower.includes('biology') || lower.includes('chemistry') || lower.includes('physics')) return 'Science'
  if (lower.includes('history')) return 'History'
  if (lower.includes('geography') || lower.includes('travel')) return 'Geography'
  if (lower.includes('poetry') || lower.includes('language') || lower.includes('english')) return 'Language Arts'
  if (lower.includes('fairy') || lower.includes('folklore') || lower.includes('juvenile') || lower.includes('fiction')) return 'Stories & Fiction'
  if (lower.includes('religion') || lower.includes('cre') || lower.includes('bible')) return 'Religious Education'
  if (lower.includes('agriculture') || lower.includes('farming')) return 'Agriculture'
  if (lower.includes('business') || lower.includes('economics')) return 'Business'
  if (lower.includes('art') || lower.includes('music')) return 'Creative Arts'
  return 'General'
}

export const GET = route({ auth: ['STUDENT', 'SENIOR_STUDENT', 'TEACHER', 'SCHOOL_ADMIN', 'SUPER_ADMIN'], rateLimit: { maxRequests: 200, windowMs: 60000 } }, async (request) => {
  try {
    const { searchParams } = new URL(request.url)
    const search   = searchParams.get('search') || ''
    const category = searchParams.get('category') || ''
    const subject  = searchParams.get('subject') || ''
    const limit    = Math.min(parseInt(searchParams.get('limit') || '40', 10), 100)
    const offset   = parseInt(searchParams.get('offset') || '0', 10)

    // Build query — use category/subject as query if no search term
    const query = search || subject || category || 'kenya education curriculum'
    const olSubject = subject || (category && category !== 'General' ? category : undefined)

    // 1. Try DB books first (uploaded by admin)
    const dbWhere: any = { isPublished: true }
    if (category) dbWhere.category = category
    if (subject)  dbWhere.subjects = { has: subject }
    if (search) {
      dbWhere.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { author: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [dbBooks, dbTotal] = await Promise.all([
      prisma.book.findMany({
        where: dbWhere,
        orderBy: [{ isFeatured: 'desc' }, { viewCount: 'desc' }],
        skip: offset,
        take: limit,
        select: {
          id: true, title: true, author: true, description: true, coverUrl: true,
          category: true, subjects: true, gradeMin: true, gradeMax: true,
          language: true, readingLevel: true, isFeatured: true, viewCount: true, source: true, createdAt: true,
        },
      }),
      prisma.book.count({ where: dbWhere }),
    ])

    // 2. Supplement with Open Library books if DB has few results
    let olBooks: any[] = []
    let olTotal = 0

    if (dbTotal < 20) {
      const { books, total } = await fetchFromOpenLibrary({
        query, subject: olSubject, limit: limit - dbBooks.length, offset: Math.max(0, offset - dbTotal),
      })
      olBooks = books
      olTotal = total
    }

    // 3. Merge — DB books first, then Open Library
    const dbIds = new Set(dbBooks.map(b => b.id))
    const dbRatings = dbBooks.length
      ? await prisma.bookRating.groupBy({
          by: ['bookId'],
          where: { bookId: { in: dbBooks.map(b => b.id) } },
          _avg: { rating: true },
          _count: { rating: true },
        })
      : []
    const ratingMap = new Map(dbRatings.map(a => [a.bookId, { average: a._avg.rating, count: a._count.rating }]))

    const merged = [
      ...dbBooks.map(b => ({ ...b, rating: ratingMap.get(b.id) ?? { average: null, count: 0 } })),
      ...olBooks.filter(b => !dbIds.has(b.id)),
    ]

    // 4. Get categories from DB + common subjects
    const dbCategories = await prisma.book.findMany({
      where: { isPublished: true },
      select: { category: true },
      distinct: ['category'],
    })
    const allCategories = [...new Set([
      ...dbCategories.map(c => c.category),
      'Mathematics', 'Science', 'Language Arts', 'History', 'Geography',
      'Stories & Fiction', 'Religious Education', 'Agriculture', 'Business', 'Creative Arts', 'General'
    ])]

    return NextResponse.json({
      books: merged,
      categories: allCategories,
      pagination: { limit, offset, total: dbTotal + olTotal },
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
