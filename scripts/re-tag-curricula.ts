/**
 * Re-tag orphaned 'OTHER' curriculum rows with their real CurriculumType.
 *
 * The schema previously collapsed every non-CBC curriculum into type 'OTHER'.
 * Curriculum rows carry the curriculum name in their `name` field, so we can
 * map them back to a specific type. This makes each curriculum individually
 * identifiable so the learning path can resolve correctly.
 *
 * Run: tsx scripts/re-tag-curricula.ts
 */
import 'dotenv/config'
import { PrismaClient, CurriculumType } from '@prisma/client'

const p = new PrismaClient()

// name substring -> CurriculumType (longest/most-specific first)
const RULES: Array<[string, CurriculumType]> = [
  ['Common Core', 'COMMON_CORE'],
  ['Next Generation Science', 'NGSS'],
  ['NGSS', 'NGSS'],
  ['Texas Essential', 'TEKS'],
  ['TEKS', 'TEKS'],
  ['Florida B.E.S.T', 'FLORIDA_BEST'],
  ['California', 'CALIFORNIA'],
  ['New York State', 'NY_STATE'],
  ['Advanced Placement', 'AP'],
  ['GED / HiSET', 'GED'],
  ['Homeschool', 'US_HOMESCHOOL'],
  ['Cambridge International', 'CAMBRIDGE'],
  ['GCSE', 'GCSE'],
  ['A-Level', 'A_LEVEL'],
  ['IGCSE', 'IGCSE'],
  ['IB Diploma', 'IB'],
  ['Baccalaureate', 'IB'],
  ['CAPS', 'CAPS'],
  ['IEB', 'IEB'],
  ['NERDC', 'NERDC'],
  ['CBSE', 'CBSE'],
  ['ICSE', 'ICSE'],
  ['8-4-4', 'EIGHT_FOUR_FOUR'],
]

function mapName(name: string): CurriculumType | null {
  for (const [key, type] of RULES) {
    if (name.includes(key)) return type
  }
  return null
}

async function main() {
  const others = await p.curriculum.findMany({ where: { type: 'OTHER' }, select: { id: true, name: true } })
  console.log(`Found ${others.length} OTHER-typed curriculum rows`)

  let updated = 0
  let unmatched = 0
  for (const row of others) {
    const type = mapName(row.name)
    if (!type) {
      // Only count truly unmatched (e.g. 'General')
      if (!/general/i.test(row.name)) unmatched++
      continue
    }
    await p.curriculum.update({ where: { id: row.id }, data: { type } })
    updated++
  }

  console.log(`✅ Re-tagged ${updated} rows`)
  if (unmatched > 0) console.log(`⚠️  ${unmatched} rows left unmatched (non-general names)`)

  const byType = await p.curriculum.groupBy({ by: ['type'], _count: true })
  console.log('\nFinal curriculum types:')
  byType.sort((a, b) => b._count - a._count).forEach(r => console.log(`  ${r.type}: ${r._count}`))
}

main()
  .catch((e) => { console.error('FATAL', e); process.exit(1) })
  .finally(() => p.$disconnect())
