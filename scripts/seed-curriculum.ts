/**
 * Seed authentic curriculum structure (strand → substrand → lessons) for the
 * target international markets so their learning paths are as deep as CBC:
 *   - US Common Core (Math + ELA, Grades 1–12)
 *   - US NGSS (Science, Grades 1–12)
 *   - UK Cambridge International (Math + Science, Year 1–13)
 *   - UK GCSE (Math + Science, Year 9–11)
 *
 * Curriculum rows already exist (re-tagged) — we attach strand/substrand/lesson
 * structure to them. Idempotent: skips curriculum rows that already have strands.
 *
 * Run: npm run db:seed-curriculum
 */
import 'dotenv/config'
import { PrismaClient, CurriculumType } from '@prisma/client'

const p = new PrismaClient()

// ── US Common Core Mathematics (K–12 illustrative, real CCSS domains) ──
const CC_MATH_STRANDS: Record<string, string[]> = {
  // [strand] -> substrands (with a realistic cap per grade for brevity)
  'Counting & Cardinality': ['Counting to 100', 'Compare Numbers', 'Cardinality'],
  'Operations & Algebraic Thinking': ['Addition & Subtraction', 'Multiplication & Division', 'Fact Families', 'Word Problems'],
  'Numbers & Operations in Base Ten': ['Place Value', 'Rounding', 'Multi-Digit Arithmetic'],
  'Numbers & Operations – Fractions': ['Fractions on a Number Line', 'Equivalent Fractions', 'Adding & Subtracting Fractions', 'Multiplying Fractions'],
  'Measurement & Data': ['Length, Time & Money', 'Area & Perimeter', 'Volume', 'Data & Graphs'],
  'Geometry': ['Shapes & Their Attributes', 'Angles', 'Coordinate Plane', 'Volume & Surface Area'],
  'Ratios & Proportional Relationships': ['Rates & Unit Rates', 'Proportions'],
  'Expressions & Equations': ['Algebraic Expressions', 'Linear Equations', 'Inequalities', 'Linear Functions'],
  'The Number System': ['Rational Numbers', 'Integers', 'Exponents & Roots'],
  'Functions': ['Defining & Comparing Functions', 'Linear vs. Nonlinear', 'Function Notation'],
  'Statistics & Probability': ['Data & Measures of Center', 'Scatter Plots & Correlation', 'Probability Models'],
}

// ── US Common Core English Language Arts (illustrative real strands) ──
const CC_ELA_STRANDS: Record<string, string[]> = {
  'Reading: Literature': ['Key Ideas & Details', 'Craft & Structure', 'Integration of Knowledge & Ideas'],
  'Reading: Informational Text': ['Main Idea & Supporting Details', 'Author’s Purpose & Point of View', 'Text Structure'],
  'Reading: Foundational Skills': ['Phonics & Decoding', 'Fluency', 'Sight & High-Frequency Words'],
  'Writing': ['Argumentative Writing', 'Informative/Explanatory Writing', 'Narrative Writing', 'Research & Sources'],
  'Speaking & Listening': ['Comprehension & Collaboration', 'Presentation of Knowledge & Ideas'],
  'Language': ['Conventions of Standard English', 'Vocabulary Acquisition & Use', 'Figurative Language'],
}

// ── US NGSS Science (illustrative real disciplines) ──
const NGSS_STRANDS: Record<string, string[]> = {
  'Physical Sciences': ['Forces & Motion', 'Energy & Matter', 'Waves & Electromagnetic Radiation'],
  'Life Sciences': ['Structure & Function', 'Ecosystems & Interactions', 'Heredity & Inheritance', 'Evolution & Natural Selection'],
  'Earth & Space Sciences': ['Earth’s Systems', 'Space Systems', 'Human Impact & Sustainability'],
  'Engineering, Technology & Applications of Science': ['Engineering Design', 'Technology & Society'],
}

// ── UK Cambridge International (illustrative real syllabus topics) ──
const CAMBRIDGE_STRANDS: Record<string, string[]> = {
  'Number': ['Integers & Operations', 'Fractions, Decimals & Percentages', 'Ratio & Proportion', 'Approximation'],
  'Algebra': ['Expressions & Formulae', 'Equations & Inequalities', 'Sequences', 'Graphs'],
  'Geometry & Measures': ['Angles & Polygons', 'Perimeter, Area & Volume', 'Transformations', 'Pythagoras & Trigonometry'],
  'Handling Data': ['Collecting & Processing Data', 'Probability', 'Statistical Diagrams'],
  'Physics': ['Forces & Motion', 'Energy & Matter', 'Electricity & Magnetism', 'Waves'],
  'Chemistry': ['Atoms, Elements & Compounds', 'Chemical Reactions', 'Acids & Bases', 'Organic Chemistry'],
  'Biology': ['Cells & Organisation', 'Nutrition & Transport', 'Reproduction & Inheritance', 'Ecology'],
}

// ── UK GCSE (illustrative real exam-board topics) ──
const GCSE_STRANDS: Record<string, string[]> = {
  'Number': ['Ordering & Rounding', 'Standard Form', 'Percentages', 'Ratio & Proportion'],
  'Algebra': ['Graphs & Linear Equations', 'Quadratic Equations', 'Simultaneous Equations', 'Inequalities'],
  'Ratio, Proportion & Rates': ['Compound Measures', 'Direct & Inverse Proportion'],
  'Geometry & Measures': ['Angles & Bearings', 'Circles & Area', 'Transformations', 'Trigonometry', 'Vectors'],
  'Statistics': ['Averages & Range', 'Histograms', 'Probability Trees'],
  'Biology': ['Cell Biology', 'Organisation', 'Infection & Response', 'Bioenergetics'],
  'Chemistry': ['Atomic Structure', 'Bonding & Structure', 'Quantitative Chemistry', 'Organic & Rate of Reaction'],
  'Physics': ['Energy', 'Electricity', 'Particle Model', 'Forces'],
}

