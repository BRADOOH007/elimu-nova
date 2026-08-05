import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { route } from '@/lib/api-middleware'
import { OpenAIService } from '@/lib/openai-service'

// ── Gibberish detection ─────────────────────────────────────────
// A submission must contain at least readable words. If it looks like
// random letters, keyboard mashing, or repetition, it scores 0.

const VOWELS = /[aeiouy]/i
const LONG_CONSONANT_RUN = /[bcdfghjklmnpqrstvwxyz]{5,}/i
const REPEATED_CHAR = /([a-z])\1{4,}/i

function isReadableWord(token: string): boolean {
  if (token.length === 1) return true // "a", "I"
  if (token.length > 24) return false
  if (REPEATED_CHAR.test(token)) return false // "aaaaa", "ggggg"
  if (!VOWELS.test(token)) return false // "gfhjkl", "hjkd"
  if (LONG_CONSONANT_RUN.test(token)) return false // "sfdgdh", "asdfghjkl"
  return true
}

function detectGibberish(content: string): { isGibberish: boolean; readableWords: number; totalWords: number } {
  const tokens = content.toLowerCase().split(/[^a-z]+/).filter(Boolean)
  const letterTokens = tokens.filter(t => /[a-z]/.test(t))
  const totalWords = letterTokens.length

  if (totalWords === 0) {
    return { isGibberish: true, readableWords: 0, totalWords }
  }

  let readableWords = 0
  for (const t of letterTokens) {
    if (isReadableWord(t)) readableWords++
  }

  const readableRatio = readableWords / totalWords
  // At least half the words must be recognisable as words
  return { isGibberish: readableRatio < 0.5, readableWords, totalWords }
}

const GIBBERISH_FEEDBACK = {
  overall: 'This submission could not be scored because it is not written in readable words. Please rewrite your answer using real, recognisable words so it can be graded.',
  score: 0,
  grammar: { score: 0, issues: ['No readable sentences were found.'], suggestions: ['Write complete sentences using real words.', 'Re-read your writing before submitting.'] },
  structure: { score: 0, issues: ['The writing has no recognisable structure.'], suggestions: ['Start with an introduction, then body paragraphs, then a conclusion.'] },
  content: { score: 0, strengths: [], improvements: ['Write about the topic using clear, real words.', 'Make sure your sentences can be read and understood.'] },
  vocabulary: { score: 0, good_words: [], better_alternatives: {} },
  tips: ['Use a spell-check or dictionary before submitting.', 'Type slowly and check your keyboard layout.', 'If you are unsure of the topic, ask your teacher first.'],
  gibberish: true,
}

// GET — fetch writing submissions
export const GET = route({ auth: 'STUDENT' }, async (request, { user }) => {
  const { searchParams } = new URL(request.url)
  const subject = searchParams.get('subject')

  const student = await prisma.student.findUnique({ where: { userId: user.id } })
  if (!student) return NextResponse.json({ error: 'Student not found' }, { status: 404 })

  const where: any = { studentId: student.id }
  if (subject) where.subject = subject

  const submissions = await prisma.writingSubmission.findMany({
    where,
    orderBy: { startedAt: 'desc' },
    take: 20,
  })

  return NextResponse.json({ submissions })
})

// POST — create or update a writing submission and get AI feedback
export const POST = route({ auth: 'STUDENT' }, async (request, { user }) => {
  const { id, subject, topic, title, content } = await request.json()

  if (!subject || !topic || !content) {
    return NextResponse.json({ error: 'subject, topic, and content required' }, { status: 400 })
  }

  const student = await prisma.student.findUnique({ where: { userId: user.id } })
  if (!student) return NextResponse.json({ error: 'Student not found' }, { status: 404 })

  const wordCount = content.split(/\s+/).filter(Boolean).length

  // Hard rule: unreadable / gibberish submissions score 0, no AI call needed
  const gibberish = detectGibberish(content)
  if (gibberish.isGibberish) {
    const feedback = GIBBERISH_FEEDBACK
    const submission = await prisma.writingSubmission.create({
      data: {
        studentId: student.id,
        subject,
        topic,
        title: title || '(untitled)',
        content,
        wordCount,
        feedback: feedback as any,
        score: 0,
        status: 'reviewed',
        completedAt: new Date(),
      },
    })
    return NextResponse.json({ submission, feedback, score: 0 })
  }

  // Get AI feedback on the writing
  const feedbackPrompt = `You are an expert Kenyan English writing coach. Analyse this student's writing and provide detailed, constructive feedback.

WRITING TOPIC: ${topic}
SUBJECT: ${subject}
TITLE: ${title || '(untitled)'}

STUDENT'S WRITING:
${content}

HARD RULE ON SCORING:
- If the writing is gibberish, unreadable, or nonsensical (random letter sequences, keyboard mashing, no recognisable real words), give the ENTIRE submission a score of 0 and say it could not be scored.
- A score of 0 is valid when the student has not written readable words — do not be generous with gibberish.

Provide feedback in this JSON format:
{
  "overall": "2-3 sentence overall assessment",
  "score": 75,
  "grammar": {
    "score": 80,
    "issues": ["specific grammar issue 1", "issue 2"],
    "suggestions": ["suggestion 1", "suggestion 2"]
  },
  "structure": {
    "score": 70,
    "issues": ["structural issue 1"],
    "suggestions": ["suggestion 1"]
  },
  "content": {
    "score": 75,
    "strengths": ["strength 1", "strength 2"],
    "improvements": ["improvement 1", "improvement 2"]
  },
  "vocabulary": {
    "score": 72,
    "good_words": ["well-used word 1"],
    "better_alternatives": { "simple_word": "better alternative" }
  },
  "tips": ["tip 1", "tip 2", "tip 3"]
}

Be encouraging but honest. Reference Kenyan English standards and CBC writing expectations.`

  let feedback = null
  let score = null

  try {
    const response = await OpenAIService.generateText(
      [
        { role: 'system', content: 'You are an expert writing coach. Always respond with valid JSON only.' },
        { role: 'user', content: feedbackPrompt },
      ],
      { maxTokens: 1500, temperature: 0.7 }
    )

    const jsonMatch = response.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      feedback = JSON.parse(jsonMatch[0])
      score = feedback?.score || null
    }
  } catch (error) {
    console.error('[WritingCoach] AI feedback error:', error)
  }

  // Upsert submission
  let submission
  if (id) {
    submission = await prisma.writingSubmission.update({
      where: { id },
      data: {
        content,
        wordCount,
        title,
        feedback,
        score,
        status: 'reviewed',
        revisionCount: { increment: 1 },
        completedAt: new Date(),
      },
    })
  } else {
    submission = await prisma.writingSubmission.create({
      data: {
        studentId: student.id,
        subject,
        topic,
        title,
        content,
        wordCount,
        feedback,
        score,
        status: 'reviewed',
        completedAt: new Date(),
      },
    })
  }

  return NextResponse.json({ submission, feedback, score })
})
