/**
 * Sync books from Project Gutenberg (Gutendex) with Open Library cover fallback.
 *
 * Usage:  npx tsx scripts/sync-gutenberg-books.ts
 *
 * Gutendex: public domain full text from Project Gutenberg.
 * Open Library: high-res cover images when Gutendex covers are missing/low-res.
 * Covers are uploaded to Cloudinary for fast CDN delivery.
 */

import { PrismaClient } from '@prisma/client'
import { v2 as cloudinary } from 'cloudinary'

const prisma = new PrismaClient()

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

const GUTENDEX_BASE = 'https://gutendex.com'
const GUTENBERG_TEXT = 'https://www.gutenberg.org/cache/epub'
const OPENLIB_SEARCH = 'https://openlibrary.org/search.json'
const OPENLIB_COVERS = 'https://covers.openlibrary.org/b/id'
const USER_AGENT = 'ElimuNova/1.0 (contact@elimunova.com)'

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))

async function uploadCoverToCloudinary(imageUrl: string, bookTitle: string): Promise<string | null> {
  try {
    const slug = bookTitle.toLowerCase().replace(/[^a-z0-9]+/g, '_').slice(0, 40)
    const result = await cloudinary.uploader.upload(imageUrl, {
      folder: 'elimunova/library_covers',
      public_id: slug,
      resource_type: 'image',
      format: 'jpg',
      quality: 'auto',
      fetch_format: 'auto',
      overwrite: false,
    })
    return result.secure_url
  } catch (e) {
    console.warn(`    ⚠️  Cloudinary upload failed: ${(e as Error).message}`)
    return null
  }
}

// ── Subject queries for Gutendex ──
const SUBJECT_QUERIES: Array<{
  query: string
  category: string
  subjects: string[]
  readingLevel: string
  gradeMin: number
  gradeMax: number
}> = [
  { query: 'juvenile fiction', category: 'Stories', subjects: ['Literature', 'Fiction'], readingLevel: 'Beginner', gradeMin: 0, gradeMax: 3 },
  { query: 'science', category: 'Science', subjects: ['Science', 'Nature'], readingLevel: 'Intermediate', gradeMin: 4, gradeMax: 8 },
  { query: 'mathematics', category: 'Mathematics', subjects: ['Mathematics', 'Logic'], readingLevel: 'Intermediate', gradeMin: 4, gradeMax: 8 },
  { query: 'history', category: 'History', subjects: ['History', 'Civilization'], readingLevel: 'Intermediate', gradeMin: 4, gradeMax: 8 },
  { query: 'geography', category: 'Geography', subjects: ['Geography', 'Travel'], readingLevel: 'Intermediate', gradeMin: 4, gradeMax: 8 },
  { query: 'fairy tales', category: 'Stories', subjects: ['Folklore', 'Fairy Tales'], readingLevel: 'Beginner', gradeMin: 0, gradeMax: 3 },
  { query: 'natural history', category: 'Science', subjects: ['Biology', 'Nature'], readingLevel: 'Intermediate', gradeMin: 4, gradeMax: 8 },
  { query: 'adventure', category: 'Stories', subjects: ['Adventure', 'Fiction'], readingLevel: 'Intermediate', gradeMin: 4, gradeMax: 8 },
  { query: 'poetry', category: 'Language', subjects: ['Poetry', 'Literature'], readingLevel: 'Beginner', gradeMin: 0, gradeMax: 3 },
  { query: 'philosophy', category: 'General', subjects: ['Philosophy', 'Thinking'], readingLevel: 'Advanced', gradeMin: 9, gradeMax: 12 },
  { query: 'animals', category: 'Science', subjects: ['Zoology', 'Nature'], readingLevel: 'Beginner', gradeMin: 0, gradeMax: 3 },
  { query: 'astronomy', category: 'Science', subjects: ['Astronomy', 'Space'], readingLevel: 'Intermediate', gradeMin: 4, gradeMax: 8 },
]

interface GutendexBook {
  id: number
  title: string
  authors: Array<{ name: string; birth_year?: number; death_year?: number }>
  subjects: string[]
  bookshelves: string[]
  languages: string[]
  download_count: number
  formats: Record<string, string>
  media_type: string
}

async function fetchGutendex(subject: string, page = 1): Promise<GutendexBook[]> {
  const url = `${GUTENDEX_BASE}/books?search=${encodeURIComponent(subject)}&page=${page}`
  console.log(`  [Gutendex] Fetching: ${subject} (page ${page})`)
  const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } })
  if (!res.ok) throw new Error(`Gutendex ${res.status}: ${url}`)
  const data = await res.json()
  return (data.results || []) as GutendexBook[]
}

async function fetchGutenbergText(bookId: number): Promise<string | null> {
  const url = `${GUTENBERG_TEXT}/${bookId}/pg${bookId}.txt`
  try {
    const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } })
    if (!res.ok) return null
    const text = await res.text()
    const lines = text.split('\n')
    let startIdx = 0
    for (let i = 0; i < Math.min(lines.length, 100); i++) {
      if (lines[i].includes('*** START OF') || lines[i].includes('*** START OF THIS PROJECT GUTENBERG')) {
        startIdx = i + 1; break
      }
    }
    let endIdx = lines.length
    for (let i = lines.length - 1; i > Math.max(lines.length - 100, 0); i--) {
      if (lines[i].includes('*** END OF') || lines[i].includes('*** END OF THIS PROJECT GUTENBERG')) {
        endIdx = i; break
      }
    }
    const cleaned = lines.slice(startIdx, endIdx).join('\n').trim()
    return cleaned.length > 0 ? cleaned.slice(0, 30000) : null
  } catch { return null }
}

