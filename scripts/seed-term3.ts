/**
 * Generate + save KICD Term-3 termly schemes for all CBC grades/subjects that
 * appear in the teacher's Term-III downloads. Idempotent: skips any grade/
 * subject/term that already has a saved scheme.
 *
 * Run: npm run db:seed-term3
 */
import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { generateTermScheme, saveTermScheme, hasTermScheme } from '../src/lib/kicd-content'

const p = new PrismaClient()

const DAYS_IN_WEEKS = 13
const LESSONS_PER_WEEK = 5

const TARGETS: Array<{ subject: string; grades: string[] }> = [
  { subject: 'English', grades: ['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9'] },
  { subject: 'Science and Technology', grades: ['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6'] },
  { subject: 'Integrated Science', grades: ['Grade 7', 'Grade 8', 'Grade 9'] },
  { subject: 'Mathematics', grades: ['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6'] },
  { subject: 'Social Studies', grades: ['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9'] },
  { subject: 'Creative Arts', grades: ['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6'] },
  { subject: 'CRE', grades: ['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9'] },
  { subject: 'Kiswahili', grades: ['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9'] },
  { subject: 'Agriculture and Nutrition', grades: ['Grade 1', 'Grade 2', 'Grade 3'] },
  { subject: 'Pre-Tech Studies', grades: ['Grade 7', 'Grade 8', 'Grade 9'] },
  { subject: 'Physical and Health Education', grades: ['Grade 1', 'Grade 2', 'Grade 3'] },
  { subject: 'Mathematical Activities', grades: ['PP1', 'PP2'] },
  { subject: 'Language Activities', grades: ['PP1', 'PP2'] },
  { subject: 'Creative Activities', grades: ['PP1', 'PP2'] },
  { subject: 'Environmental Activities', grades: ['PP1', 'PP2'] },
  { subject: 'Physical and Health Education', grades: ['PP1', 'PP2'] },
]

async function main() {
  const TERMS = [1, 2, 3]
  console.log(`🌱 Generating KICD schemes for ${TERMS.map(t => `Term ${t}`).join(', ')}…\n`)
  let total = 0
  let skipped = 0
  let fallbackOnly = 0

  for (const term of TERMS) {
    console.log(`\n══ TERM ${term} ══`)
    for (const t of TARGETS) {
      for (const grade of t.grades) {
        const key = `${grade} ${t.subject}`
        if (await hasTermScheme(grade, t.subject, term)) { skipped++; continue }

        const rows = await generateTermScheme(grade, t.subject, term, DAYS_IN_WEEKS, LESSONS_PER_WEEK)
        if (rows.length > 0) {
          const count = await saveTermScheme(rows)
          // Detect fallback (generic) schemes — those without real strand names
          const realStrands = new Set(rows.map(r => r.strand)).size
          if (realStrands <= 1) fallbackOnly++
          total += count
          console.log(`  ✓ ${key} → ${count} lessons (${realStrands} strand${realStrands>1?'s':''})`)
        }
      }
    }
  }

  console.log(`\n✅ Done: ${total} lessons generated (${skipped} existing skipped, ${fallbackOnly} using fallback template)`)
}

main()
  .catch((e) => { console.error('FATAL', e); process.exit(1) })
  .finally(() => p.$disconnect())
