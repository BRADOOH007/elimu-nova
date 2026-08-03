/**
 * Shared helpers for smart exam/assignment generation.
 * Curriculum grounding, answer-key extraction, structured dual-write,
 * and deterministic fallbacks — without changing API response shapes.
 */
import { prisma } from '@/lib/prisma'
import { buildKICDSchemePrompt } from '@/lib/cbc-context'

export interface StructuredQuestion {
  id: number | string
  type: 'multiple_choice' | 'true_false' | 'short_answer' | 'essay'
  text: string
  options?: string[]
  marks: number
  correctAnswer?: string
  section?: 'A' | 'B' | 'C'
  bloomLevel?: string
}

export interface StructuredExamPayload {
  questions: StructuredQuestion[]
  answerKey: Record<string, string>
  markdown: string
  totalMarks: number
  title?: string
}

const SUBJECT_ALIASES: Record<string, string[]> = {
  Mathematics: ['Mathematics Activities', 'Mathematics', 'Essential Mathematics'],
  English: ['English Activities', 'English Language Activities', 'English'],
  Kiswahili: ['Shughuli za Kiswahili', 'Kiswahili'],
  Science: ['Science & Technology Activities', 'Science and Technology Activities', 'Integrated Science Activities', 'Science'],
  'Science and Technology': ['Science & Technology Activities', 'Science and Technology Activities', 'Science'],
  'Social Studies': ['Social Studies Activities', 'Social Studies'],
  CRE: ['C.R.E Activities', 'Christian Religious Education Activities', 'CRE Activities', 'CRE'],
  'Religious Education': ['C.R.E Activities', 'Christian Religious Education Activities', 'Religious Activities'],
}

/** Load real curriculum learning outcomes for grade+subject+topic (best-effort). */
export async function loadCurriculumOutcomes(grade: string, subject: string, topic?: string): Promise<string[]> {
  try {
    const aliases = SUBJECT_ALIASES[subject] || [subject]
    const curriculum = await prisma.curriculum.findFirst({
      where: {
        type: 'CBC',
        grade,
        isActive: true,
        OR: [
          { subject },
          { subject: { in: aliases } },
          { subject: { contains: subject } },
        ],
      },
      select: { id: true },
    })
    if (!curriculum) return []

    const strands = await prisma.curriculumStrand.findMany({
      where: { curriculumId: curriculum.id },
      select: { id: true, name: true },
      orderBy: { order: 'asc' },
      take: 12,
    })
    if (strands.length === 0) return []

    const topicLower = (topic || '').toLowerCase()
    const preferred = topicLower
      ? strands.filter(s => s.name.toLowerCase().includes(topicLower) || topicLower.includes(s.name.toLowerCase().slice(0, 8)))
      : strands
    const strandIds = (preferred.length > 0 ? preferred : strands).slice(0, 4).map(s => s.id)

    const subs = await prisma.curriculumSubstrand.findMany({
      where: { strandId: { in: strandIds } },
      select: { name: true, learningOutcomes: true },
      orderBy: { order: 'asc' },
      take: 20,
    })

    const outcomes: string[] = []
    for (const sub of subs) {
      if (topicLower && !sub.name.toLowerCase().includes(topicLower) && !topicLower.includes(sub.name.toLowerCase().slice(0, 10))) {
        // still include if no better match later
      }
      for (const o of sub.learningOutcomes || []) {
        if (o && !outcomes.includes(o)) outcomes.push(o)
      }
      if (outcomes.length >= 10) break
    }

    // If topic filter wiped outcomes, take any from the substrands
    if (outcomes.length === 0) {
      for (const sub of subs) {
        for (const o of sub.learningOutcomes || []) {
          if (o && !outcomes.includes(o)) outcomes.push(o)
        }
        if (outcomes.length >= 8) break
      }
    }

    return outcomes.slice(0, 10)
  } catch {
    return []
  }
}

