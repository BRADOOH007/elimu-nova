import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { route } from '@/lib/api-middleware'
import { OpenAIService } from '@/lib/openai-service'

const VOWELS = /[aeiouy]/i
const LONG_CONSONANT_RUN = /[bcdfghjklmnpqrstvwxyz]{5,}/i
const REPEATED_CHAR = /([a-z])\1{4,}/i

function isReadableWord(token: string): boolean {
  if (token.length === 1) return true
  if (token.length > 24) return false
  if (REPEATED_CHAR.test(token)) return false
  if (!VOWELS.test(token)) return false
  if (LONG_CONSONANT_RUN.test(token)) return false
  return true
}

function detectGibberish(content: string): { isGibberish: boolean } {
  const tokens = content.toLowerCase().split(/[^a-z]+/).filter(Boolean)
  const letterTokens = tokens.filter(t => /[a-z]/.test(t))
  if (letterTokens.length === 0) return { isGibberish: true }
  let readable = 0
  for (const t of letterTokens) if (isReadableWord(t)) readable++
  return { isGibberish: readable / letterTokens.length < 0.5 }
}

const GIBBERISH_FEEDBACK = {
  overall: 'This essay could not be scored because it is not written in readable words. Please rewrite it using real, recognisable words so it can be marked.',
  score: 0,
  grammar: { score: 0, issues: ['No readable sentences were found.'], suggestions: ['Write complete sentences using real words.'] },
  structure: { score: 0, issues: ['The essay has no recognisable structure.'], suggestions: ['Start with an introduction, then body paragraphs, then a conclusion.'] },
  content: { score: 0, strengths: [], improvements: ['Address the essay prompt using clear, real words.'] },
  vocabulary: { score: 0, good_words: [], better_alternatives: {} },
  tips: ['Use a spell-check or dictionary before submitting.', 'Re-read your essay before submitting.'],
  gibberish: true,
}

const ESSAY_TOPICS = [
  'The importance of education in achieving your life goals',
  'How technology has changed the way people communicate',
  'Describe a challenge you have overcome and what you learned from it',
  'Should adults return to learning? Give reasons for your opinion',
  'Explain the importance of protecting the environment',
  'Describe a person who has inspired you and why',
  'The role of hard work versus opportunity in success',
  'How has learning English opened new opportunities for you?',
  'What does "good citizenship" mean to you? Explain',
  'Life is a journey, not a destination. Discuss what this means to you',
]

// GET - list the senior's essays
export const GET = route({ auth: 'SENIOR_STUDENT' }, async (_req, { user }) => {
  let senior = await prisma.seniorStudent.findUnique({ where: { userId: user.id } })
  if (!senior) senior = await prisma.seniorStudent.create({ data: { userId: user.id } })

  const essays = await prisma.seniorWritingSubmission.findMany({
    where: { seniorStudentId: senior.id },
    orderBy: { startedAt: 'desc' },
  })

  return NextResponse.json({ essays, promptIdeas: ESSAY_TOPICS })
})

// POST - create/update a senior essay submission and get AI feedback
export const POST = route({ auth: 'SENIOR_STUDENT' }, async (request, { user }) => {
  const { id, subject, topic, title, content } = await request.json()

  if (!topic || !content) {
    return NextResponse.json({ error: 'topic and content required' }, { status: 400 })
  }

  let senior = await prisma.seniorStudent.findUnique({ where: { userId: user.id } })
  if (!senior) senior = await prisma.seniorStudent.create({ data: { userId: user.id } })

  const wordCount = content.split(/\s+/).filter(Boolean).length
  const subj = subject || 'Reasoning Through Language Arts'

  if (detectGibberish(content).isGibberish) {
    const submission = await prisma.seniorWritingSubmission.create({
      data: {
        seniorStudentId: senior.id,
        subject: subj,
        topic,
        title: title || '(untitled)',
        content,
        wordCount,
        feedback: GIBBERISH_FEEDBACK as any,
        score: 0,
        status: 'reviewed',
        completedAt: new Date(),
      },
    })
    return NextResponse.json({ submission, feedback: GIBBERISH_FEEDBACK, score: 0 })
  }

  const feedbackPrompt = `You are an expert adult-education writing coach for General Education Diploma (GED) learners and adult English-language learners. Analyse the student's essay and provide detailed, constructive feedback.

ESSAY TOPIC: ${topic}
SUBJECT AREA: ${subj}
TITLE: ${title || '(untitled)'}
WORD COUNT: ${wordCount}

STUDENT'S ESSAY:
${content}

GRADE THE ESSAY on a 0-100 scale. Consider:
- CONTENT: does the essay address the prompt, develop ideas, and stay on topic?
- STRUCTURE: is there a clear introduction, body, and conclusion?
- GRAMMAR & MECHANICS: sentence structure, punctuation, spelling.
- VOCABULARY: range and appropriateness of word choice.
- CLARITY: is the meaning clear to a general reader?

HARD RULE: If the writing is gibberish, unreadable, or nonsensical (random letters, keyboard mashing, no real words), score it 0 and say it could not be scored.

Respond with ONLY valid JSON in this exact format:
{
  "overall": "2-3 sentence overall assessment",
  "score": 75,
  "grammar": { "score": 80, "issues": ["issue 1", "issue 2"], "suggestions": ["suggestion 1"] },
  "structure": { "score": 70, "issues": ["structural issue"], "suggestions": ["suggestion"] },
  "content": { "score": 75, "strengths": ["strength 1"], "improvements": ["improvement 1"] },
  "vocabulary": { "score": 72, "good_words": ["word 1"], "better_alternatives": { "simple": "better" } },
  "tips": ["tip 1", "tip 2", "tip 3"]
}

Be encouraging but honest. Use clear, plain language an adult learner can understand.`

  let feedback: any = null
  let score: number | null = null

  try {
    const response = await OpenAIService.generateText(
      [
        { role: 'system', content: 'You are an expert adult-education writing coach. Always respond with valid JSON only.' },
        { role: 'user', content: feedbackPrompt },
      ],
      { maxTokens: 1500, temperature: 0.7 }
    )
    const jsonMatch = response.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      feedback = JSON.parse(jsonMatch[0])
      score = feedback?.score ?? null
    }
  } catch (error) {
    console.error('[SeniorEssays] AI feedback error:', error)
  }

  let submission
  if (id) {
    submission = await prisma.seniorWritingSubmission.update({
      where: { id },
      data: {
        content,
        wordCount,
        title,
        subject: subj,
        topic,
        feedback,
        score,
        status: feedback ? 'reviewed' : 'submitted',
        completedAt: new Date(),
      },
    })
  } else {
    submission = await prisma.seniorWritingSubmission.create({
      data: {
        seniorStudentId: senior.id,
        subject: subj,
        topic,
        title,
        content,
        wordCount,
        feedback,
        score,
        status: feedback ? 'reviewed' : 'submitted',
        completedAt: new Date(),
      },
    })
  }

  return NextResponse.json({ submission, feedback, score })
})
