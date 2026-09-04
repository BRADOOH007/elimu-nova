/**
 * Backfill grade ranges for existing books based on readingLevel.
 * 
 * Usage: npx tsx scripts/backfill-book-grades.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const GRADE_MAP: Record<string, { gradeMin: number; gradeMax: number }> = {
  Beginner:     { gradeMin: 0, gradeMax: 3 },
  Intermediate: { gradeMin: 4, gradeMax: 8 },
  Advanced:     { gradeMin: 9, gradeMax: 12 },
}

async function main() {
  const nullGradeBooks = await prisma.book.findMany({
    where: { OR: [{ gradeMin: null }, { gradeMax: null }] },
    select: { id: true, title: true, readingLevel: true, gradeMin: true, gradeMax: true },
  })

  console.log(`Found ${nullGradeBooks.length} books with null grade ranges.`)

  let updated = 0
  let skipped = 0

  for (const book of nullGradeBooks) {
    if (!book.readingLevel || !GRADE_MAP[book.readingLevel]) {
      console.log(`SKIP (no reading level): ${book.title}`)
      skipped++
      continue
    }

    const range = GRADE_MAP[book.readingLevel]
    await prisma.book.update({
      where: { id: book.id },
      data: { gradeMin: range.gradeMin, gradeMax: range.gradeMax },
    })
    console.log(`UPDATED: ${book.title} → grades ${range.gradeMin}-${range.gradeMax} (${book.readingLevel})`)
    updated++
  }

  console.log(`\nDone. Updated ${updated}, skipped ${skipped}.`)
}

main()
  .finally(() => prisma.$disconnect())
  .catch(e => { console.error(e); process.exit(1) })
