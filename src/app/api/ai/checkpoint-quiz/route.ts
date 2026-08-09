import { NextResponse } from 'next/server'
import { OpenAIService } from '@/lib/openai-service'
import { route } from '@/lib/api-middleware'
import { cleanAiJson } from '@/lib/ai-generation-utils'

export const POST = route({ skipSubscriptionCheck: true }, async (request, { user }) => {
    const { lessonTitle, subject, grade, learningOutcomes, content, topic, subStrand } = await request.json()
    if (!subject || !grade) return NextResponse.json({ error: 'subject and grade required' }, { status: 400 })

    const prompt = `Generate 10 multiple-choice checkpoint quiz questions for end of lesson.

Lesson: ${lessonTitle || topic || subject}
Subject: ${subject} | Grade: ${grade}
Topic: ${subStrand || topic || lessonTitle || subject}
Learning Outcomes: ${learningOutcomes || content?.slice(0, 300) || 'Key concepts'}

Return ONLY a JSON array of 10 objects:
[
  {
    "question": "Short, clear question",
    "type": "multiple_choice",
    "options": ["A. Option A", "B. Option B", "C. Option C", "D. Option D"],
    "correct": 0,
    "explanation": "Why this is correct (1 sentence)",
    "points": 2
  }
]

ALL questions must be type "multiple_choice" with exactly 4 options (A-D) and a correct index (0-3). No true/false or short_answer. Easy for auto-grading.`

    const raw = await OpenAIService.generateText([
      { role: 'system', content: 'You are a quiz creator. Return ONLY valid JSON array. No LaTeX, no TeX commands.' },
      { role: 'user', content: prompt },
    ], { maxTokens: 2000, temperature: 0.6 })

    const json = cleanAiJson(raw)
    if (!json) return NextResponse.json({ error: 'AI returned invalid format' }, { status: 500 })

    let questions: any[]
    try {
      questions = JSON.parse(json)
    } catch {
      return NextResponse.json({ error: 'Failed to parse quiz. Please try again.' }, { status: 500 })
    }

    const { stripLatex } = await import('@/lib/clean-ai-text')
    for (const q of questions) {
      for (const key of Object.keys(q)) {
        if (typeof q[key] === 'string') q[key] = stripLatex(q[key])
      }
    }
    return NextResponse.json({ questions, lessonTitle, totalPoints: questions.reduce((s: number, q: any) => s + (q.points || 2), 0) })
})
