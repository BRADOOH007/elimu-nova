import { prisma } from '@/lib/prisma'

/**
 * KICD content library — structured CBC/CBE termly schemes-of-work and lesson
 * data (KICD format). Stores the term's week-by-week lesson skeleton so
 * teachers can generate KICD-compliant lesson plans for any grade/subject/term.
 */

// App-level short subject names -> DB CBC subject names (mirrors lesson-cache)
const SUBJECT_ALIASES: Record<string, string[]> = {
  Mathematics: ['Mathematics Activities', 'Mathematics', 'Maths', 'Essential Mathematics'],
  English: ['English Activities', 'English Language Activities', 'English Language', 'English'],
  Kiswahili: ['Shughuli za Kiswahili', 'Kiswahili'],
  Science: ['Science & Technology Activities', 'Science and Technology Activities', 'Integrated Science Activities', 'Integrated Science', 'Science'],
  'Science and Technology': ['Science & Technology Activities', 'Science and Technology Activities', 'Science'],
  'Integrated Science': ['Integrated Science Activities', 'Integrated Science'],
  'Social Studies': ['Social Studies Activities', 'Social Studies'],
  'Social Sciences': ['Social Sciences', 'Social Studies Activities', 'Social Studies'],
  CRE: ['C.R.E Activities', 'Christian Religious Education Activities', 'CRE Activities', 'CRE'],
  Agriculture: ['Agriculture & Nutrition Activities', 'Agriculture and Nutrition Activities', 'Agriculture'],
  'Creative Arts': ['Creative Arts Activities', 'Creative Arts'],
  'Creative Activities': ['Creative Arts Activities', 'Creative Arts'],
  'Physical Education': ['Physical Education Activities', 'Physical Education'],
  'Home Science': ['Home Science Activities', 'Home Science'],
  'Pre-Tech Studies': ['Pretechnical Studies Activities', 'Pre-Tech Studies Activities', 'Pre Tech Studies', 'Pre-Tech Studies'],
  'Environmental Activities': ['Environmental Activities', 'Environment'],
  'Language Activities': ['Language Activities', 'English Language Activities'],
  'Mathematical Activities': ['Mathematical Activities', 'Mathematics Activities', 'Mathematics'],
  'Agriculture and Nutrition': ['Agriculture & Nutrition Activities', 'Agriculture and Nutrition Activities', 'Agriculture'],
  'Physical and Health Education': ['Physical & Health Education', 'Physical and Health Education Activities', 'Physical Education'],
  'Physical & Health Education': ['Physical & Health Education', 'Physical and Health Education Activities', 'Physical Education'],
}

/** Resolve an app-level subject to the DB curriculum subject name that exists. */
async function resolveCurriculumSubject(grade: string, subject: string): Promise<string | null> {
  // 1. exact
  const exact = await prisma.curriculum.findFirst({ where: { grade, subject, isActive: true }, select: { id: true, subject: true } })
  if (exact) return exact.subject
  // 2. aliases
  const aliases = SUBJECT_ALIASES[subject] || []
  for (const alias of aliases) {
    const viaAlias = await prisma.curriculum.findFirst({ where: { grade, subject: alias, isActive: true }, select: { id: true, subject: true } })
    if (viaAlias) return viaAlias.subject
  }
  // 3. fuzzy contains
  const fuzzy = await prisma.curriculum.findFirst({ where: { grade, isActive: true, subject: { contains: subject } }, select: { id: true, subject: true } })
  return fuzzy?.subject || null
}

export interface KICDRow {
  grade: string
  subject: string
  term: number
  week: number
  lesson: number
  strand: string
  subStrand: string
  learningOutcomes: string[]
  learningExperiences: string[]
  keyInquiryQuestions?: string[]
  resources?: string[]
  assessment?: string
  values?: string[]
  competencies?: string[]
  source?: string
  sourceUrl?: string
  isVerified?: boolean
}

/** Fetch the full termly scheme for a grade/subject/term, ordered by week+lesson. */
export async function getTermScheme(grade: string, subject: string, term: number) {
  return prisma.kICDContent.findMany({
    where: { grade, subject, term },
    orderBy: [{ week: 'asc' }, { lesson: 'asc' }],
  })
}

/** Fetch the lessons for a specific week of a term. */
export async function getWeekLessons(grade: string, subject: string, term: number, week: number) {
  return prisma.kICDContent.findMany({
    where: { grade, subject, term, week },
    orderBy: { lesson: 'asc' },
  })
}

/** Check whether a full term scheme already exists (by grade/subject/term). */
export async function hasTermScheme(grade: string, subject: string, term: number): Promise<boolean> {
  const count = await prisma.kICDContent.count({ where: { grade, subject, term } })
  return count > 0
}

