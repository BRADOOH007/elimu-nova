import { NextResponse } from 'next/server'
import { OpenAIService } from '@/lib/openai-service'
import { route } from '@/lib/api-middleware'
import { cleanAiJson } from '@/lib/ai-generation-utils'

export const POST = route({}, async (request, { user }) => {
    const { lessonTitle, subject, grade, learningOutcomes, content, topic, subStrand } = await request.json()
    if (!subject || !grade) return NextResponse.json({ error: 'subject and grade required' }, { status: 400 })

    const prompt = `Generate 10 quick checkpoint quiz questions for end of lesson.

Lesson: ${lessonTitle || topic || subject}
Subject: ${subject} | Grade: ${grade}
Topic: ${subStrand || topic || lessonTitle || subject}
Learning Outcomes: ${learningOutcomes || content?.slice(0, 300) || 'Key concepts'}

Return ONLY a JSON array of 10 objects:
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

Keep language simple and appropriate for ${grade}.`

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
