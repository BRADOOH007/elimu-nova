/**
 * Seed authentic KICD curriculum structures (strands → substrands) for:
 *   - Grades 1–3 lower-primary subjects (English, Kiswahili, CRE, Social
 *     Studies, Science & Tech, Creative Arts, Environmental, Literary)
 *   - Pre-Tech Studies Grade 7–9 (junior secondary)
 * Mirrors the CBC curriculum designs. Idempotent: skips grade/subject that
 * already has strands.
 *
 * Run: npm run db:seed-lower-primary
 */
import 'dotenv/config'
import { PrismaClient, CurriculumType } from '@prisma/client'

const p = new PrismaClient()

// ── Lower-primary (Grade 1-3) strand structures ──
const G1_3 = {
  'English Activities': {
    'Listening & Speaking': ['Oral Communication', 'Pronunciation & Vocabulary', 'Listening Comprehension'],
    'Reading': ['Pre-Reading Skills', 'Reading Fluency', 'Reading Comprehension'],
    'Writing': ['Pre-Writing Skills', 'Letter Formation', 'Sentence Construction'],
    'Grammar': ['Nouns & Pronouns', 'Verbs & Tenses', 'Punctuation'],
  },
  'Shughuli za Kiswahili': {
    'Kusikiliza na Kuzungumza': ['Mawasiliano ya Mdomo', 'Matamshi na Msamiati', 'Uelewaji wa Kusikiliza'],
    'Kusoma': ['Stadi za Kusoma', 'Usomaji wa Maneno', 'Ufahamu wa Kusoma'],
    'Kuandika': ['Stadi za Kuandika', 'Kuchora Herufi', 'Ujenzi wa Sentensi'],
    'Sarufi': ['Nomino na Viwakilishi', 'Vitenzi na Nyakati', 'Uakifishaji'],
  },
  'C.R.E Activities': {
    'The Bible': ['The Bible as the Word of God', 'Bible Stories'],
    'Creation': ["God's Creation", 'Caring for Creation'],
    'The Family': ['Family Relationships', 'Roles in the Family'],
    'Values': ['Honesty & Respect', 'Kindness & Love'],
  },
  'Social Studies Activities': {
    'The Environment': ['Our School', 'Our Home & Family', 'Caring for the Environment'],
    'Our Community': ['People in the Community', 'Community Helpers'],
    'Citizenship': ['Being a Good Citizen', 'National Symbols'],
  },
  'Science & Technology Activities': {
    'Living Things': ['Plants', 'Animals', 'Human Body'],
    'Environment': ['Weather', 'Soil & Water', 'Caring for the Environment'],
    'Materials': ['Properties of Materials', 'Uses of Materials'],
    'Energy': ['Sources of Energy', 'Light & Sound'],
  },
  'Creative Arts Activities': {
    'Art & Craft': ['Drawing & Colouring', 'Modelling & Construction'],
    'Music': ['Songs & Rhymes', 'Rhythm & Movement'],
    'Movement & Dance': ['Basic Movements', 'Creative Movement'],
  },
  'Agriculture & Nutrition Activities': {
    'Plants': ['Growing Plants', 'Caring for Plants'],
    'Animals': ['Pets & Farm Animals'],
    'Nutrition': ['Food Groups', 'Healthy Eating'],
    'Safety': ['Farm Safety', 'Personal Hygiene'],
  },
  'Physical & Health Education': {
    'Games & Sports': ['Basic Games', 'Body Movements'],
    'Health': ['Personal Hygiene', 'Healthy Living'],
  },
}

// ── Pre-Tech Studies (Grade 7-9) ──
const PRETECH = {
  'Introduction to Pre-Technical Studies': ['Importance of Pre-Technical Studies', 'Safety in the Workshop'],
  'Safety': ['Workshop Safety', 'First Aid', 'Personal Protection Equipment'],
  'Materials': ['Types of Materials', 'Properties & Uses of Materials', 'Sustainable Use of Materials'],
  'Tools & Equipment': ['Hand Tools', 'Power Tools', 'Tool Maintenance'],
  'Production Techniques': ['Measuring & Marking', 'Cutting & Shaping', 'Joining & Finishing'],
  'Drawing & Design': ['Technical Drawing', 'Freehand Sketching', 'Design Process'],
  'Energy': ['Forms of Energy', 'Energy Sources', 'Energy Conservation'],
  'Entrepreneurship': ['Entrepreneurial Skills', 'Simple Projects & Enterprise'],
}

