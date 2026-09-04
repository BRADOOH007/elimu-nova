import { NextResponse } from 'next/server'
import { OpenAIService } from '@/lib/openai-service'
import { route } from '@/lib/api-middleware'
import { buildFullGenerationContext } from '@/lib/curriculum-intelligence'
import { buildSubjectPedagogySection } from '@/lib/subject-pedagogy'
import { buildGradeBandSection, getContentWordLimit } from '@/lib/grade-bands'

export const POST = route({ auth: ['STUDENT', 'TEACHER', 'SUPER_ADMIN'] }, async (request, { user }) => {

    const { lessonPlan, noteType, curriculum } = await request.json()

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

    const lessonTitle = lessonPlan.title || 'Lesson'
    const lessonSubject = lessonPlan.subject || 'General'
    const lessonGrade = lessonPlan.grade || 'Grade 8'

    // Fetch curriculum intelligence — official outcomes + teacher examples + RAG
    let curriculumSection = ''
    try {
      const { curriculumSection: cs } = await buildFullGenerationContext(
        lessonGrade, lessonSubject, { generationType: 'lesson_plan', topic: lessonTitle, curriculum: curriculum || lessonPlan.curriculum }
      )
      curriculumSection = cs
    } catch { /* curriculum intelligence unavailable */ }

    // Subject-specific pedagogy
    const pedagogySection = buildSubjectPedagogySection(lessonSubject)

    // Grade-band adaptations
    const gradeBandSection = buildGradeBandSection(lessonGrade)
    const wordLimit = getContentWordLimit(lessonGrade)
    const isAdvanced = wordLimit >= 1000 // senior secondary / adult learners

    const systemPrompt = `You are an AI lesson notes generator for ElimuNova. Generate comprehensive, exam-worthy student notes from lesson plans.
${curriculumSection}
${pedagogySection}
${gradeBandSection}

NOTE TYPES:
1. summary      — Key points and main concepts only
2. detailed     — Full coverage of all topics with examples
3. study-guide  — Organised for exam preparation, includes practice questions
4. quick-reference — Brief, easy-to-scan format with bullet points
5. interactive  — Questions and activities for self-testing

DEPTH REQUIREMENT (CRITICAL):
- The "sections" array must contain at least 4 substantive sections for ${noteType === 'summary' || noteType === 'quick-reference' ? 'this note type' : 'this grade level'}.
- Each section's "content" must be a full explanatory paragraph (3-6 sentences) that teaches the idea, not a one-line summary.
- Include realistic worked examples, and step-by-step working where the topic involves procedures.
${isAdvanced ? `- This is for advanced learners (${wordLimit}+ words expected). Use precise technical vocabulary, deeper analysis, and explicitly connect ideas across concepts. Do NOT oversimplify.` : `- Aim for approximately ${wordLimit} words of total content across all sections.`}

REQUIREMENTS:
- Use clear, student-friendly language appropriate for the grade level
- Include key concepts, definitions, and examples
- Organise information logically with headings
- Include important formulas, dates, or key facts where relevant
- Include study tips and memory aids
- ${curriculumSection ? 'Align strictly with the curriculum outcomes provided.' : 'Cover standard learning outcomes for this topic.'}
- Use age-appropriate vocabulary and reading level

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
  "vocabulary": [{ "term": "key term", "definition": "clear definition", "example": "usage example" }],
  "misconceptions": [{ "statement": "common mistake", "correction": "correct understanding" }],
  "summary": "Brief lesson summary",
  "studyTips": ["tip 1", "tip 2"],
  "importantPoints": ["point 1", "point 2"],
  "nextSteps": "What to do next"
}`

    const userPrompt = `Generate ${noteType || 'detailed'} notes for:

Title: ${lessonTitle}
Subject: ${lessonSubject}
Grade: ${lessonGrade}
${curriculum ? `Curriculum: ${curriculum}` : ''}
Content:
${contentStr || 'Generate appropriate notes for this subject and grade level.'}`

    const raw = await OpenAIService.generateLongContent(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user',   content: userPrompt   },
      ],
      { maxTokens: 6000, temperature: 0.6 }
    )

    // Robust JSON extraction
    let notesData: any
    try {
      const { cleanAiJson } = await import('@/lib/ai-generation-utils')
      const cleaned = cleanAiJson(raw)
      if (!cleaned) throw new Error('No JSON object in response')
      notesData = JSON.parse(cleaned)
    } catch (e) {
      console.warn('[LessonNotes] AI returned invalid JSON:', e, 'Raw:', raw.slice(0, 200))
      notesData = {
        title:          `Notes for ${lessonTitle}`,
        subject:        lessonSubject,
        grade:          lessonGrade,
        noteType:       noteType || 'detailed',
        sections:       [],
        vocabulary:     [],
        misconceptions: [],
        summary:        '',
        studyTips:      [],
        importantPoints: [],
        nextSteps:      '',
        rawResponse:    raw,
      }
    }

    return NextResponse.json({ notes: notesData })
})
