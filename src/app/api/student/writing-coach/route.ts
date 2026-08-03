import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { route } from '@/lib/api-middleware'
import { OpenAIService } from '@/lib/openai-service'

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

  // Get AI feedback on the writing
  const feedbackPrompt = `You are an expert Kenyan English writing coach. Analyse this student's writing and provide detailed, constructive feedback.

WRITING TOPIC: ${topic}
SUBJECT: ${subject}
TITLE: ${title || '(untitled)'}

STUDENT'S WRITING:
${content}

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