export function buildAssessmentSystemPrompt(opts: {
  kind: 'exam' | 'assignment'
  grade: string
  subject: string
  topic?: string
  outcomes?: string[]
  templateText?: string | null
}): string {
  const cbc = buildKICDSchemePrompt(opts.grade, opts.subject)
  const outcomesBlock = opts.outcomes && opts.outcomes.length > 0
    ? `\nCURRICULUM LEARNING OUTCOMES (assess these — do not invent unrelated content):\n${opts.outcomes.map((o, i) => `${i + 1}. ${o}`).join('\n')}\n`
    : ''
  const templateBlock = opts.templateText
    ? `\n\nReference template (match structure/style):\n${opts.templateText.slice(0, 5000)}\n---\n`
    : ''
  const isKiswahili = /kiswahili/i.test(opts.subject)

  return `You are a senior Kenyan CBC examiner and assessment designer for ElimuNova AI.
${cbc}
${outcomesBlock}${templateBlock}
RULES:
- Language: ${isKiswahili ? 'Kiswahili throughout' : 'English throughout (unless subject is Kiswahili)'}
- Age-appropriate for ${opts.grade}
- Use Kenyan contexts (KES, counties, local names, real-life scenarios)
- NO LaTeX/TeX/MathJax — plain text math only (1/2, x^2, _____)
- Questions must test understanding, application and analysis — not trivial recall only
- Exactly one correct answer for every MCQ
- Clear, unambiguous stems — no trick wording
- Cover the stated topic/outcomes evenly`
}

