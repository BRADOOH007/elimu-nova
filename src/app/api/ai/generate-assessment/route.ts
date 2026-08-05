import { NextResponse } from 'next/server'
import { OpenAIService } from '@/lib/openai-service'
import { route } from '@/lib/api-middleware'
import { cleanAiJson } from '@/lib/ai-generation-utils'

export const POST = route({ auth: ['STUDENT', 'TEACHER', 'SUPER_ADMIN'] }, async (request, { user }) => {

    const { lessonPlan, assessmentType, questionCount } = await request.json()
    if (!lessonPlan) {
      return NextResponse.json({ error: 'Lesson plan is required' }, { status: 400 })
    }

    const isKiswahili = lessonPlan.subject?.toLowerCase() === 'kiswahili'

    const systemPrompt = `You are an AI assessment generator for ElimuNova AI (Kenya CBC curriculum).
${isKiswahili ? 'IMPORTANT: Generate this assessment entirely in Swahili.' : 'IMPORTANT: Generate this assessment entirely in English.'}
Return ONLY valid JSON â€” no markdown, no explanation.
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
      const json = cleanAiJson(raw)
      if (!json) throw new Error('No JSON found')
      assessmentData = JSON.parse(json)
    } catch (e) {
      console.error('[GenerateAssessment] JSON parse failed:', e)
      return NextResponse.json({ error: 'AI returned invalid format. Please try again.' }, { status: 500 })
    }

    return NextResponse.json({ assessment: assessmentData })
})
