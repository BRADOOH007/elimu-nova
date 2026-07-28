import { NextResponse } from 'next/server'
import { OpenAIService } from '@/lib/openai-service'
import { route } from '@/lib/api-middleware'

export const POST = route({ auth: ['STUDENT', 'TEACHER', 'SUPER_ADMIN'] }, async (request, { user }) => {

    const { lessonPlan, assessmentType, questionCount } = await request.json()
    if (!lessonPlan) {
      return NextResponse.json({ error: 'Lesson plan is required' }, { status: 400 })
    }

    const isKiswahili = lessonPlan.subject?.toLowerCase() === 'kiswahili'

    const systemPrompt = `You are an AI assessment generator for ElimuNova AI (Kenya CBC curriculum).
${isKiswahili ? 'IMPORTANT: Generate this assessment entirely in Swahili.' : 'IMPORTANT: Generate this assessment entirely in English.'}
Return ONLY valid JSON — no markdown, no explanation.
JSON format: { "title": "...", "description": "...", "questions": [{ "id": 1, "type": "multiple_choice", "question": "...", "options": ["A","B","C","D"], "correctAnswer": "A", "explanation": "...", "difficulty": "easy" }], "instructions": "...", "timeLimit": "30 minutes" }`

    const userPrompt = `Generate a ${assessmentType || 'mixed'} assessment (${questionCount || 10} questions) for:
Title: ${lessonPlan.title}
Subject: ${lessonPlan.subject}
Grade: ${lessonPlan.grade}
Content: ${(lessonPlan.content?.generatedContent || lessonPlan.content || '').toString().slice(0, 1500)}`

    const raw = await OpenAIService.generateLongContent([
      { role: 'system', content: systemPrompt },
      { role: 'user',   content: userPrompt   },
    ], { maxTokens: 2000, temperature: 0.6 })

    let assessmentData: any
    try {
      const start = raw.indexOf('{'); const end = raw.lastIndexOf('}')
      if (start !== -1 && end > start) assessmentData = JSON.parse(raw.slice(start, end + 1))
      else throw new Error('No JSON found')
    } catch {
      assessmentData = {
        title:        `Assessment for ${lessonPlan.title}`,
        description:  'AI-generated assessment',
        questions:    [],
        instructions: 'Complete all questions to the best of your ability',
        timeLimit:    '30 minutes',
        rawResponse:  raw,
      }
    }

    return NextResponse.json({ assessment: assessmentData })
})
