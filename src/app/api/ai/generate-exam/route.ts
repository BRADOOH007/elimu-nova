import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { rateLimitAI, getIP } from '@/lib/rate-limit'
import { OpenAIService } from '@/lib/openai-service'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || !['TEACHER', 'SUPER_ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const rl = await rateLimitAI(session.user.id || getIP(request))
    if (!rl.allowed) {
      return NextResponse.json(
        { error: `Rate limit reached. Try again in ${rl.resetInSec}s.` },
        { status: 429, headers: { 'Retry-After': String(rl.resetInSec) } }
      )
    }

    const examData = await request.json()
    if (!examData.examTitle || !examData.subject || !examData.gradeLevel) {
      return NextResponse.json({ error: 'Exam title, subject, and grade level are required' }, { status: 400 })
    }

    const systemPrompt = `You are an expert educational exam creator for ElimuNova AI — Kenya CBC curriculum.
Always generate content in English unless the subject is Kiswahili.
Structure exams with: Cover Page, Student Instructions, Section A (MCQ), Section B (Short Answer), Section C (Long Answer/Essay), Marking Scheme.`

    const userPrompt = `Generate a complete ${examData.curriculum || 'CBC'} exam:
- Title: ${examData.examTitle}
- Subject: ${examData.subject}
- Grade: ${examData.gradeLevel}
- Questions: ${examData.numberOfQuestions || 20}
- Difficulty: ${examData.difficulty || 'medium'}
- Total Marks: ${examData.totalMarks || 100}
- Duration: ${examData.duration || 60} minutes
- Topics: ${examData.topics || 'All relevant topics'}
- Focus: ${examData.focusAreas || 'General understanding and application'}
${examData.includeDiagrams ? '- Include diagram-based questions where appropriate' : ''}

Format the exam as Markdown for easy reading and printing.`

    const examContent = await OpenAIService.generateLongContent([
      { role: 'system', content: systemPrompt },
      { role: 'user',   content: userPrompt   },
    ], { maxTokens: 4000, temperature: 0.7 })

    return NextResponse.json({ examContent })
  } catch (error) {
    console.error('Exam generation error:', error)
    return NextResponse.json({
      error:   'Failed to generate exam',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 })
  }
}
