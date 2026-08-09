/**
 * POST /api/ai/previous-learning
 * Previous Learning Recap — AI summary of what was covered before this lesson
 */
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { OpenAIService } from '@/lib/openai-service'
import { route } from '@/lib/api-middleware'

export const POST = route({}, async (request, { user }) => {

    const { subject, grade, currentStrand, currentSubStrand, schemeId } = await request.json()
    if (!subject || !grade) return NextResponse.json({ error: 'subject and grade required' }, { status: 400 })

    // Fetch recent scheme topics for context
    let previousTopics: any[] = []
    if (schemeId) {
      try {
        previousTopics = await prisma.schemeTopic.findMany({
          where: { schemeOfWorkId: schemeId },
          orderBy: [{ weekNumber: 'asc' }, { lessonNumber: 'asc' }],
          take: 10,
          select: { title: true, description: true, weekNumber: true, lessonNumber: true },
        })
      } catch { /* non-fatal */ }
    }

    const prevContext = previousTopics.length > 0
      ? previousTopics.map(t => `W${t.weekNumber}L${t.lessonNumber}: ${t.title}`).join('\n')
      : `Recent ${subject} topics for ${grade}`

    const prompt = `You are a teacher creating a "Previous Learning Recap" for the start of today's lesson.

Subject: ${subject} | Grade: ${grade}
TODAY'S LESSON: ${currentStrand || subject} — ${currentSubStrand || 'New Topic'}

RECENT TOPICS COVERED:
${prevContext}

Create an engaging, student-friendly recap in this JSON format:
{
  "greeting": "Warm, engaging opening (1 sentence)",
  "recap": "2-3 sentence summary of what was covered recently, connecting to today's lesson",
  "keyPoints": ["Key point 1 students should remember", "Key point 2", "Key point 3"],
  "quickQuestion": "One recall question to activate prior knowledge (fun, easy)",
  "connection": "1 sentence: how previous learning connects to today's new topic",
  "todayPreview": "Exciting 1-sentence preview of today's lesson"
}

Use:
- Simple, friendly language appropriate for ${grade}
- Relatable local examples and familiar contexts
- Encouraging, enthusiastic tone`

    const raw = await OpenAIService.generateText([
      { role: 'system', content: 'You are a teacher. Return ONLY valid JSON.' },
      { role: 'user', content: prompt },
    ], { maxTokens: 600, temperature: 0.7 })

    const start = raw.indexOf('{'); const end = raw.lastIndexOf('}')
    if (start === -1 || end <= start) return NextResponse.json({ error: 'Invalid format' }, { status: 500 })

    return NextResponse.json({ recap: JSON.parse(raw.slice(start, end + 1)), subject, grade })
})
