/**
 * Seed US Curriculum Data — K-12
 * 
 * Seeds all 52 grade-subject combos (K-12 × 4 subjects) into the database.
 * Uses comprehensive data from usCurriculumByTerm.ts.
 * 
 * Usage: npx tsx scripts/seed-us-curriculum.ts
 */

import { PrismaClient } from '@prisma/client'
import { usCurriculumData, type USCurriculumDef } from '../src/data/usCurriculumByTerm'

const prisma = new PrismaClient()

async function main() {
  let created = 0
  let skipped = 0

  for (const def of usCurriculumData) {
    const name = `Common Core ${def.grade} ${def.subject}`

    const existing = await prisma.curriculum.findFirst({ where: { type: 'OTHER', name } })
    if (existing) {
      console.log(`SKIP (exists): ${name}`)
      skipped++
      continue
    }

    const curriculum = await prisma.curriculum.create({
      data: {
        type: 'OTHER',
        name,
        subject: def.subject,
        grade: def.grade,
        description: def.description,
        isActive: true,
      },
    })

    let strandCount = 0
    let substrandCount = 0
    for (const [si, strand] of def.strands.entries()) {
      const createdStrand = await prisma.curriculumStrand.create({
        data: {
          curriculumId: curriculum.id,
          name: strand.name,
          description: strand.description || null,
          order: si + 1,
        },
      })
      strandCount++

      for (const [subi, sub] of strand.substrands.entries()) {
        await prisma.curriculumSubstrand.create({
          data: {
            strandId: createdStrand.id,
            name: sub.name,
            description: sub.description || null,
            learningOutcomes: sub.outcomes,
            activities: [],
            order: subi + 1,
          },
        })
        substrandCount++
      }
    }

    console.log(`CREATED: ${name} (${strandCount} strands, ${substrandCount} substrands)`)
    created++
  }

  console.log(`\nDone. Created ${created} curricula, skipped ${skipped}.`)
  console.log(`Total: ${created + skipped} grade-subject combos.`)
}

main()
  .finally(() => prisma.$disconnect())
  .catch(e => { console.error(e); process.exit(1) })
