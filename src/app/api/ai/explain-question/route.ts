/**
 * POST /api/ai/explain-question
 * AI Explain Question â€” step-by-step explanation for any exam question
 */
import { NextResponse } from 'next/server'
import { OpenAIService } from '@/lib/openai-service'
import { route } from '@/lib/api-middleware'
import { cleanAiJson } from '@/lib/ai-generation-utils'

export const POST = route({}, async (request, { user }) => {
    const { question, subject, grade, selectedAnswer, correctAnswer, context } = await request.json()
    if (!question) return NextResponse.json({ error: 'question required' }, { status: 400 })

    const isWrong = selectedAnswer !== undefined && correctAnswer !== undefined && selectedAnswer !== correctAnswer

    const prompt = `You are a patient, encouraging Kenyan ${subject || 'subject'} teacher helping a ${grade || 'secondary school'} student.

The student ${isWrong ? `answered INCORRECTLY. They chose "${selectedAnswer}" but the correct answer is "${correctAnswer}".` : 'wants to understand this question better.'}

QUESTION:
"${question}"
${context ? `\nContext: ${context}` : ''}

Provide a clear, step-by-step explanation in this JSON format:
{
  "summary": "One sentence â€” what concept this tests",
  "correctAnswer": "${correctAnswer || 'See steps'}",
  "steps": [
    { "step": 1, "title": "Step title", "explanation": "Clear explanation using Kenyan examples" },
    { "step": 2, "title": "Step title", "explanation": "..." }
  ],
  "whyWrong": ${isWrong ? '"Explain why the selected answer is wrong (gentle, encouraging)"' : 'null'},
  "keyFact": "The most important thing to remember about this topic",
  "tip": "Memory tip or shortcut for remembering",
  "relatedTopics": ["topic 1", "topic 2"]
}

Rules:
- Use simple language appropriate for ${grade || 'the grade level'}
- Be encouraging, never discouraging
- Use Kenyan context (shillings, local places, familiar examples)
- Steps should be logical and build on each other`

    const raw = await OpenAIService.generateText([
      { role: 'system', content: 'You are a CBC teacher. Return ONLY valid JSON.' },
      { role: 'user', content: prompt },
    ], { maxTokens: 800, temperature: 0.5 })

    const json = cleanAiJson(raw)
    if (!json) return NextResponse.json({ error: 'AI returned invalid format' }, { status: 500 })

    return NextResponse.json(JSON.parse(json))
})
