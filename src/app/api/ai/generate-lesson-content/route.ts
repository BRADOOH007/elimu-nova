import { NextResponse } from 'next/server'
import { OpenAIService } from '@/lib/openai-service'
import { stripLatex } from '@/lib/clean-ai-text'
import { route } from '@/lib/api-middleware'
import { buildCurriculumLessonContext } from '@/lib/curriculum-prompt'
import { buildFullGenerationContext } from '@/lib/curriculum-intelligence'
import { buildSubjectPedagogySection } from '@/lib/subject-pedagogy'
import { buildGradeBandSection, getContentWordLimit } from '@/lib/grade-bands'
import { lookupLessonContent, saveLessonContent } from '@/lib/lesson-content-cache'

export const POST = route({ skipSubscriptionCheck: true }, async (req) => {
    const body = await req.json()
    const { lesson, learningOutcomes, studentLevel, learningStyle, curriculum, country } = body

    const lessonTitle   = lesson?.title   || lesson?.topic   || 'lesson'
    const lessonSubject = lesson?.subject || 'General'
    const lessonGrade   = lesson?.grade   || 'Grade 8'

    const requestId = Date.now().toString(36) + Math.random().toString(36).slice(2, 6)

    const outcomes = Array.isArray(learningOutcomes) && learningOutcomes.length > 0
      ? learningOutcomes
      : []

    // Check cache first
    const cached = await lookupLessonContent(lessonSubject, lessonTitle, lessonGrade, curriculum)
    if (cached) {
      return NextResponse.json({ content: cached.content, message: 'Study notes generated successfully', fromCache: true })
    }

    // Build curriculum context from profile + DB outcomes
    const curCtx = buildCurriculumLessonContext({ curriculum, country, grade: lessonGrade, subject: lessonSubject })

    // Fetch curriculum intelligence — official outcomes + teacher examples + RAG
    let curriculumSection = ''
    try {
      const { curriculumSection: cs } = await buildFullGenerationContext(
        lessonGrade, lessonSubject, { generationType: 'lesson_plan', topic: lessonTitle, curriculum: curriculum as string }
      )
      curriculumSection = cs
    } catch { /* curriculum intelligence unavailable */ }

    // Subject-specific pedagogy
    const pedagogySection = buildSubjectPedagogySection(lessonSubject)

    // Grade-band adaptations
    const gradeBandSection = buildGradeBandSection(lessonGrade)
    const wordLimit = getContentWordLimit(lessonGrade)

    const content = await OpenAIService.generateLongContent([
      {
        role: 'system',
        content: `You are an expert AI tutor creating comprehensive, well-structured study content for ${lessonGrade} ${lessonSubject} students.
${curCtx}
${curriculumSection}
${pedagogySection}
${gradeBandSection}
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
3-5 bullet points covering the most important concepts.

## Explanation
A clear, step-by-step explanation appropriate for ${lessonGrade} students. Break it into short paragraphs. Use sub-headings (###) for each step where helpful. ${curriculumSection ? 'Align strictly with the curriculum outcomes provided.' : ''}

## Worked Examples
2-3 fully worked examples showing every step (number the steps). Show the thinking behind each step. ${pedagogySection ? 'Use subject-specific formatting as guided.' : ''}

## Key Vocabulary
Define 5-8 key terms the student must know for this topic. Use a table format with term, definition, and example.

## Quick Reference
Formulas, definitions, rules, or steps the student should memorise. Use a markdown table if it helps.

## Common Mistakes
2-3 mistakes students often make on this topic and how to avoid them.

## Real-World Connection
Explain where this topic appears in everyday life or future careers. Make it relevant to the student.

## Practice Questions
4-5 questions with brief answers the student can check. Include a mix of difficulty levels.

LENGTH REQUIREMENT (CRITICAL): The lesson MUST contain at least ${wordLimit} words of genuine teaching material. Target ${Math.round(wordLimit * 1.2)} words. If under the minimum, expand each section with more explanatory text, examples, and detail. Rich, structured study content covering the learning objectives. Do NOT embed any images, base64 data, or image markdown — text, tables, and lists only.`
      },
    ], { maxTokens: 8000, temperature: 0.7 })

    // Generate an illustration relevant to the topic and embed it under the title
    let illustrated = stripLatex(content)

    // Save to cache (plain markdown without image)
    await saveLessonContent(lessonSubject, lessonTitle, lessonGrade, illustrated, curriculum)

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
