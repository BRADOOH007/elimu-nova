import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { rateLimitAI, getIP, checkRateLimit } from '@/lib/rate-limit'
import { OpenAIService } from '@/lib/openai-service'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || !['STUDENT', 'TEACHER', 'SUPER_ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const rl = await checkRateLimit(session.user.id || getIP(request), rateLimitAI)
    if (!rl.allowed) {
      return NextResponse.json(
        { error: `Rate limit reached. Try again in ${rl.resetInSec}s.` },
        { status: 429, headers: { 'Retry-After': String(rl.resetInSec) } }
      )
    }

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
  } catch (error) {
    console.error('Assessment generation error:', error)
    return NextResponse.json({
      error:   'Failed to generate assessment',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 })
  }
}
