import { NextResponse } from 'next/server'
import { OpenAIService } from '@/lib/openai-service'
import { route } from '@/lib/api-middleware'

interface ActiveLesson {
  topic: string
  subject: string
  grade: string
  preview: { whatYoullLearn: string; concepts: string[] }
  content: string
  recall: { question: string; type: 'mcq' | 'short' | 'fill'; options?: string[]; answer: string; explanation: string }[]
  generatedAt: string
}

export const POST = route({}, async (req) => {
  const body = await req.json()
  const { subject, topic, grade } = body

  if (!subject || !topic) {
    return NextResponse.json({ error: 'Subject and topic are required' }, { status: 400 })
  }

  const gradeStr = grade || 'Grade 8'
  const requestId = Date.now().toString(36) + Math.random().toString(36).slice(2, 6)

  const prompt = `You are an expert tutor creating a STUDENT-FRIENDLY active recall lesson for a ${gradeStr} student studying ${subject}.

Topic: "${topic}"

Write in plain English. No LaTeX. No lesson plan format. No "key inquiry questions" or "learning outcomes" — this is for a student to study from, not a teacher's lesson plan. Keep it conversational but clear.

Return ONLY valid JSON with this exact structure:
{
  "preview": {
    "whatYoullLearn": "One sentence telling the student what they will understand after this lesson",
    "concepts": ["3 key concepts they will master, in simple words"]
  },
  "content": "The core lesson content in markdown. Structure it as:
## [First Concept Name]
2-3 short paragraphs explaining it clearly. Include a simple example with step-by-step working.
## [Second Concept Name]
Same format. Make it feel like a friendly tutor explaining.
## [Third Concept Name]
Same format. End with a 'Key Point' box that summarises the most important thing to remember.",
  "recall": [
    {
      "question": "A multiple choice question testing the FIRST concept",
      "type": "mcq",
      "options": ["Wrong but plausible option A", "Correct answer", "Wrong but plausible option C", "Wrong but plausible option D"],
      "answer": "Correct answer",
      "explanation": "Brief why the correct answer is right and why the wrong ones are tempting"
    },
    {
      "question": "A short-answer question testing the SECOND concept",
      "type": "short",
      "options": null,
      "answer": "Expected answer (short)",
      "explanation": "Brief explanation"
    },
    {
      "question": "A fill-in-the-blank or calculation question testing the THIRD concept",
      "type": "fill",
      "options": null,
      "answer": "The answer",
      "explanation": "Brief explanation"
    },
    {
      "question": "Another question testing understanding",
      "type": "mcq",
      "options": ["Option A", "Option B", "Correct option", "Option D"],
      "answer": "Correct option",
      "explanation": "Brief explanation"
    },
    {
      "question": "A final application question",
      "type": "short",
      "options": null,
      "answer": "Expected answer",
      "explanation": "Brief explanation"
    }
  ]
}

CRITICAL RULES:
- The content must be conversational and student-friendly — like a good tutor talking to them
- Never use "Key Inquiry Questions", "Learning Outcomes", "Specific Objectives" or any curriculum-planning terminology
- Never reference grade levels, exams (KCSE/KCPE), or "the syllabus" in the content — just teach the concept
- Use Kenyan examples where natural (KES currency, Kenyan names, local contexts)
- Make the recall questions genuinely test understanding, not just memorisation
- The total content should take about 3-4 minutes to read
- Request ID: ${requestId}`

  try {
    const raw = await OpenAIService.generateText([
      { role: 'system', content: 'You are an educational AI. Return ONLY valid JSON. No markdown backticks, no extra text.' },
      { role: 'user', content: prompt },
    ], { maxTokens: 2500, temperature: 0.7 })

    const start = raw.indexOf('{')
    const end = raw.lastIndexOf('}')
    if (start === -1 || end <= start) {
      throw new Error('AI returned invalid JSON format')
    }

    const lesson: ActiveLesson = JSON.parse(raw.slice(start, end + 1))
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
