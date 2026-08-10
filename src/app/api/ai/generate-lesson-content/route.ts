import { NextResponse } from 'next/server'
import { OpenAIService } from '@/lib/openai-service'
import { stripLatex } from '@/lib/clean-ai-text'
import { route } from '@/lib/api-middleware'

export const POST = route({ skipSubscriptionCheck: true }, async (req) => {
    const body = await req.json()
    const { lesson, learningOutcomes, studentLevel, learningStyle } = body

    const lessonTitle   = lesson?.title   || lesson?.topic   || 'lesson'
    const lessonSubject = lesson?.subject || 'General'
    const lessonGrade   = lesson?.grade   || 'Grade 8'

    const requestId = Date.now().toString(36) + Math.random().toString(36).slice(2, 6)

    const outcomes = Array.isArray(learningOutcomes) && learningOutcomes.length > 0
      ? learningOutcomes
      : []

    const content = await OpenAIService.generateLongContent([
      {
        role: 'system',
        content: `You are an AI tutor creating clear, well-structured study content for ${lessonGrade} ${lessonSubject} students.
Adapt to ${studentLevel || 'intermediate'} level and ${learningStyle || 'visual'} learning style.
Make it easy to understand and study from.
IMPORTANT: Do NOT use LaTeX, TeX or MathJax. Write all maths in plain text — use "/" for fractions, "^2" for powers, "_____" for blanks.`
      },
      {
        role: 'user',
        content: `Write a complete, well-structured lesson on "${lessonTitle}" in ${lessonSubject} for ${lessonGrade} students (request ${requestId}).
${outcomes.length > 0
  ? `\nTeach ONLY these curriculum learning objectives, and cover every one of them:\n${outcomes.map((o, i) => `${i + 1}. ${o}`).join('\n')}`
  : ''}

Structure it with these sections (use markdown headings):

## Key Ideas
3-5 bullet points covering the most important concepts

## Explanation
A clear, step-by-step explanation a beginner can follow. Break it into short paragraphs. Use sub-headings (###) for each step where helpful.

## Worked Examples
2-3 fully worked examples showing every step (number the steps). Show the thinking behind each step.

## Quick Reference
Formulas, definitions, rules, or steps the student should memorise. Use a markdown table if it helps.

## Common Mistakes
2-3 mistakes students often make on this topic and how to avoid them.

## Practice Questions
3-5 questions with brief answers the student can check.

Keep it well-organised and easy to read. No objectives, no warm-up, no summary section. Just rich, structured study content covering the learning objectives.`
      },
    ], { maxTokens: 3000, temperature: 0.7 })

    // Generate an illustration relevant to the topic and embed it under the title
    let illustrated = stripLatex(content)
    try {
      const image = await OpenAIService.generateImage({
        prompt: `A clean, colorful educational illustration about "${lessonTitle}" for ${lessonGrade} ${lessonSubject} students. Textbook quality, simple, clear, age-appropriate, easy to understand. White or light background. No text or words in the image.`,
        style: 'natural',
        size: '1024x1024',
        quality: 'standard',
      })
      if (image?.url) {
        illustrated = `![${lessonTitle} illustration](${image.url})\n\n${illustrated}`
      }
    } catch (e) {
      console.warn('[generate-lesson-content] image generation failed:', e)
    }

    return NextResponse.json({ content: illustrated, message: 'Study notes generated successfully' })
})
