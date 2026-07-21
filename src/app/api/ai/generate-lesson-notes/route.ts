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

    const { lessonPlan, noteType } = await request.json()

    if (!lessonPlan) {
      return NextResponse.json({ error: 'Lesson plan is required' }, { status: 400 })
    }

    // Safely extract content from lesson plan
    const rawContent = lessonPlan.content
    let contentStr = ''
    if (typeof rawContent === 'string') {
      contentStr = rawContent
    } else if (rawContent && typeof rawContent === 'object') {
      contentStr = rawContent.generatedContent
        || rawContent.content
        || JSON.stringify(rawContent).slice(0, 3000)
    }

    const systemPrompt = `You are an AI lesson notes generator for ElimuNova. Generate comprehensive student-ready notes from lesson plans.

NOTE TYPES:
1. summary      — Key points and main concepts only
2. detailed     — Full coverage of all topics with examples
3. study-guide  — Organised for exam preparation, includes practice questions
4. quick-reference — Brief, easy-to-scan format with bullet points
5. interactive  — Questions and activities for self-testing

REQUIREMENTS:
- Use clear, student-friendly language appropriate for the grade level
- Include key concepts, definitions, and examples
- Organise information logically with headings
- Include important formulas, dates, or key facts where relevant
- Include study tips and memory aids

Return ONLY a valid JSON object — no markdown, no explanation:
{
  "title": "Notes title",
  "subject": "Subject name",
  "grade": "Grade level",
  "noteType": "Type of notes",
  "sections": [
    {
      "heading": "Section heading",
      "content": "Main explanation text",
      "keyPoints": ["point 1", "point 2"],
      "examples": ["example 1"],
      "formulas": ["formula 1"],
      "definitions": { "term": "definition" }
    }
  ],
  "summary": "Brief lesson summary",
  "studyTips": ["tip 1", "tip 2"],
  "importantPoints": ["point 1", "point 2"],
  "nextSteps": "What to do next"
}`

    const userPrompt = `Generate ${noteType || 'detailed'} notes for:

Title: ${lessonPlan.title || 'Lesson'}
Subject: ${lessonPlan.subject || 'General'}
Grade: ${lessonPlan.grade || ''}
Content:
${contentStr || 'Generate appropriate notes for this subject and grade level.'}`

    const raw = await OpenAIService.generateLongContent(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user',   content: userPrompt   },
      ],
      { maxTokens: 2000, temperature: 0.6 }
    )

    // Robust JSON extraction
    let notesData: any
    try {
      const start = raw.indexOf('{')
      const end   = raw.lastIndexOf('}')
      if (start !== -1 && end > start) {
        notesData = JSON.parse(raw.slice(start, end + 1))
      } else {
        throw new Error('No JSON object in response')
      }
    } catch {
      // Return raw text as fallback — UI handles rawResponse field
      notesData = {
        title:          `Notes for ${lessonPlan.title || 'Lesson'}`,
        subject:        lessonPlan.subject || '',
        grade:          lessonPlan.grade   || '',
        noteType:       noteType || 'detailed',
        sections:       [],
        summary:        '',
        studyTips:      [],
        importantPoints: [],
        nextSteps:      '',
        rawResponse:    raw,
      }
    }

    return NextResponse.json({ notes: notesData })
  } catch (error) {
    console.error('Lesson notes generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate lesson notes', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
