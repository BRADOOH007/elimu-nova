import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { route } from '@/lib/api-middleware'
import { OpenAIService } from '@/lib/openai-service'
import { cleanAiJson } from '@/lib/ai-generation-utils'

export const dynamic = 'force-dynamic'

// POST /api/ai/generate-quiz — formative assessment from a curriculum topic/substrand
// { grade, subject, topic, strand, curriculum, country, count }
export const POST = route({ auth: ['STUDENT', 'TEACHER', 'SCHOOL_ADMIN', 'SUPER_ADMIN'] }, async (request) => {
  try {
    const { grade, subject, topic, strand, curriculum, country, count = 5 } = await request.json()
    if (!subject || !topic) {
      return NextResponse.json({ error: 'subject and topic are required' }, { status: 400 })
    }

    const prompt = `You are an expert ${curriculum && curriculum !== 'cbc' ? 'US Common Core / standards-aligned' : 'curriculum-aligned'} assessment writer. Create a short formative quiz for a ${grade || 'student'} studying:

Subject: ${subject}
${strand ? `Strand: ${strand}` : ''}
Topic: ${topic}
${curriculum ? `Curriculum: ${curriculum}` : ''}
${country ? `Country: ${country}` : ''}

Return ONLY valid JSON (no markdown):
{
  "questions": [
    { "question": "string", "options": ["A","B","C","D"], "answer": 0, "explanation": "string" }
  ]
}
Provide exactly ${count} multiple-choice questions that progressively assess understanding. "answer" is the 0-based index of the correct option.`

    let questions: any[] = []
    for (let attempt = 0; attempt < 3 && questions.length === 0; attempt++) {
      try {
        const raw = await OpenAIService.generateText(
          [{ role: 'user', content: prompt }],
          { maxTokens: 1500, temperature: 0.5, responseFormat: 'json_object' },
        )
        const json = cleanAiJson(raw)
        if (json) questions = JSON.parse(json).questions || []
      } catch (e) {
        console.warn(`[AI] generate-quiz attempt ${attempt + 1} failed:`, (e as Error).message)
      }
    }

    return NextResponse.json({ subject, topic, questions })
  } catch (e) {
    console.error('[AI] generate-quiz failed:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
})
