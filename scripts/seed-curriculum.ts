import { PrismaClient } from '@prisma/client'
import { grades1to9CurriculumByTerm } from '../src/data/grades1-9CurriculumByTerm'
import { seniorSecondaryCurriculumData } from '../src/data/seniorSecondaryCurriculum'

const prisma = new PrismaClient()

const SENIOR_SUBJECTS = seniorSecondaryCurriculumData

async function batchInsert<T>(items: T[], fn: (item: T) => Promise<any>, chunkSize = 50, label = '') {
  let done = 0
  for (let i = 0; i < items.length; i += chunkSize) {
    const chunk = items.slice(i, i + chunkSize)
    await Promise.all(chunk.map(fn))
    done += chunk.length
    if (label) console.log(`  ${label}: ${done}/${items.length}`)
  }
}

async function main() {
  console.log('🌱 Seeding CBC curriculum data...')

  // 1. Collect all data in memory
  interface C { name: string; type: string; subject: string; grade: string; term: number | null }
  interface S { curriculumIdx: number; name: string; order: number }
  interface Sub { strandIdx: number; name: string; order: number; learningOutcomes: string[]; activities: string[] }

  const curriculumsData: C[] = []
  const strandsData: S[] = []
  const substrandsData: Sub[] = []

  for (const termData of grades1to9CurriculumByTerm) {
    for (const area of termData.learningAreas) {
      const ci = curriculumsData.length
      curriculumsData.push({
        name: `CBC ${termData.grade} ${area.name} Term ${termData.term}`,
        type: 'CBC',
        subject: area.name,
        grade: termData.grade,
        term: termData.term,
      })
      for (let si = 0; si < area.strands.length; si++) {
        const siIdx = strandsData.length
        strandsData.push({ curriculumIdx: ci, name: area.strands[si].name, order: si })
        for (let ti = 0; ti < area.strands[si].subStrands.length; ti++) {
          const sub = area.strands[si].subStrands[ti]
          substrandsData.push({
            strandIdx: siIdx,
            name: sub.name,
            order: ti,
            learningOutcomes: sub.learningOutcomes || [],
            activities: sub.activities || [],
          })
        }
      }
    }
  }

  for (const subjectData of SENIOR_SUBJECTS) {
    const ci = curriculumsData.length
    curriculumsData.push({
      name: `CBC ${subjectData.grade} ${subjectData.subject}`,
      type: 'CBC',
      subject: subjectData.subject,
      grade: subjectData.grade,
      term: null,
    })
    for (let si = 0; si < subjectData.strands.length; si++) {
      const siIdx = strandsData.length
      strandsData.push({ curriculumIdx: ci, name: subjectData.strands[si].name, order: si })
      for (let ti = 0; ti < subjectData.strands[si].subStrands.length; ti++) {
        const sub = subjectData.strands[si].subStrands[ti]
        substrandsData.push({
          strandIdx: siIdx,
          name: sub.name,
          order: ti,
          learningOutcomes: sub.learningOutcomes || [],
          activities: [],
        })
      }
    }
  }

  console.log(`  Collected: ${curriculumsData.length} curriculums, ${strandsData.length} strands, ${substrandsData.length} substrands`)

  // 2. Clear existing data
  await prisma.$transaction([
    prisma.curriculumLesson.deleteMany(),
    prisma.curriculumSubstrand.deleteMany(),
    prisma.curriculumStrand.deleteMany(),
    prisma.curriculum.deleteMany(),
  ])
  console.log('  Cleared existing data')

  // 3. Create curriculums
  const createdCurriculums: { id: string }[] = []
  await batchInsert(curriculumsData, (c) =>
    prisma.curriculum.create({ data: c as any }).then(r => createdCurriculums.push(r)),
    50, 'Curriculums'
  )

  // 4. Create strands
  const createdStrands: { id: string }[] = []
  await batchInsert(strandsData, (s) =>
    prisma.curriculumStrand.create({
      data: { curriculumId: createdCurriculums[s.curriculumIdx].id, name: s.name, order: s.order },
    }).then(r => createdStrands.push(r)),
    50, 'Strands'
  )

  // 5. Create substrands
  await batchInsert(substrandsData, (sub) =>
    prisma.curriculumSubstrand.create({
      data: {
        strandId: createdStrands[sub.strandIdx].id,
        name: sub.name,
        order: sub.order,
        learningOutcomes: sub.learningOutcomes,
        activities: sub.activities,
      },
    }),
    100, 'Substrands'
  )

  const totalCurriculums = await prisma.curriculum.count()
  const totalStrands = await prisma.curriculumStrand.count()
  const totalSubstrands = await prisma.curriculumSubstrand.count()
  console.log(`\n📊 Total: ${totalCurriculums} curriculums, ${totalStrands} strands, ${totalSubstrands} substrands`)
  console.log('🎉 Curriculum seeding complete!')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
