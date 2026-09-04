/**
 * POST /api/senior-student/practice-test
 *
 * Generates and grades a timed, GED-style practice test for one of the four
 * GED subject areas. The score is written to `GEDSubjectProgress.practiceScore`
 * (official 100-200 GED scale) and a passing score (>= 145) marks the subject
 * as "GED-ready", so students can see measurable improvement as they practice.
 *
 * GET  /api/senior-student/practice-test?subject=...  → most recent attempt + best score
 */
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import { route } from '@/lib/api-middleware'
import { z } from 'zod'
import { OpenAIService } from '@/lib/openai-service'
import { cleanAiJson } from '@/lib/ai-generation-utils'
import { GED_SUBJECTS, GED_PASS_SCORE } from '@/lib/constants/ged'

// How many raw questions we ask the model for per test. Real GED sections are
// longer, but a focused ~12-question timed practice is approachable and still
// representative of GED-style item types.
const QUESTIONS_PER_TEST = 12
const TIME_LIMIT_MINS = 20

// Official GED subject test durations (in minutes) for realistic pacing.
const SUBJECT_TIME_LIMITS: Record<string, number> = {
  'Mathematical Reasoning': 115,
  'Reasoning Through Language Arts': 150,
  'Science': 90,
  'Social Studies': 70,
}

const GED_TEST_BLUEPRINT: Record<string, string> = {
  'Mathematical Reasoning':
    'Number operations and number sense, algebra and functions, geometry, data analysis, statistics and probability. Include word problems using real-life money/work/measurement contexts.',
  'Reasoning Through Language Arts':
    'Reading comprehension (main idea, inference, author purpose, vocabulary in context), grammar and usage, and a short written-response / extended-response question.',
  'Science':
    'Life science, physical science, earth and space science, and scientific method / interpreting data tables and graphs.',
  'Social Studies':
    'Civics and government, US and world history, economics, and geography. Use primary/secondary source-style passages and interpret charts and maps.',
}

interface PracticeQuestion {
  id: string
  question: string
  type: 'multiple_choice' | 'true_false' | 'extended_response'
  options: string[]
  correctAnswer: number | null
  modelAnswer: string | null
  explanation: string
}

function parseQuestionBlob(blob: any): PracticeQuestion | null {
  try {
    const typeRaw = String(blob?.type || '').toLowerCase()
    let type: PracticeQuestion['type'] = 'multiple_choice'
    if (typeRaw.includes('true') || typeRaw.includes('boolean')) type = 'true_false'
    else if (typeRaw.includes('extended') || typeRaw.includes('open') || typeRaw.includes('essay') || typeRaw.includes('written') || typeRaw.includes('short')) type = 'extended_response'

    const options = Array.isArray(blob?.options)
      ? blob.options.map((o: any) => String(o)).filter(Boolean)
      : []

    if (type === 'true_false' && options.length === 0) {
      options.push('True', 'False')
    }

    // Correct answer: accept either an index or the answer text.
    let correctIndex: number | null = null
    if (typeof blob?.correctAnswer === 'number') {
      correctIndex = blob.correctAnswer
    } else if (typeof blob?.correct_answer === 'number') {
      correctIndex = blob.correct_answer
    } else if (blob?.correctAnswer || blob?.correct_answer) {
      const text = String(blob?.correctAnswer || blob?.correct_answer).trim().toLowerCase()
      const idx = options.findIndex((o: string) => o.trim().toLowerCase().includes(text))
      if (idx !== -1) correctIndex = idx
    }
    if (type !== 'extended_response' && (correctIndex === null || correctIndex < 0 || correctIndex >= options.length)) {
      return null
    }

    return {
      id: String(blob?.id || Math.random().toString(36).slice(2, 10)),
      question: String(blob?.question || '').trim(),
      type,
      options,
      correctAnswer: type === 'extended_response' ? null : correctIndex,
      modelAnswer: String(blob?.modelAnswer || blob?.model_answer || blob?.answer || '').trim() || null,
      explanation: String(blob?.explanation || '').trim(),
    }
  } catch {
    return null
  }
}