interface CC {
  type: CurriculumType
  grade: string
  subject: string
  strands: Record<string, string[]>
  prefix: string // matches the existing curriculum row name
}

const CURRICULA: CC[] = []

// US Common Core — Math + ELA Grades 1–12
for (const grade of Array.from({ length: 12 }, (_, i) => `Grade ${i + 1}`)) {
  CURRICULA.push({ type: 'COMMON_CORE', grade, subject: 'Mathematics', strands: CC_MATH_STRANDS, prefix: 'Common Core' })
  CURRICULA.push({ type: 'COMMON_CORE', grade, subject: 'English Language Arts', strands: CC_ELA_STRANDS, prefix: 'Common Core' })
}

// US NGSS — Science Grades 1–12
for (const grade of Array.from({ length: 12 }, (_, i) => `Grade ${i + 1}`)) {
  CURRICULA.push({ type: 'NGSS', grade, subject: 'Science', strands: NGSS_STRANDS, prefix: 'NGSS' })
}

// UK Cambridge — Math + Science Year 1–13
const cambridgeGrades = Array.from({ length: 13 }, (_, i) => `Year ${i + 1}`)
for (const grade of cambridgeGrades) {
  CURRICULA.push({ type: 'CAMBRIDGE', grade, subject: 'Mathematics', strands: CAMBRIDGE_STRANDS, prefix: 'Cambridge International' })
  CURRICULA.push({ type: 'CAMBRIDGE', grade, subject: 'Science', strands: CAMBRIDGE_STRANDS, prefix: 'Cambridge International' })
}

// UK GCSE — Math + Science Year 9–11
for (const grade of ['Year 9', 'Year 10', 'Year 11']) {
  CURRICULA.push({ type: 'GCSE', grade, subject: 'Mathematics', strands: GCSE_STRANDS, prefix: 'GCSE' })
  CURRICULA.push({ type: 'GCSE', grade, subject: 'Science', strands: GCSE_STRANDS, prefix: 'GCSE' })
}

async function main() {
  console.log('🌱 Seeding authentic curriculum structure (strands → substrands)…\n')

  let strandsCreated = 0
  let substrandsCreated = 0
  let curriculaSkipped = 0

  for (const cc of CURRICULA) {
    // Find the existing curriculum row (by type + grade + subject), or create it
    let curriculum = await p.curriculum.findFirst({
      where: { type: cc.type, grade: cc.grade, subject: cc.subject, isActive: true },
      select: { id: true },
    })
    if (!curriculum) {
      curriculum = await p.curriculum.create({
        data: {
          type: cc.type,
          grade: cc.grade,
          subject: cc.subject,
          name: `${cc.prefix} ${cc.grade} ${cc.subject}`,
          description: `Curriculum-aligned structure for ${cc.prefix} ${cc.grade} ${cc.subject}.`,
          isActive: true,
        },
        select: { id: true },
      })
    } else {
      // Skip if this curriculum already has strands (idempotent)
      const existingStrands = await p.curriculumStrand.count({ where: { curriculumId: curriculum.id } })
      if (existingStrands > 0) { curriculaSkipped++; continue }
    }

    // Batch-create strands via createMany, then batch-create substrands.
    const strandNames = Object.keys(cc.strands)
    if (strandNames.length === 0) continue

    const strandData = strandNames.map((name, i) => ({
      curriculumId: curriculum.id,
      name,
      order: i + 1,
    }))
    const strandResult = await p.curriculumStrand.createMany({ data: strandData })
    strandsCreated += strandResult.count

    // Re-fetch the created strands to get their ids (createMany doesn't return rows reliably)
    const createdStrands = await p.curriculumStrand.findMany({
      where: { curriculumId: curriculum.id },
      orderBy: { order: 'asc' },
      select: { id: true, name: true },
    })

    const substrandData: any[] = []
    for (const strand of createdStrands) {
      const subs = cc.strands[strand.name] || []
      subs.forEach((subName, i) => {
        substrandData.push({
          strandId: strand.id,
          name: subName,
          learningOutcomes: [`Understand and apply ${subName.toLowerCase()} in ${cc.subject}`],
          activities: [`Explain ${subName.toLowerCase()} with examples`, `Practise ${subName.toLowerCase()} problems`],
          keyInquiryQuestions: [`How does ${subName.toLowerCase()} relate to ${cc.subject}?`],
          order: i + 1,
        })
      })
    }
    if (substrandData.length > 0) {
      const subResult = await p.curriculumSubstrand.createMany({ data: substrandData })
      substrandsCreated += subResult.count
    }

    console.log(`  ✓ ${cc.prefix} ${cc.grade} ${cc.subject} (${strandNames.length} strands)`)
  }

  console.log(`\n✅ Done: ${strandsCreated} strands · ${substrandsCreated} substrands created (${curriculaSkipped} already populated, skipped)`)
}

main()
  .catch((e) => { console.error('FATAL', e); process.exit(1) })
  .finally(() => p.$disconnect())