/** Strip answer keys / marking schemes from student-facing worksheet content. */
export function stripAnswerKeysFromContent(content: string): string {
  if (!content) return content
  return content
    .replace(/##\s*Answer\s*Key[\s\S]*/i, '')
    .replace(/###\s*Answer\s*Key[\s\S]*/i, '')
    .replace(/📝\s*ANSWER\s*KEY[\s\S]*/i, '')
    .replace(/ANSWER\s*KEY[\s\S]*?(?=##|\n\n#|$)/i, '')
    .replace(/##\s*Marking\s*Scheme[\s\S]*/i, '')
    .replace(/MARKING\s*SCHEME[\s\S]*?(?=##|\n\n#|$)/i, '')
    .replace(/\(\s*Answer\s*:\s*[A-D][a-z]?\s*\)/gi, '')
    .replace(/\*\*Answer\*\*\s*:\s*[A-D][a-z]?/gi, '')
    .trim()
}

/** Extract answer key map from markdown worksheet (Answer: X patterns + Answer Key section). */
export function extractAnswerKeyFromMarkdown(content: string): Record<string, string> {
  const key: Record<string, string> = {}
  if (!content) return key

  // Inline (Answer: X) next to numbered questions
  const lines = content.split('\n')
  let qNum = 0
  for (const line of lines) {
    const numMatch = line.match(/^\s*(?:\*\*)?(\d+)[\.)]\s*/)
    if (numMatch) qNum = parseInt(numMatch[1], 10)
    const ansInline = line.match(/\(Answer\s*:\s*([A-Da-dTtFf]|True|False|[^\)]+)\)/i)
    if (ansInline && qNum > 0) {
      key[String(qNum)] = normalizeAnswer(ansInline[1])
    }
  }

  // Answer Key section: "1. A" or "1) B"
  const keySection = content.match(/(?:Answer\s*Key|ANSWER\s*KEY)[\s\S]*/i)
  if (keySection) {
    const re = /(\d+)[\.)\s:]+([A-Da-d]|True|False|[^\n,;]+)/g
    let m: RegExpExecArray | null
    while ((m = re.exec(keySection[0])) !== null) {
      key[m[1]] = normalizeAnswer(m[2])
    }
  }

  return key
}

function normalizeAnswer(raw: string): string {
  const t = raw.trim()
  if (/^true$/i.test(t)) return 'T'
  if (/^false$/i.test(t)) return 'F'
  if (/^[A-Da-d]$/.test(t)) return t.toUpperCase()
  return t
}

/** Build student-safe markdown worksheet from structured questions (no answers). */
export function buildWorksheetMarkdown(opts: {
  title: string
  subject: string
  grade: string
  topic: string
  questions: StructuredQuestion[]
  includeExplanation?: string
}): string {
  const lines: string[] = [
    `# ${opts.title}`,
    '',
    `**Subject:** ${opts.subject}  |  **Grade:** ${opts.grade}  |  **Topic:** ${opts.topic}`,
    '',
  ]
  if (opts.includeExplanation) {
    lines.push('## Example / Explanation', '', opts.includeExplanation, '', '---', '')
  }
  lines.push('## Questions', '')
  opts.questions.forEach((q, i) => {
    const n = i + 1
    lines.push(`**${n}.** ${q.text}  _(${q.marks} mark${q.marks !== 1 ? 's' : ''})_`)
    if (q.type === 'multiple_choice' && q.options?.length) {
      q.options.forEach(o => lines.push(o.startsWith('A') || o.match(/^[A-D][\.)]/) ? o : `${String.fromCharCode(65 + q.options!.indexOf(o))}. ${o}`))
    } else if (q.type === 'true_false') {
      lines.push('A. True')
      lines.push('B. False')
    } else {
      lines.push('_______________________________________________')
    }
    lines.push('')
  })
  return lines.join('\n')
}

/** Deterministic smart fallback — real topic-based MCQs, never "Option one". */
export function buildFallbackAssignment(opts: {
  title: string
  subject: string
  grade: string
  topic: string
  numQuestions?: number
  outcomes?: string[]
}): { content: string; answerKey: Record<string, string>; questions: StructuredQuestion[] } {
  const n = Math.max(1, Math.min(20, opts.numQuestions || 5))
  const topic = opts.topic || opts.subject
  const outcomes = opts.outcomes || []
  const stems = [
    `Which statement best describes ${topic}?`,
    `A learner is studying ${topic}. What is the most accurate conclusion?`,
    `In the context of ${topic}, which option is correct?`,
    `Why is ${topic} important in everyday life in Kenya?`,
    `Which example correctly applies ${topic}?`,
    `What is a common mistake learners make when learning ${topic}?`,
    `Which step comes first when solving a problem involving ${topic}?`,
    `How does ${topic} relate to other concepts in ${opts.subject}?`,
    `Which resource would best help a ${opts.grade} learner understand ${topic}?`,
    `Which of the following is NOT true about ${topic}?`,
  ]
  const correctIdx = [0, 2, 1, 0, 3, 1, 0, 2, 1, 3]
  const questions: StructuredQuestion[] = []
  const answerKey: Record<string, string> = {}

  for (let i = 0; i < n; i++) {
    const outcomeHint = outcomes[i % Math.max(1, outcomes.length)] || topic
    const letters = ['A', 'B', 'C', 'D']
    const c = correctIdx[i % correctIdx.length]
    const options = [
      `A. A correct application of ${outcomeHint}`,
      `B. An unrelated idea not linked to ${topic}`,
      `C. A partial but incomplete explanation of ${topic}`,
      `D. A common misconception about ${topic}`,
    ]
    // Put the "correct" description on the right letter
    options[c] = `${letters[c]}. The best and most accurate description of ${outcomeHint}`
    const q: StructuredQuestion = {
      id: i + 1,
      type: 'multiple_choice',
      text: stems[i % stems.length],
      options,
      marks: 1,
      correctAnswer: letters[c],
      section: 'A',
    }
    questions.push(q)
    answerKey[String(i + 1)] = letters[c]
  }

  const explanation = `## Example / Explanation

**${topic}** (${opts.subject}, ${opts.grade})

Study this carefully before answering.

1. Read the definition of **${topic}** and connect it to something you see every day in Kenya (market, home, school, farm, or transport).
2. Work one short example step by step — write each step in plain language.
3. Check your understanding: Can you explain ${topic} to a classmate in two sentences?

${outcomes[0] ? `Curriculum focus: ${outcomes[0]}` : ''}
`

  // Student content WITHOUT answers
  const studentMd = buildWorksheetMarkdown({
    title: opts.title,
    subject: opts.subject,
    grade: opts.grade,
    topic,
    questions,
    includeExplanation: explanation.replace(/^## Example \/ Explanation\n\n/, ''),
  })

  // Teacher content WITH answer key (for storage if needed)
  const teacherMd = studentMd + '\n\n## Answer Key\n' + Object.entries(answerKey).map(([k, v]) => `${k}. ${v}`).join('\n')

  return { content: teacherMd, answerKey, questions }
}

/** Deterministic exam fallback with Sec A/B structure. */
export function buildFallbackExam(opts: {
  title: string
  subject: string
  grade: string
  topic: string
  numberOfQuestions?: number
  totalMarks?: number
  duration?: number
  outcomes?: string[]
}): StructuredExamPayload {
  const totalQ = Math.max(5, Math.min(40, opts.numberOfQuestions || 20))
  const mcqCount = Math.max(4, Math.floor(totalQ * 0.6))
  const shortCount = Math.max(2, totalQ - mcqCount)
  const totalMarks = opts.totalMarks || 100
  const mcqMarks = Math.floor(totalMarks * 0.5 / mcqCount) || 1
  const shortMarks = Math.floor(totalMarks * 0.5 / shortCount) || 2

  const assignment = buildFallbackAssignment({
    title: opts.title,
    subject: opts.subject,
    grade: opts.grade,
    topic: opts.topic,
    numQuestions: mcqCount,
    outcomes: opts.outcomes,
  })

  const questions: StructuredQuestion[] = assignment.questions.map(q => ({
    ...q,
    marks: mcqMarks,
    section: 'A' as const,
  }))
  const answerKey: Record<string, string> = { ...assignment.answerKey }

  for (let i = 0; i < shortCount; i++) {
    const id = mcqCount + i + 1
    const outcome = opts.outcomes?.[i % Math.max(1, opts.outcomes?.length || 1)] || opts.topic
    questions.push({
      id,
      type: 'short_answer',
      text: `Explain ${outcome} in your own words. Give one Kenyan example.`,
      marks: shortMarks,
      correctAnswer: `A clear explanation of ${outcome} with a relevant local example.`,
      section: 'B',
    })
    answerKey[String(id)] = `Clear explanation of ${outcome} + local example`
  }

  const markdown = buildExamMarkdown({
    title: opts.title,
    subject: opts.subject,
    grade: opts.grade,
    topic: opts.topic,
    duration: opts.duration || 60,
    totalMarks,
    questions,
    includeAnswerKey: true,
    answerKey,
  })

  return { questions, answerKey, markdown, totalMarks, title: opts.title }
}

export function buildExamMarkdown(opts: {
  title: string
  subject: string
  grade: string
  topic: string
  duration: number
  totalMarks: number
  questions: StructuredQuestion[]
  includeAnswerKey?: boolean
  answerKey?: Record<string, string>
}): string {
  const secA = opts.questions.filter(q => q.section === 'A' || q.type === 'multiple_choice' || q.type === 'true_false')
  const secB = opts.questions.filter(q => q.section === 'B' || q.type === 'short_answer')
  const secC = opts.questions.filter(q => q.section === 'C' || q.type === 'essay')

  const lines: string[] = [
    `# ${opts.title}`,
    '',
    `**Subject:** ${opts.subject}  |  **Grade:** ${opts.grade}  |  **Topic:** ${opts.topic}`,
    `**Duration:** ${opts.duration} minutes  |  **Total Marks:** ${opts.totalMarks}`,
    '',
    '## Student Instructions',
    '1. Write your name, class and admission number on the answer sheet.',
    '2. Answer ALL questions.',
    '3. For multiple choice, choose the BEST answer (A, B, C or D).',
    '4. Show working for calculation questions where required.',
    '5. Manage your time carefully.',
    '',
  ]

  if (secA.length) {
    lines.push('## Section A: Multiple Choice', '')
    secA.forEach((q, i) => {
      lines.push(`**${i + 1}.** ${q.text}  _(${q.marks} mk)_`)
      ;(q.options || []).forEach(o => lines.push(o))
      lines.push('')
    })
  }
  if (secB.length) {
    lines.push('## Section B: Short Answer', '')
    secB.forEach((q, i) => {
      lines.push(`**${secA.length + i + 1}.** ${q.text}  _(${q.marks} mk)_`)
      lines.push('_______________________________________________')
      lines.push('')
    })
  }
  if (secC.length) {
    lines.push('## Section C: Extended Response', '')
    secC.forEach((q, i) => {
      lines.push(`**${secA.length + secB.length + i + 1}.** ${q.text}  _(${q.marks} mk)_`)
      lines.push('')
    })
  }

  if (opts.includeAnswerKey && opts.answerKey) {
    lines.push('## Answer Key (Teacher Only)', '')
    Object.entries(opts.answerKey).forEach(([k, v]) => lines.push(`${k}. ${v}`))
  }

  return lines.join('\n')
}

/** Try parse dual-write structured exam JSON from AI content string. */
export function tryParseStructuredExam(raw: string): StructuredExamPayload | null {
  try {
    let cleaned = raw.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim()
    const start = cleaned.indexOf('{')
    const end = cleaned.lastIndexOf('}')
    if (start === -1 || end <= start) return null
    const obj = JSON.parse(cleaned.slice(start, end + 1))
    if (!obj.questions || !Array.isArray(obj.questions) || obj.questions.length === 0) return null

    const questions: StructuredQuestion[] = obj.questions.map((q: any, i: number) => ({
      id: q.id ?? i + 1,
      type: q.type || 'multiple_choice',
      text: q.text || q.question || `Question ${i + 1}`,
      options: Array.isArray(q.options) ? q.options : undefined,
      marks: typeof q.marks === 'number' ? q.marks : 1,
      correctAnswer: q.correctAnswer || q.answer,
      section: q.section || (q.type === 'essay' ? 'C' : q.type === 'short_answer' ? 'B' : 'A'),
      bloomLevel: q.bloomLevel,
    }))

    const answerKey: Record<string, string> = {}
    if (obj.answerKey && typeof obj.answerKey === 'object') {
      Object.entries(obj.answerKey).forEach(([k, v]) => { answerKey[k] = String(v) })
    }
    questions.forEach(q => {
      if (q.correctAnswer && !answerKey[String(q.id)]) {
        answerKey[String(q.id)] = String(q.correctAnswer)
      }
    })

    const totalMarks = obj.totalMarks || questions.reduce((s, q) => s + q.marks, 0)
    const markdown = obj.markdown || buildExamMarkdown({
      title: obj.title || 'Exam',
      subject: obj.subject || '',
      grade: obj.grade || '',
      topic: obj.topic || '',
      duration: obj.duration || 60,
      totalMarks,
      questions,
      includeAnswerKey: true,
      answerKey,
    })

    return { questions, answerKey, markdown, totalMarks, title: obj.title }
  } catch {
    return null
  }
}

/** Dual-write payload as JSON string (still a string under content/examContent). */
export function toDualWriteContent(payload: StructuredExamPayload): string {
  return JSON.stringify({
    questions: payload.questions.map(q => ({
      id: q.id,
      type: q.type,
      text: q.text,
      options: q.options,
      marks: q.marks,
      section: q.section,
      // correctAnswer kept only in answerKey for safety in dual-write
    })),
    answerKey: payload.answerKey,
    markdown: stripAnswerKeysFromContent(payload.markdown),
    totalMarks: payload.totalMarks,
    title: payload.title,
  })
}