/** Bulk-save a termly scheme (idempotent: replaces the scheme for that grade/subject/term). */
export async function saveTermScheme(rows: KICDRow[]): Promise<number> {
  if (rows.length === 0) return 0
  const { grade, subject, term } = rows[0]
  // Replace existing rows for this grade/subject/term (fresh re-import / re-generate)
  await prisma.kICDContent.deleteMany({ where: { grade, subject, term } })
  const result = await prisma.kICDContent.createMany({ data: rows })
  return result.count
}

/** Add a single lesson row (manual/imported) without wiping the term. */
export async function addLessonRow(row: KICDRow) {
  return prisma.kICDContent.create({ data: row })
}

/**
 * Generate a KICD-compliant termly scheme (week → lesson rows) purely from the
 * stored curriculum structure (strands → substrands for the given grade+subject).
 * Distributes all substrands across `weeks` × `lessonsPerWeek` so the teacher
 * gets an accurate week-by-week alignment without depending on AI.
 */
export async function generateTermScheme(
  grade: string,
  subject: string,
  term: number,
  weeks = 13,
  lessonsPerWeek = 5,
): Promise<KICDRow[]> {
  // Find the active curriculum row by resolving the subject name properly
  const curriculumSubject = await resolveCurriculumSubject(grade, subject)
  const curriculum = curriculumSubject
    ? await prisma.curriculum.findFirst({ where: { grade, subject: curriculumSubject, isActive: true }, orderBy: { createdAt: 'desc' }, select: { id: true } })
    : null

  let rows: KICDRow[] = []
  if (curriculum) {
    const strands = await prisma.curriculumStrand.findMany({
      where: { curriculumId: curriculum.id },
      orderBy: { order: 'asc' },
      include: { substrands: { orderBy: { order: 'asc' } } },
    })
    // Flatten all substrands across all strands, then distribute into weeks.
    const allSubstrands: { strand: string; sub: string; outcomes: string[]; activities: string[] }[] = []
    for (const s of strands) {
      for (const ss of s.substrands) {
        allSubstrands.push({ strand: s.name, sub: ss.name, outcomes: ss.learningOutcomes, activities: ss.activities })
      }
    }
    if (allSubstrands.length > 0) {
      const slots = weeks * lessonsPerWeek
      const perSlot = Math.max(1, Math.ceil(allSubstrands.length / slots))
      rows = []
      for (let week = 1; week <= weeks; week++) {
        for (let lesson = 1; lesson <= lessonsPerWeek; lesson++) {
          const idx = (week - 1) * lessonsPerWeek + (lesson - 1)
          const block = allSubstrands.slice(idx * perSlot, (idx + 1) * perSlot)
          const sub = block[0] || allSubstrands[Math.min(idx, allSubstrands.length - 1)]
          if (!sub) continue
          rows.push({
            grade,
            subject,
            term,
            week,
            lesson,
            strand: sub.strand,
            subStrand: sub.sub,
            learningOutcomes: sub.outcomes.length ? sub.outcomes : [`Understand ${sub.sub.toLowerCase()}`],
            learningExperiences: sub.activities.length ? sub.activities : [`Explore ${sub.sub.toLowerCase()}`],
            keyInquiryQuestions: [`What is the importance of ${sub.sub.toLowerCase()}?`],
            resources: [`${subject} Curriculum Design ${grade}`],
            assessment: 'Observation, oral questions, and written exercises',
            values: ['Respect', 'Responsibility'],
            competencies: ['Communication & Collaboration', 'Critical Thinking & Problem Solving'],
            source: 'generated',
            isVerified: false,
          })
        }
      }
    }
  }

  // Fallback: even without curriculum rows, produce a generic week skeleton so
  // the teacher always gets a usable scheme (kicks off the AI generation path).
  if (rows.length === 0) {
    for (let week = 1; week <= weeks; week++) {
      for (let lesson = 1; lesson <= lessonsPerWeek; lesson++) {
        rows.push({
          grade, subject, term, week, lesson,
          strand: subject,
          subStrand: `Week ${week} — Lesson ${lesson}`,
          learningOutcomes: [`By the end of the lesson, the learner should be able to explain key concepts in ${subject}`],
          learningExperiences: ['Guided discussion and demonstration', 'Practical activities in groups'],
          keyInquiryQuestions: [`How does ${subject} apply to everyday life?`],
          resources: [`${subject} Curriculum Design ${grade}`],
          assessment: 'Observation, oral questions, and written exercises',
          values: ['Respect', 'Responsibility'],
          competencies: ['Communication & Collaboration', 'Critical Thinking & Problem Solving'],
          source: 'generated',
          isVerified: false,
        })
      }
    }
  }

  return rows
}