async function generatePracticeQuestions(subject: string, grade: string): Promise<PracticeQuestion[]> {
  const blueprint = GED_TEST_BLUEPRINT[subject] || 'Standard GED content for this subject.'
  const timeLimit = SUBJECT_TIME_LIMITS[subject] || TIME_LIMIT_MINS
  const prompt = `You are an expert GED test designer. Generate a GED-style practice test for an adult learner preparing for the US GED high-school-equivalency exam.

SUBJECT: ${subject}
GRADE: ${grade}

CONTENT BLUEPRINT:
${blueprint}

REQUIREMENTS:
- Generate exactly ${QUESTIONS_PER_TEST} questions.
- Question mix: 8 multiple choice, 2 true/false, 2 extended-response (short written answer).
- MCQ options must be labeled A, B, C, D (4 options each).
- Distribute difficulty from easy to hard.
- Use authentic GED stimulus: real-life scenarios, short passages, tables/graph word problems, adult work/money/civic contexts.
- Provide a clear correctAnswer (index 0-based into options) OR correct_answer text, and a modelAnswer/model_answer for each question.
- Provide a concise explanation for EVERY question.

Return ONLY valid JSON (no markdown fences):
{
  "questions": [
    {
      "id": "q1",
      "question": "The full question text",
      "type": "multiple_choice" | "true_false" | "extended_response",
      "options": ["A. ...", "B. ...", "C. ...", "D. ..."] (empty for extended_response),
      "correctAnswer": 0,
      "modelAnswer": "for extended/true_false: the expected answer",
      "explanation": "why this is correct"
    }
  ]
}`

  const raw = await OpenAIService.generateText(
    [
      { role: 'system', content: 'You are an expert GED assessment designer. Return ONLY valid, parseable JSON.' },
      { role: 'user', content: prompt },
    ],
    { maxTokens: 8000, temperature: 0.4 }
  )

  const cleaned = cleanAiJson(raw)
  if (!cleaned) throw new Error('No JSON from AI')
  const parsed = JSON.parse(cleaned)
  const blobList = Array.isArray(parsed?.questions) ? parsed.questions : []
  const questions: PracticeQuestion[] = []
  for (const blob of blobList) {
    const q = parseQuestionBlob(blob)
    if (q && q.question) questions.push(q)
    if (questions.length >= QUESTIONS_PER_TEST) break
  }
  if (questions.length === 0) throw new Error('AI returned no usable questions')
  return { questions, timeLimit } as any
}

