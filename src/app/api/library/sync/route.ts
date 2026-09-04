import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { uploadFile } from '@/lib/supabase'
import { route } from '@/lib/api-middleware'

export const dynamic = 'force-dynamic'

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))

const GUTENBERG_TEXT = 'https://www.gutenberg.org/cache/epub'
const OPENLIB_SEARCH = 'https://openlibrary.org/search.json'
const OPENLIB_COVERS = 'https://covers.openlibrary.org/b/id'
const USER_AGENT = 'ElimuNova/1.0 (contact@elimunova.com)'

async function uploadCoverToCloudinary(imageUrl: string, bookTitle: string): Promise<string | null> {
  try {
    const slug = bookTitle.toLowerCase().replace(/[^a-z0-9]+/g, '_').slice(0, 40)
    // Store covers in Supabase (always configured) — robust and offline-friendly.
    const buf = await fetch(imageUrl, { signal: AbortSignal.timeout(12000), headers: { 'User-Agent': USER_AGENT } })
      .then(r => r.ok ? r.arrayBuffer() : null)
    if (!buf) return null
    return await uploadFile('library-covers', `${slug}.jpg`, Buffer.from(buf), 'image/jpeg') || null
  } catch {
    return null
  }
}

async function resolveCoverUrl(
  gutendexFormats: Record<string, string>,
  title: string,
  author: string,
): Promise<string | null> {
  const jpeg = Object.entries(gutendexFormats).find(([k]) => k === 'image/jpeg')
  if (jpeg?.[1]) return jpeg[1]

  try {
    const params = new URLSearchParams({ title, author, limit: '1', fields: 'key,cover_i,isbn' })
    const res = await fetch(`${OPENLIB_SEARCH}?${params}`, { headers: { 'User-Agent': USER_AGENT } })
    if (res.ok) {
      const data = await res.json()
      const doc = data.docs?.[0]
      if (doc?.cover_i) return `${OPENLIB_COVERS}/${doc.cover_i}-L.jpg`
      if (doc?.isbn?.length > 0) {
        const isbn = doc.isbn.find((s: string) => s.length === 13) || doc.isbn[0]
        return `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg`
      }
    }
  } catch { /* ok */ }

  return null
}

/**
 * POST /api/library/sync
 * Search and import books from Project Gutenberg and Open Library.
 * Body: { query: string, source?: 'gutenberg' | 'openlibrary' | 'all' }
 */
export const POST = route({ auth: ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER'] }, async (request, ctx) => {
  const body = await request.clone().json() as any
  const query = (body.query || '').trim()
  const source = body.source || 'all'

  if (!query) {
    return NextResponse.json({ error: 'query is required' }, { status: 400 })
  }

  const results: Array<{
    externalId: string
    title: string
    author: string
    description: string
    coverUrl: string | null
    category: string
    subjects: string[]
    source: string
    textPreview?: string
  }> = []

  const shouldFetch = (s: string) => source === 'all' || source === s

  // ── Gutendex (Project Gutenberg) with Open Library cover fallback ──
  if (shouldFetch('gutenberg')) {
    try {
      const res = await fetch(`https://gutendex.com/books?search=${encodeURIComponent(query)}&page=1`, {
        headers: { 'User-Agent': USER_AGENT },
      })
      if (res.ok) {
        const data = await res.json()
        for (const book of (data.results || []).slice(0, 10)) {
          if (book.media_type !== 'Text') continue

          const existing = await prisma.book.findFirst({
            where: { title: { contains: book.title, mode: 'insensitive' } },
          })
          if (existing) continue

          const author = book.authors[0]?.name || 'Unknown'

          let textPreview: string | undefined
          try {
            const textRes = await fetch(`${GUTENBERG_TEXT}/${book.id}/pg${book.id}.txt`, {
              headers: { 'User-Agent': USER_AGENT },
            })
            if (textRes.ok) {
              const fullText = await textRes.text()
              textPreview = fullText.slice(0, 2000)
            }
          } catch { /* ok */ }

          // Resolve cover — skip book if no cover found
          const externalCoverUrl = await resolveCoverUrl(book.formats || {}, book.title, author)
          await sleep(200)

          if (!externalCoverUrl) continue

          const cloudinaryUrl = await uploadCoverToCloudinary(externalCoverUrl, book.title)
          if (!cloudinaryUrl) continue

          results.push({
            externalId: `gutenberg:${book.id}`,
            title: book.title,
            author,
            description: `Project Gutenberg. Subjects: ${(book.subjects || []).slice(0, 3).join(', ')}`,
            coverUrl: cloudinaryUrl,
            category: inferCategory(book.subjects || []),
            subjects: (book.subjects || []).slice(0, 5),
            source: 'gutenberg',
            textPreview,
          })
          await sleep(200)
        }
      }
    } catch (e: any) {
      console.error('[sync] Gutendex error:', e.message)
    }
  }

  // ── Open Library ──
  if (shouldFetch('openlibrary')) {
    try {
      const params = new URLSearchParams({
        q: query,
        limit: '10',
        fields: 'key,title,author_name,first_publish_year,subject,cover_i,isbn',
      })
      const res = await fetch(`${OPENLIB_SEARCH}?${params}`, {
        headers: { 'User-Agent': USER_AGENT },
      })
      if (res.ok) {
        const data = await res.json()
        for (const book of (data.docs || []).slice(0, 10)) {
          const existing = await prisma.book.findFirst({
            where: { title: { contains: book.title, mode: 'insensitive' } },
          })
          if (existing) continue

          // Resolve cover — skip if none
          let externalCoverUrl: string | null = null
          if (book.cover_i) {
            externalCoverUrl = `${OPENLIB_COVERS}/${book.cover_i}-L.jpg`
          } else if (book.isbn?.length > 0) {
            const isbn = book.isbn.find((s: string) => s.length === 13) || book.isbn[0]
            externalCoverUrl = `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg`
          }

          if (!externalCoverUrl) continue

          const cloudinaryUrl = await uploadCoverToCloudinary(externalCoverUrl, book.title)
          if (!cloudinaryUrl) continue

          results.push({
            externalId: `openlibrary:${book.key}`,
            title: book.title,
            author: (book.author_name || ['Unknown'])[0],
            description: `Open Library. Published ${book.first_publish_year || 'unknown'}. ${(book.subject || []).slice(0, 3).join(', ')}`,
            coverUrl: cloudinaryUrl,
            category: inferCategory(book.subject || []),
            subjects: (book.subject || []).slice(0, 5),
            source: 'openlibrary',
          })
        }
      }
    } catch (e: any) {
      console.error('[sync] Open Library error:', e.message)
    }
  }

  return NextResponse.json({ results, count: results.length })
})

function inferCategory(subjects: string[]): string {
  const lower = subjects.map(s => s.toLowerCase())
  if (lower.some(s => s.includes('science') || s.includes('nature') || s.includes('biology'))) return 'Science'
  if (lower.some(s => s.includes('math'))) return 'Mathematics'
  if (lower.some(s => s.includes('history'))) return 'History'
  if (lower.some(s => s.includes('geography') || s.includes('travel'))) return 'Geography'
  if (lower.some(s => s.includes('poetry') || s.includes('language'))) return 'Language'
  if (lower.some(s => s.includes('fairy') || s.includes('folklore') || s.includes('juvenile'))) return 'Stories'
  return 'General'
}
