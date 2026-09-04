/**
 * Seed lesson-level content (CurriculumLesson) for flagship US Common Core
 * grades so a US student lands on ready-to-study lessons immediately.
 * Idempotent: only adds lessons to substrands that have none.
 *
 * Run: npm run db:seed-lessons
 */
import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

const p = new PrismaClient()

function lessonTitlesFor(substrandName: string): { title: string; obj: string[] }[] {
  const name = substrandName.trim()
  const lower = name.toLowerCase()
  const topic = name.charAt(0).toUpperCase() + name.slice(1)
  // Build 2–3 lessons around the substrand's specific outcome wording
  return [
    { title: `Introduction to ${topic}`, obj: [`Understand ${lower}`, `Identify key concepts of ${lower}`] },
    { title: `${topic} — Guided Practice`, obj: [`Apply ${lower}`, `Solve problems using ${lower}`] },
    { title: `${topic} — Mastery & Review`, obj: [`Demonstrate mastery of ${lower}`, `Explain ${lower} in your own words`] },
  ]
}

async function main() {
  console.log('🌱 Seeding lesson-level content for flagship US curricula…\n')

  const targetCurriculum = await p.curriculum.findMany({
    where: {
      type: 'COMMON_CORE',
      OR: [
        { grade: 'Grade 8', subject: 'Mathematics' },
        { grade: 'Grade 8', subject: 'English Language Arts' },
        { grade: 'Grade 5', subject: 'Mathematics' },
      ],
    },
    select: { id: true, grade: true, subject: true },
  })

  if (targetCurriculum.length === 0) {
    console.log('⚠️  No Common Core curriculum rows found — run db:seed-curriculum first.')
    return
  }

  let lessonsCreated = 0
  let substrandsTouched = 0

  for (const cur of targetCurriculum) {
    const strands = await p.curriculumStrand.findMany({ where: { curriculumId: cur.id }, select: { id: true, name: true } })
    for (const strand of strands) {
      const substrands = await p.curriculumSubstrand.findMany({ where: { strandId: strand.id }, select: { id: true, name: true } })
      for (const sub of substrands) {
        const existing = await p.curriculumLesson.count({ where: { substrandId: sub.id } })
        if (existing > 0) continue

        const templates = lessonTitlesFor(sub.name).slice(0, 3)
        if (templates.length === 0) continue

        const data = templates.map((t, i) => ({
          substrandId: sub.id,
          title: t.title,
          objectives: t.obj,
          duration: 40,
          order: i + 1,
        }))
        await p.curriculumLesson.createMany({ data })
        lessonsCreated += data.length
        substrandsTouched++
        console.log(`  ✓ ${cur.grade} ${cur.subject} → ${sub.name}: ${data.length} lessons`)
      }
    }
  }

  console.log(`\n✅ Done: ${lessonsCreated} lessons created across ${substrandsTouched} substrands`)
}

main()
  .catch((e) => { console.error('FATAL', e); process.exit(1) })
  .finally(() => p.$disconnect())
