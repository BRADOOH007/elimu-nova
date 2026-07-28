import { NextResponse } from 'next/server'
import { OpenAIService } from '@/lib/openai-service'
import { stripLatex } from '@/lib/clean-ai-text'
import { route } from '@/lib/api-middleware'

export const POST = route({}, async (req, { user }) => {
    const body = await req.json()
    const { lesson, studentLevel, learningStyle } = body

    const lessonTitle   = lesson?.title   || lesson?.topic   || 'lesson'
    const lessonSubject = lesson?.subject || 'General'
    const lessonGrade   = lesson?.grade   || 'Grade 8'

    const requestId = Date.now().toString(36) + Math.random().toString(36).slice(2, 6)

    const content = await OpenAIService.generateLongContent([
      {
        role: 'system',
        content: `You are an AI tutor creating concise study notes for ${lessonGrade} ${lessonSubject} students.
Adapt to ${studentLevel || 'intermediate'} level and ${learningStyle || 'visual'} learning style.
Keep it clear, practical, and easy to study from.
IMPORTANT: Do NOT use LaTeX, TeX or MathJax. Write all maths in plain text — use "/" for fractions, "^2" for powers, "_____" for blanks.`
      },
      {
        role: 'user',
        content: `Write concise study notes for "${lessonTitle}" in ${lessonSubject} (request ${requestId}).

Format as:
## Key Ideas
3-5 bullet points covering the most important concepts

## Explanation
A clear, short explanation with 1-2 simple examples the student can follow

## Quick Reference
Any formulas, definitions, or steps the student should memorise

Keep it brief — no objectives, no warm-up, no summary section. Just the notes a student would write before a test.`
      },
    ], { maxTokens: 1500, temperature: 0.7 })

    return NextResponse.json({ content: stripLatex(content), message: 'Study notes generated successfully' })
})
