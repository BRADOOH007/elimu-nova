/**
 * POST /api/ai/checkpoint-quiz
 * Lesson Checkpoint Quiz — 5 quick questions generated at end of lesson
 */
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { OpenAIService } from '@/lib/openai-service'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { lessonTitle, subject, grade, learningOutcomes, content } = await request.json()
    if (!subject || !grade) return NextResponse.json({ error: 'subject and grade required' }, { status: 400 })

    const prompt = `Generate 5 quick checkpoint quiz questions for end of lesson.

Lesson: ${lessonTitle || subject}
Subject: ${subject} | Grade: ${grade}
Learning Outcomes: ${learningOutcomes || content?.slice(0, 300) || 'Key concepts'}

Return ONLY a JSON array of 5 objects:
[
  {
    "question": "Short, clear question",
    "type": "multiple_choice",
    "options": ["A. option", "B. option", "C. option", "D. option"],
    "correct": 0,
    "explanation": "Why this is correct (1 sentence)",
    "points": 2
  }
]

Mix question types:
- Q1-3: multiple_choice (type="multiple_choice", options array, correct=0-3 index)
- Q4: true_false (type="true_false", options=["True","False"], correct=0 or 1)
- Q5: short_answer (type="short_answer", model_answer="expected answer")

Keep language simple and appropriate for ${grade}. Use Kenyan examples.`

    const raw = await OpenAIService.generateText([
      { role: 'system', content: 'You are a CBC quiz creator. Return ONLY valid JSON array.' },
      { role: 'user', content: prompt },
    ], { maxTokens: 1200, temperature: 0.6 })

    const start = raw.indexOf('['); const end = raw.lastIndexOf(']')
    if (start === -1 || end <= start) return NextResponse.json({ error: 'Invalid format' }, { status: 500 })

    const questions = JSON.parse(raw.slice(start, end + 1))
    return NextResponse.json({ questions, lessonTitle, totalPoints: questions.reduce((s: number, q: any) => s + (q.points || 2), 0) })
  } catch (e: any) {
    console.error('[CHECKPOINT_QUIZ]', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
