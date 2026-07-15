import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { OpenAIService } from '@/lib/openai-service'
import { stripLatex } from '@/lib/clean-ai-text'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { lesson, studentLevel, learningStyle } = body

    const lessonTitle   = lesson?.title   || lesson?.topic   || 'lesson'
    const lessonSubject = lesson?.subject || 'General'
    const lessonGrade   = lesson?.grade   || 'Grade 8'

    const content = await OpenAIService.generateLongContent([
      {
        role: 'system',
        content: `You are an AI tutor creating personalized lesson content for ${lessonGrade} students.
Adapt to ${studentLevel || 'intermediate'} level and ${learningStyle || 'visual'} learning style.
IMPORTANT: Do NOT use LaTeX, TeX or MathJax. Write all maths in plain text — use "/" for fractions (e.g. 1/2), "^2" for powers, "_____" for answer blanks.`
      },
      {
        role: 'user',
        content: `Create detailed, engaging lesson content for: "${lessonTitle}" in ${lessonSubject}. Include: explanation, examples, key points, and practice questions. Format as structured markdown.`
      },
    ], { maxTokens: 2000, temperature: 0.7 })

    return NextResponse.json({ content: stripLatex(content), message: 'Lesson content generated successfully' })
  } catch (error) {
    console.error('Error generating lesson content:', error)
    return NextResponse.json({ error: 'Failed to generate lesson content', details: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 })
  }
}
