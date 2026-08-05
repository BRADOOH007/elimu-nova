import { prisma } from '@/lib/prisma'
import {
  CBC_CORE_COMPETENCIES,
  CBC_VALUES,
  CBC_PCIS,
  CBC_THEMES,
  CBC_SUBJECT_LESSON_ALLOCATION,
} from '@/lib/cbc-context'
import { retrieveRelevantContext } from '@/lib/rag-pipeline'

export interface CurriculumContext {
  grade: string
  subject: string
  term?: number
  strands: StrandContext[]
  competencies: string[]
  values: string[]
  pcis: string[]
  themes: string[]
  lessonsPerWeek: number
  totalOutcomes: number
}

export interface StrandContext {
  name: string
  order: number
  substrands: SubstrandContext[]
}

export interface SubstrandContext {
  name: string
  order: number
  learningOutcomes: string[]
  activities: string[]
}

export interface DocumentExample {
  id: string
  title: string
  type: 'scheme_of_work' | 'lesson_plan'
  grade: string
  subject: string
  content: string
  uploadedAt: string
}

const SUBJECT_ALIASES: Record<string, string[]> = {
  Mathematics: ['Mathematics Activities', 'Mathematics', 'Essential Mathematics'],
  English: ['English Activities', 'English Language Activities', 'English'],
  Kiswahili: ['Shughuli za Kiswahili', 'Kiswahili', 'Kiswahili / Kenya Sign Language'],
  Science: ['Science & Technology', 'Science and Technology', 'Integrated Science', 'Science'],
  'Science and Technology': ['Science & Technology', 'Integrated Science', 'Science'],
  'Social Studies': ['Social Studies Activities', 'Social Studies'],
  CRE: ['C.R.E Activities', 'Christian Religious Education Activities', 'CRE Activities', 'CRE', 'Religious Education'],
  Agriculture: ['Agriculture and Nutrition', 'Agriculture'],
}

export async function getCurriculumContext(
  grade: string,
  subject: string,
  options?: { topic?: string; strandName?: string }
): Promise<CurriculumContext | null> {
  const aliases = SUBJECT_ALIASES[subject] || [subject]

  const curriculum = await prisma.curriculum.findFirst({
    where: {
      type: 'CBC',
      grade,
      isActive: true,
      OR: [{ subject }, { subject: { in: aliases } }, { subject: { contains: subject } }],
    },
    select: { id: true, term: true },
  })

  if (!curriculum) {
    return null
  }

  const where: any = { curriculumId: curriculum.id }
  if (options?.strandName) {
    where.name = { contains: options.strandName }
  }

  const strands = await prisma.curriculumStrand.findMany({
    where,
    select: { id: true, name: true, order: true },
    orderBy: { order: 'asc' },
    take: 12,
  })

  if (strands.length === 0) {
    return null
  }

  const strandIds = strands.map(s => s.id)
  const substrands = await prisma.curriculumSubstrand.findMany({
    where: { strandId: { in: strandIds } },
    select: { name: true, order: true, learningOutcomes: true, activities: true, strandId: true },
    orderBy: { order: 'asc' },
    take: 60,
  })

  const totalOutcomes = substrands.reduce((sum, s) => sum + (s.learningOutcomes?.length || 0), 0)
  const lessonsPerWeek = CBC_SUBJECT_LESSON_ALLOCATION[subject] || 5

  return {
    grade,
    subject,
    term: curriculum.term || undefined,
    strands: strands.map(s => ({
      name: s.name,
      order: s.order,
      substrands: substrands
        .filter(ss => ss.strandId === s.id)
        .map(ss => ({
          name: ss.name,
          order: ss.order,
          learningOutcomes: ss.learningOutcomes || [],
          activities: ss.activities || [],
        })),
    })),
    competencies: CBC_CORE_COMPETENCIES,
    values: CBC_VALUES,
    pcis: CBC_PCIS,
    themes: CBC_THEMES,
    lessonsPerWeek,
    totalOutcomes,
  }
}