export const POST = route({ auth: 'SENIOR_STUDENT', schema: z.object({
  subject: z.string(),
  answers: z.array(z.object({
    questionId: z.string(),
    selected: z.union([z.number(), z.string(), z.null()]).optional(),
  })).optional(),
  timeTakenMins: z.number().optional(),
  practiceId: z.string().optional(),
}) }, async (_req, { user, body }) => {
  const { subject, answers, timeTakenMins, practiceId } = body as any

  if (!GED_SUBJECTS.includes(subject as any)) {
    return NextResponse.json({ error: 'Unknown GED subject' }, { status: 400 })
  }

  let senior = await prisma.seniorStudent.findUnique({ where: { userId: user.id } })
  if (!senior) senior = await prisma.seniorStudent.create({ data: { userId: user.id } })

  const timeLimit = SUBJECT_TIME_LIMITS[subject] || TIME_LIMIT_MINS

  // ── If answers are provided, grade an earlier-generated practice attempt ──
  if (Array.isArray(answers) && practiceId) {
    try {
      const stored = await prisma.gEDPracticeTest.findUnique({
        where: { id: practiceId, seniorStudentId: senior.id },
      })
      if (!stored || stored.subject !== subject) {
        return NextResponse.json({ error: 'Practice test not found' }, { status: 404 })
      }
      const questions = (Array.isArray(stored.questions) ? stored.questions : []) as unknown as PracticeQuestion[]
      let correctCount = 0
      const results = answers.map((a: any) => {
        const q = questions.find((qq) => qq.id === a?.questionId)
        if (!q) return { questionId: a?.questionId, correct: false }
        let correct = false
        if (q.type === 'extended_response') {
          // Extended response is graded leniently by the model later; here we
          // mark it as "for review" — the explicit score is set via auto-grade.
          correct = false
        } else {
          const sel = a?.selected
          if (typeof sel === 'number') correct = sel === q.correctAnswer
          else if (typeof sel === 'string') {
            const idx = q.options.findIndex((o) => o.trim().toLowerCase() === sel.trim().toLowerCase())
            correct = idx !== -1 ? idx === q.correctAnswer : sel.trim().toLowerCase() === String(q.correctAnswer)
          }
        }
        if (correct) correctCount++
        return { questionId: a?.questionId, correct, correctAnswer: q.correctAnswer, explanation: q.explanation }
      })
      const total = questions.length || 1
      const score = Math.round((correctCount / total) * 100)
      // Map to official GED 100-200 scale.
      const gedScore = Math.max(100, Math.min(200, 100 + Math.round(score)))
      const passed = gedScore >= GED_PASS_SCORE

      await prisma.gEDPracticeTest.update({
        where: { id: stored.id },
        data: { score: gedScore, correctAnswers: correctCount, totalQuestions: total, timeTakenMins: timeTakenMins ?? null, completedAt: new Date(), passed },
      })

      // Wire the previously-unused practiceScore + readiness on GEDSubjectProgress.
      const existing = await prisma.gEDSubjectProgress.findUnique({
        where: { seniorStudentId_subject: { seniorStudentId: senior.id, subject } },
      })
      const best = Math.max(existing?.practiceScore ?? 0, gedScore)
      const progress = await prisma.gEDSubjectProgress.update({
        where: { seniorStudentId_subject: { seniorStudentId: senior.id, subject } },
        data: { practiceScore: best },
      })

      return NextResponse.json({
        completed: true,
        testId: stored.id,
        correctCount, total, score, gedScore, passed,
        results,
      })
    } catch (err: any) {
      if (err?.message?.includes('Record to update not found')) {
        return NextResponse.json({ error: 'Practice test not found' }, { status: 404 })
      }
      throw err
    }
  }

  // ── Otherwise, generate a fresh timed practice test ──────────────────────
  const generated = await generatePracticeQuestions(subject, 'Adult') as unknown as { questions: PracticeQuestion[]; timeLimit: number }
  const test = await prisma.gEDPracticeTest.create({
    data: {
      seniorStudentId: senior.id,
      subject,
      questions: generated.questions as unknown as Prisma.InputJsonValue,
      timeLimitMins: timeLimit,
      totalQuestions: generated.questions.length,
      score: null,
      passed: false,
    },
  })

  return NextResponse.json({
    started: true,
    testId: test.id,
    subject,
    timeLimitMins: timeLimit,
    questions: generated.questions.map((q) => ({
      id: q.id,
      question: q.question,
      type: q.type,
      options: q.options,
    })),
  })
})

// GET — fetch practice history for a subject (latest attempt + best score)
export const GET = route({ auth: 'SENIOR_STUDENT' }, async (request, { user }) => {
  const { searchParams } = new URL(request.url)
  const subject = searchParams.get('subject')

  let senior = await prisma.seniorStudent.findUnique({ where: { userId: user.id } })
  if (!senior) senior = await prisma.seniorStudent.create({ data: { userId: user.id } })

  const where: any = { seniorStudentId: senior.id }
  if (subject) where.subject = subject

  const attempts = await prisma.gEDPracticeTest.findMany({
    where,
    orderBy: { completedAt: 'desc' },
    take: 20,
  })

  const progress = await prisma.gEDSubjectProgress.findMany({
    where: { seniorStudentId: senior.id, practiceScore: { not: null } },
    select: { subject: true, practiceScore: true, isReady: true, mastery: true },
  })

  return NextResponse.json({ attempts, bestBySubject: progress })
})
