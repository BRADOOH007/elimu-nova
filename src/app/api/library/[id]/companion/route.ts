import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { route } from '@/lib/api-middleware'
import { OpenAIService } from '@/lib/openai-service'
import { cleanAiJson } from '@/lib/ai-generation-utils'

export const dynamic = 'force-dynamic'

export const POST = route({ auth: ['STUDENT', 'SENIOR_STUDENT', 'TEACHER', 'SCHOOL_ADMIN', 'SUPER_ADMIN'] }, async (request, { params }) => {
  try {
    const { id } = params
    const book = await prisma.book.findUnique({ where: { id } })
    if (!book || !book.isPublished) {
      return NextResponse.json({ error: 'Book not found' }, { status: 404 })
    }

    const { mode = 'quiz', question } = await request.json()
    const content = book.content || ''

    if (mode === 'quiz') {
      const passage = content.slice(0, 6000)
      const prompt = `You are a reading comprehension tutor. Based on the following book text, generate a short comprehension quiz.

BOOK: "${book.title}"
TEXT:
${passage}

Return ONLY valid JSON (no markdown):
{
  "questions": [
    { "question": "string", "options": ["A","B","C","D"], "answer": 0, "explanation": "string" }
  ]
}
Provide exactly 5 multiple-choice questions that test understanding, inference, and vocabulary. Use 1-based index for "answer".`

      const raw = await OpenAIService.generateText(
        [{ role: 'user', content: prompt }],
        { maxTokens: 1200, temperature: 0.5, responseFormat: 'json_object' },
      )
      const json = cleanAiJson(raw)
      const result = json ? JSON.parse(json) : { questions: [] }
      return NextResponse.json({ mode: 'quiz', ...result })
    }

    // discuss / explain — free-form with Hope
    const prompt = `You are Hope, a warm reading companion. The student is reading "${book.title}". ${
      question ? `They asked: "${question}".` : 'Help them engage with the story: summarize, highlight a key idea, and ask a thought-provoking question.'
    }

BOOK TEXT (for reference):
${content.slice(0, 4000)}

Respond conversationally and encouragingly, in 2-4 short paragraphs.`

    const raw = await OpenAIService.generateText(
      [{ role: 'user', content: prompt }],
      { maxTokens: 600, temperature: 0.7 },
    )
    return NextResponse.json({ mode: 'discuss', response: raw })
  } catch (e) {
    console.error('[Library] companion failed:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
})