// ── Open Library cover resolution ──
// Priority: 1) Gutendex image/jpeg (high-res) → 2) Open Library by ISBN → 3) Open Library by title+author
async function resolveCoverUrl(
  gutendexFormats: Record<string, string>,
  title: string,
  author: string,
): Promise<string | null> {
  // 1. Check Gutendex formats for image/jpeg
  const jpeg = Object.entries(gutendexFormats).find(([k]) => k === 'image/jpeg')
  if (jpeg?.[1]) {
    console.log(`    📷 Using Gutendex cover`)
    return jpeg[1]
  }

  // 2. Try Open Library search by title + author
  try {
    const params = new URLSearchParams({
      title,
      author,
      limit: '1',
      fields: 'key,cover_i,isbn',
    })
    const res = await fetch(`${OPENLIB_SEARCH}?${params}`, {
      headers: { 'User-Agent': USER_AGENT },
    })
    if (res.ok) {
      const data = await res.json()
      const doc = data.docs?.[0]
      if (doc?.cover_i) {
        const coverUrl = `${OPENLIB_COVERS}/${doc.cover_i}-L.jpg`
        console.log(`    📷 Open Library cover (cover_i=${doc.cover_i})`)
        return coverUrl
      }
      // Try ISBN-based cover
      if (doc?.isbn?.length > 0) {
        const isbn = doc.isbn.find((s: string) => s.length === 13) || doc.isbn[0]
        const coverUrl = `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg`
        console.log(`    📷 Open Library cover (isbn=${isbn})`)
        return coverUrl
      }
    }
  } catch { /* ok */ }

  return null
}

function inferCategory(subjects: string[], fallback: string): string {
  const lower = subjects.map(s => s.toLowerCase())
  if (lower.some(s => s.includes('science') || s.includes('nature') || s.includes('biology'))) return 'Science'
  if (lower.some(s => s.includes('math'))) return 'Mathematics'
  if (lower.some(s => s.includes('history'))) return 'History'
  if (lower.some(s => s.includes('geography') || s.includes('travel'))) return 'Geography'
  if (lower.some(s => s.includes('poetry') || s.includes('language'))) return 'Language'
  if (lower.some(s => s.includes('fairy') || s.includes('folklore') || s.includes('juvenile'))) return 'Stories'
  return fallback
}

async function main() {
  console.log('=== Syncing books from Project Gutenberg (Gutendex) + Open Library covers ===\n')
  const existingCount = await prisma.book.count()
  console.log(`Existing books: ${existingCount}\n`)

  let totalAdded = 0
  const MAX_PER_SUBJECT = 8

  for (const sq of SUBJECT_QUERIES) {
    console.log(`\n📚 Subject: ${sq.query} (${sq.category})`)
    try {
      const results = await fetchGutendex(sq.query)
      await sleep(300)
      let addedForSubject = 0

      for (const book of results) {
        if (addedForSubject >= MAX_PER_SUBJECT) break
        if (book.media_type !== 'Text') continue
        if (!book.languages.includes('en')) continue

        const existing = await prisma.book.findFirst({
          where: { title: { contains: book.title, mode: 'insensitive' } },
        })
        if (existing) { console.log(`  ⏭  "${book.title}" — exists`); continue }

        console.log(`  📖 "${book.title}" by ${book.authors[0]?.name || 'Unknown'}...`)

        // Fetch full text
        const text = await fetchGutenbergText(book.id)
        await sleep(200)

        if (!text || text.length < 500) {
          console.log(`  ⚠️  Skipped — text too short`)
          continue
        }

        const author = book.authors[0]?.name || 'Unknown'
        const subjects = [...new Set([...book.subjects, ...book.bookshelves])].slice(0, 5)
        const category = inferCategory(subjects, sq.category)

        // Resolve cover from Gutendex or Open Library
        const externalCoverUrl = await resolveCoverUrl(book.formats, book.title, author)
        await sleep(200)

        // Upload cover to Cloudinary — mandatory, skip book if no cover
        if (!externalCoverUrl) {
          console.log(`  ⏭️  Skipped (no cover found)`)
          continue
        }
        const cloudinaryUrl = await uploadCoverToCloudinary(externalCoverUrl, book.title)
        if (!cloudinaryUrl) {
          console.log(`  ⏭️  Skipped (Cloudinary upload failed)`)
          continue
        }
        const coverUrl = cloudinaryUrl
        await sleep(100)

        try {
          await prisma.book.create({
            data: {
              title: book.title,
              author,
              description: `Project Gutenberg. Subjects: ${subjects.join(', ')}`,
              content: text,
              coverUrl,
              category,
              subjects,
              gradeMin: sq.gradeMin, gradeMax: sq.gradeMax,
              language: 'English',
              readingLevel: sq.readingLevel,
              isFeatured: book.download_count > 10000 || addedForSubject < 2,
              isPublished: true,
              viewCount: book.download_count || 0,
              source: 'gutenberg',
              addedBy: null,
            },
          })
          totalAdded++
          addedForSubject++
          console.log(`  ✅ Added (${(text.length / 1000).toFixed(1)}K chars)${coverUrl ? ' [cover]' : ''}`)
        } catch (e: any) {
          console.error(`  ❌ Failed: ${e.message}`)
        }
      }
    } catch (e: any) {
      console.error(`  ❌ Gutendex fetch failed: ${e.message}`)
    }
  }

  console.log(`\n=== Done! Added ${totalAdded} books ===`)
  const finalCount = await prisma.book.count()
  console.log(`Total books in database: ${finalCount}`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
