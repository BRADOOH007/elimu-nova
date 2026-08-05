import { NextResponse } from 'next/server'
import { OpenAIService } from '@/lib/openai-service'
import { route } from '@/lib/api-middleware'

interface ActiveLesson {
  topic: string
  subject: string
  grade: string
  preview: { whatYoullLearn: string; concepts: string[] }
  content: string
  recall: { question: string; type: string; options?: string[]; answer: string; explanation: string }[]
  generatedAt: string
}

function cleanJson(raw: string): string {
  let cleaned = raw.trim()
  if (cleaned.startsWith('```json')) cleaned = cleaned.slice(7)
  if (cleaned.startsWith('```')) cleaned = cleaned.slice(3)
  if (cleaned.endsWith('```')) cleaned = cleaned.slice(0, -3)
  const start = cleaned.indexOf('{')
  const end = cleaned.lastIndexOf('}')
  if (start === -1 || end <= start) return ''
  cleaned = cleaned.slice(start, end + 1)
  return cleaned
}

export const POST = route({}, async (req) => {
  const body = await req.json()
  const { subject, topic, grade } = body

  if (!subject || !topic) {
    return NextResponse.json({ error: 'Subject and topic are required' }, { status: 400 })
  }

  const gradeStr = grade || 'Grade 8'
  const requestId = Date.now().toString(36) + Math.random().toString(36).slice(2, 6)

  const prompt = `Create a study lesson for a ${gradeStr} student learning ${subject} about "${topic}".

You MUST return valid JSON. Escape all double quotes inside strings with backslash.
Use Kenyan examples where natural.

{
  "preview": {
    "whatYoullLearn": "In one short sentence, what the student will understand after this lesson",
    "concepts": ["First concept", "Second concept", "Third concept"]
  },
  "content": "Write as plain text with ## headings for each concept. 2-3 short paragraphs per concept. Include a worked example with step-by-step working. Keep it conversational and friendly. Max 500 words total. Do NOT use any special characters that break JSON.",
  "recall": [
    {
      "question": "MCQ about the first concept",
      "type": "mcq",
      "options": ["Wrong A", "Correct answer", "Wrong C", "Wrong D"],
      "answer": "Correct answer",
      "explanation": "Why the correct answer is right"
    },
    {
      "question": "Short-answer about the second concept",
      "type": "short",
      "answer": "Expected answer",
      "explanation": "Brief explanation"
    },
    {
      "question": "Calculation or fill-blank about the third concept",
      "type": "fill",
      "answer": "The answer",
      "explanation": "Brief explanation"
    },
    {
      "question": "Another MCQ",
      "type": "mcq",
      "options": ["Wrong", "Wrong", "Correct", "Wrong"],
      "answer": "Correct",
      "explanation": "Brief explanation"
    },
    {
      "question": "Final application question",
      "type": "short",
      "answer": "Expected answer",
      "explanation": "Brief explanation"
    }
  ]
}

RULES:
- Only return the JSON object. No markdown. No explanation. No backticks.
- Escape all double quotes inside text fields with backslash
- The content field must be valid JSON string (escape newlines as \\n, double quotes as \\\")
- Make questions test real understanding, not memorization
- Request: ${requestId}`

  try {
    const raw = await OpenAIService.generateText([
      {
        role: 'system',
        content: 'You are an AI that returns ONLY valid, parseable JSON. Never wrap in backticks. Escape all double quotes inside strings. Your entire output must be a single JSON object.',
      },
      { role: 'user', content: prompt },
    ], { maxTokens: 4000, temperature: 0.3 })

    const json = cleanJson(raw)
    if (!json) {
      console.error('[ActiveLesson] Could not extract JSON from:', raw.slice(0, 200))
      throw new Error('AI returned invalid JSON format')
    }

    const lesson: ActiveLesson = JSON.parse(json)
    lesson.topic = topic
    lesson.subject = subject
    lesson.grade = gradeStr
    lesson.generatedAt = new Date().toISOString()

    return NextResponse.json(lesson)

  } catch (error: any) {
    console.error('[ActiveLesson] Generation failed:', error)
    return NextResponse.json(
      { error: 'Failed to generate lesson. Please try again.' },
      { status: 500 }
    )
  }
})