// ── Pre-primary (PP1/PP2 — ECD) strand structures ──
const PP = {
  'Mathematical Activities': {
    'Number Work': ['Counting 1–20', 'Number Recognition', 'Simple Addition & Subtraction'],
    'Measurement': ['Length', 'Mass', 'Time'],
    'Shapes & Space': ['Basic Shapes', 'Position & Direction'],
    'Patterns': ['Pattern Recognition', 'Simple Sequences'],
  },
  'Language Activities': {
    'Listening & Speaking': ['Oral Language', 'Story Telling', 'Pronunciation'],
    'Reading Readiness': ['Pre-Reading Skills', 'Picture Reading'],
    'Writing Readiness': ['Pre-Writing', 'Letter Formation', 'Writing Own Name'],
  },
  'Creative Activities': {
    'Art & Craft': ['Drawing', 'Colouring', 'Modelling', 'Collage & Constructing'],
    'Music & Movement': ['Songs & Rhymes', 'Rhythm & Movement', 'Action Songs'],
  },
  'Environmental Activities': {
    'The Environment': ['My Home & School', 'The Local Environment', 'Caring for the Environment'],
    'Living Things': ['Plants', 'Animals', 'The Human Body'],
    'Social Environment': ['My Family', 'People in the Community', 'Getting Along'],
  },
  'Physical & Health Education': {
    'Gross & Fine Motor Skills': ['Body Awareness', 'Locomotor Movements', 'Hand-Eye Coordination'],
    'Health & Safety': ['Personal Hygiene', 'Healthy Habits', 'Basic Safety'],
  },
}

async function seedStructure(type: CurriculumType, grade: string, subject: string, strands: Record<string, string[]>, prefix: string) {
  let curriculum = await p.curriculum.findFirst({ where: { type, grade, subject, isActive: true }, select: { id: true } })
  if (!curriculum) {
    curriculum = await p.curriculum.create({
      data: { type, grade, subject, name: `${prefix} ${grade} ${subject}`, description: `Curriculum-aligned structure for ${prefix} ${grade} ${subject}.`, isActive: true },
      select: { id: true },
    })
  } else {
    const existing = await p.curriculumStrand.count({ where: { curriculumId: curriculum.id } })
    if (existing > 0) { return null } // already seeded
  }

  const strandData = Object.keys(strands).map((name, i) => ({ curriculumId: curriculum.id, name, order: i + 1 }))
  await p.curriculumStrand.createMany({ data: strandData })

  const created = await p.curriculumStrand.findMany({ where: { curriculumId: curriculum.id }, orderBy: { order: 'asc' }, select: { id: true, name: true } })
  const subData: any[] = []
  for (const strand of created) {
    const subs = strands[strand.name] || []
    subs.forEach((name, i) => subData.push({
      strandId: strand.id, name,
      learningOutcomes: [`Understand and apply ${name.toLowerCase()} in ${subject}`],
      activities: [`Explain ${name.toLowerCase()} with examples`, `Practise ${name.toLowerCase()} activities`],
      keyInquiryQuestions: [`How does ${name.toLowerCase()} relate to ${subject}?`],
      order: i + 1,
    }))
  }
  if (subData.length) await p.curriculumSubstrand.createMany({ data: subData })
  return Object.keys(strands).length
}

async function main() {
  console.log('🌱 Seeding lower-primary (Gr 1–3) + Pre-Tech curriculum structures…\n')
  let created = 0

  // Grades 1-3: all subjects
  for (const grade of ['Grade 1', 'Grade 2', 'Grade 3']) {
    for (const [subject, strands] of Object.entries(G1_3)) {
      const n = await seedStructure('CBC', grade, subject, strands, 'CBC')
      if (n) { created++; console.log(`  ✓ ${grade} ${subject} (${n} strands)`) }
    }
  }

  // Pre-Tech 7-9
  for (const grade of ['Grade 7', 'Grade 8', 'Grade 9']) {
    const n = await seedStructure('CBC', grade, 'Pretechnical Studies Activities', PRETECH, 'CBC')
    if (n) { created++; console.log(`  ✓ ${grade} Pre-Tech Studies (${n} strands)`) }
  }

  // Pre-primary PP1/PP2 (ECD)
  for (const grade of ['PP1', 'PP2']) {
    for (const [subject, strands] of Object.entries(PP)) {
      const n = await seedStructure('CBC', grade, subject, strands, 'CBC')
      if (n) { created++; console.log(`  ✓ ${grade} ${subject} (${Object.keys(strands).length} strands)`) }
    }
  }

  console.log(`\n✅ Done: ${created} new grade/subject structures seeded`)
}

main()
  .catch((e) => { console.error('FATAL', e); process.exit(1) })
  .finally(() => p.$disconnect())
