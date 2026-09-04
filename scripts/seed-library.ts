/**
 * Seed Library — import a curated set of public-domain books directly from
 * Project Gutenberg. Uses the reliable gutenberg.org direct file URLs (the
 * third-party gutendex.com API is flaky/down). Each book's full text is
 * fetched and stored in the DB so the in-app reader + TTS work offline.
 *
 * Run:  tsx scripts/seed-library.ts
 */

import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const USER_AGENT = 'ElimuNova/1.0 (contact@elimunova.com)'
const GUTENBERG = 'https://www.gutenberg.org/cache/epub'

interface SeedBook {
  gutenbergId: number
  title: string
  author: string
  category: string
  subjects: string[]
  description: string
  language?: string
  gradeMin?: number
  gradeMax?: number
  readingLevel?: string
}

const BOOKS: SeedBook[] = [
  { gutenbergId: 1342, title: 'Pride and Prejudice', author: 'Jane Austen', category: 'Stories & Fiction', subjects: ['fiction', 'romance', 'classic literature'], description: 'A classic novel of manners, marriage, and misunderstanding in 19th-century England.', gradeMin: 8, gradeMax: 12, readingLevel: 'Advanced' },
  { gutenbergId: 11, title: 'Alice\'s Adventures in Wonderland', author: 'Lewis Carroll', category: 'Stories & Fiction', subjects: ['fiction', 'fantasy', 'adventure'], description: 'A girl falls down a rabbit hole into a whimsical world of curious creatures.', gradeMin: 3, gradeMax: 7, readingLevel: 'Beginner' },
  { gutenbergId: 1661, title: 'The Adventures of Sherlock Holmes', author: 'Arthur Conan Doyle', category: 'Stories & Fiction', subjects: ['fiction', 'mystery', 'detective'], description: 'A collection of detective stories featuring the famous consulting detective.', gradeMin: 6, gradeMax: 12, readingLevel: 'Intermediate' },
  { gutenbergId: 84, title: 'Frankenstein', author: 'Mary Shelley', category: 'Stories & Fiction', subjects: ['fiction', 'gothic', 'science fiction'], description: 'A scientist creates a living creature and is horrified by what he has made.', gradeMin: 9, gradeMax: 12, readingLevel: 'Advanced' },
  { gutenbergId: 2701, title: 'Moby Dick', author: 'Herman Melville', category: 'Stories & Fiction', subjects: ['fiction', 'adventure', 'classic literature'], description: 'A sailor recounts his obsessive quest to hunt a great white whale.', gradeMin: 9, gradeMax: 12, readingLevel: 'Advanced' },
  { gutenbergId: 98, title: 'A Tale of Two Cities', author: 'Charles Dickens', category: 'Stories & Fiction', subjects: ['fiction', 'historical', 'classic literature'], description: 'A story of love, sacrifice, and revolution set in London and Paris.', gradeMin: 9, gradeMax: 12, readingLevel: 'Advanced' },
  { gutenbergId: 2600, title: 'War and Peace', author: 'Leo Tolstoy', category: 'Stories & Fiction', subjects: ['fiction', 'historical', 'classic literature'], description: 'An epic novel about Russian society during the Napoleonic Wars.', gradeMin: 10, gradeMax: 12, readingLevel: 'Advanced' },
  { gutenbergId: 2542, title: 'A Doll\'s House', author: 'Henrik Ibsen', category: 'Stories & Fiction', subjects: ['drama', 'classic literature'], description: 'A play about the awakening of a woman in a patriarchal marriage.', gradeMin: 10, gradeMax: 12, readingLevel: 'Advanced' },
  { gutenbergId: 2591, title: 'Grimm\'s Fairy Tales', author: 'Jacob and Wilhelm Grimm', category: 'Stories & Fiction', subjects: ['fantasy', 'fairy tales', 'children'], description: 'A collection of classic European folk and fairy tales.', gradeMin: 2, gradeMax: 7, readingLevel: 'Beginner' },
  { gutenbergId: 205, title: 'Walden', author: 'Henry David Thoreau', category: 'History', subjects: ['philosophy', 'nature', 'classic literature'], description: 'Reflections on simple living in natural surroundings.', gradeMin: 9, gradeMax: 12, readingLevel: 'Advanced' },
  { gutenbergId: 64317, title: 'The Yellow Wallpaper', author: 'Charlotte Perkins Gilman', category: 'Stories & Fiction', subjects: ['fiction', 'short story', 'classic literature'], description: 'A chilling short story about a woman confined to a room.', gradeMin: 9, gradeMax: 12, readingLevel: 'Advanced' },
  { gutenbergId: 25344, title: 'The Science of Human Nature', author: 'William Henry Pyle', category: 'Science', subjects: ['psychology', 'science', 'education'], description: 'An introduction to psychology and human behaviour.', gradeMin: 9, gradeMax: 12, readingLevel: 'Intermediate' },
  { gutenbergId: 15259, title: 'A Short History of the World', author: 'H. G. Wells', category: 'History', subjects: ['history', 'world history'], description: 'A sweeping account of world history from its beginnings.', gradeMin: 7, gradeMax: 12, readingLevel: 'Intermediate' },
  { gutenbergId: 37106, title: 'The Art of War', author: 'Sun Tzu', category: 'History', subjects: ['strategy', 'military', 'classic literature'], description: 'An ancient Chinese treatise on military strategy.', gradeMin: 8, gradeMax: 12, readingLevel: 'Intermediate' },
]

async function fetchText(id: number): Promise<string | null> {
  try {
    const res = await fetch(`${GUTENBERG}/${id}/pg${id}.txt`, {
      headers: { 'User-Agent': USER_AGENT },
      signal: AbortSignal.timeout(20000),
    })
    if (!res.ok) return null
    return await res.text()
  } catch (e) {
    console.warn(`  fetch ${id} failed:`, e)
    return null
  }
}

async function main() {
  console.log(`📚 Seeding ${BOOKS.length} public-domain books from Project Gutenberg…\n`)
  let imported = 0

  for (const book of BOOKS) {
    const existing = await prisma.book.findFirst({
      where: { title: { contains: book.title.slice(0, 20), mode: 'insensitive' } },
    })
    if (existing) {
      console.log(`  = ${book.title} (already exists)`)
      continue
    }

    const content = await fetchText(book.gutenbergId)
    if (!content) {
      console.log(`  ✗ ${book.title} — text fetch failed, skipping`)
      continue
    }
    console.log(`  ✓ ${book.title} (${content.length.toLocaleString()} chars)`)

    await prisma.book.create({
      data: {
        title: book.title,
        author: book.author,
        description: book.description,
        content,
        category: book.category,
        subjects: book.subjects,
        language: book.language || 'English',
        gradeMin: book.gradeMin ?? null,
        gradeMax: book.gradeMax ?? null,
        readingLevel: book.readingLevel ?? null,
        isPublished: true,
        source: 'gutenberg',
        addedBy: 'system-seed',
      },
    })
    imported++
    await new Promise(r => setTimeout(r, 300))
  }

  console.log(`\n✅ Done. Imported ${imported} books.`)
}

main()
  .catch((e) => { console.error('FATAL', e); process.exit(1) })
  .finally(() => prisma.$disconnect())