export function buildCurriculumPromptSection(ctx: CurriculumContext): string {
  const lines: string[] = []

  lines.push('## OFFICIAL CURRICULUM OUTCOMES')
  lines.push(`Grade: ${ctx.grade} | Subject: ${ctx.subject} | Lessons/Week: ${ctx.lessonsPerWeek}`)
  if (ctx.term) lines.push(`Term: ${ctx.term}`)
  lines.push(`Total Learning Outcomes: ${ctx.totalOutcomes}`)
  lines.push('')

  for (const strand of ctx.strands) {
    lines.push(`### Strand: ${strand.name}`)
    for (const sub of strand.substrands) {
      lines.push(`#### ${sub.name}`)
      if (sub.learningOutcomes.length > 0) {
        lines.push('Learning Outcomes:')
        for (const lo of sub.learningOutcomes) {
          lines.push(`  - ${lo}`)
        }
      }
      if (sub.activities.length > 0) {
        lines.push('Suggested Activities:')
        for (const act of sub.activities) {
          lines.push(`  - ${act}`)
        }
      }
      lines.push('')
    }
  }

  if (ctx.competencies.length > 0) {
    lines.push('## CORE COMPETENCIES TO INTEGRATE')
    lines.push(ctx.competencies.map(c => `- ${c}`).join('\n'))
    lines.push('')
  }

  if (ctx.values.length > 0) {
    lines.push('## VALUES TO INCORPORATE')
    lines.push(ctx.values.map(v => `- ${v}`).join('\n'))
    lines.push('')
  }

  if (ctx.pcis.length > 0) {
    lines.push('## PERTINENT AND CONTEMPORARY ISSUES')
    lines.push(ctx.pcis.slice(0, 6).map(p => `- ${p}`).join('\n'))
    lines.push('')
  }

  lines.push('---')
  lines.push('IMPORTANT: You MUST ensure every Specific Learning Outcome above is covered in the generated plan.')
  lines.push('Use the exact outcome wording from the curriculum where appropriate.')
  lines.push('')

  return lines.join('\n')
}

export async function getDocumentExamples(
  grade: string,
  subject: string,
  type: 'scheme_of_work' | 'lesson_plan',
  limit: number = 3
): Promise<DocumentExample[]> {
  const where: any = {
    grade,
    subject,
    documentType: type,
    isProcessed: true,
  }

  const docs = await prisma.documentLibrary.findMany({
    where,
    select: {
      id: true,
      title: true,
      documentType: true,
      grade: true,
      subject: true,
      content: true,
      uploadedAt: true,
    },
    orderBy: { uploadedAt: 'desc' },
    take: limit,
  })

  return docs.map(d => ({
    id: d.id,
    title: d.title,
    type: d.documentType as 'scheme_of_work' | 'lesson_plan',
    grade: d.grade,
    subject: d.subject,
    content: d.content,
    uploadedAt: d.uploadedAt.toISOString(),
  }))
}

export function buildDocumentExamplesSection(examples: DocumentExample[]): string {
  if (examples.length === 0) return ''

  const lines: string[] = []
  lines.push('## REFERENCE EXAMPLES FROM TEACHER UPLOADS')
  lines.push('These are real documents uploaded by teachers. Study their formatting, terminology, structure, and instructional style. Generate content that matches this professional quality.')
  lines.push('')

  for (let i = 0; i < examples.length; i++) {
    const ex = examples[i]
    const truncated = ex.content.slice(0, 4000)
    lines.push(`### Example ${i + 1}: ${ex.title} (${ex.grade} ${ex.subject})`)
    lines.push('```')
    lines.push(truncated)
    lines.push('```')
    lines.push('')
  }

  return lines.join('\n')
}

export async function buildFullGenerationContext(
  grade: string,
  subject: string,
  options: {
    topic?: string
    strandName?: string
    generationType: 'scheme_of_work' | 'lesson_plan'
    teacherId?: string
  }
): Promise<{
  curriculumSection: string
  examplesSection: string
  ragContext: string
  context: CurriculumContext | null
}> {
  const context = await getCurriculumContext(grade, subject, {
    topic: options.topic,
    strandName: options.strandName,
  })

  const curriculumSection = context
    ? buildCurriculumPromptSection(context)
    : ''

  let examplesSection = ''
  try {
    const examples = await getDocumentExamples(grade, subject, options.generationType, 3)
    examplesSection = buildDocumentExamplesSection(examples)
  } catch { /* document_library table may not exist yet */ }

  let ragContext = ''
  try {
    const searchQuery = [grade, subject, options.topic || '', options.strandName || ''].filter(Boolean).join(' ')
    ragContext = await retrieveRelevantContext(searchQuery, grade, subject, options.generationType, 3)
  } catch { /* pgvector may not be enabled yet */ }

  return { curriculumSection, examplesSection, ragContext, context }
}
