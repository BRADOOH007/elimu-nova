import { NextResponse } from 'next/server'
import { OpenAIService } from '@/lib/openai-service'
import { prisma } from '@/lib/prisma'
import { buildKICDLessonPrompt } from '@/lib/cbc-context'
import { route } from '@/lib/api-middleware'
import { cleanAiJson } from '@/lib/ai-generation-utils'
import { buildFullGenerationContext } from '@/lib/curriculum-intelligence'

export const POST = route({ auth: ['TEACHER', 'SUPER_ADMIN'] }, async (request, { user }) => {
    const body = await request.json()
    const { mode = 'single', subject, grade, topic, duration, objectives, prerequisites, documentContext, term, weeksCount, lessonsPerWeek, topics: requestTopics } = body

    if (!subject || !grade) {
      return NextResponse.json({ error: 'Subject and grade are required' }, { status: 400 })
    }

    if (mode === 'single' && !topic) {
      return NextResponse.json({ error: 'Topic is required for single lesson mode' }, { status: 400 })
    }

    if (mode === 'term' && (!requestTopics || requestTopics.length === 0)) {
      return NextResponse.json({ error: 'At least one topic is required for term mode' }, { status: 400 })
    }

    let templateText = documentContext
    if (!templateText && user.role === 'TEACHER') {
      const teacher = await prisma.teacher.findUnique({
        where: { userId: user.id },
        select: { lessonPlanTemplate: true },
      })
      templateText = teacher?.lessonPlanTemplate || null
    }

    const filteredObjectives = Array.isArray(objectives)
      ? objectives.filter((obj: string) => obj && obj.trim() !== '')
      : []
    const filteredPrerequisites = Array.isArray(prerequisites)
      ? prerequisites.filter((prereq: string) => prereq && prereq.trim() !== '')
      : []

    const isKiswahili = subject.toLowerCase() === 'kiswahili'
    const languageInstruction = isKiswahili
      ? 'IMPORTANT: Generate this lesson plan entirely in Swahili language.'
      : 'IMPORTANT: Generate this lesson plan entirely in English language.'

    const templateBlock = templateText
      ? `\n\nA reference lesson plan document was uploaded. Study its structure, sections, and style, then generate in the same format:\n\n${templateText.slice(0, 6000)}\n\n---\n`
      : ''

    const kicdContext = buildKICDLessonPrompt(grade, subject)

    // Fetch curriculum intelligence — official outcomes + teacher examples + RAG
    const { curriculumSection, examplesSection, ragContext } = await buildFullGenerationContext(
      grade, subject as string, { generationType: 'lesson_plan', topic: topic as string }
    )

    const systemPrompt = `You are a Kenyan CBC/CBE curriculum expert creating detailed lesson plans in the official KICD format.${templateBlock}
${kicdContext}

${curriculumSection}
${ragContext}
${examplesSection}

Return a JSON object EXACTLY matching this KICD 11-section structure:
{
  "title": string,
  "duration": number (minutes),
  "lessonHeader": {
    "school": "string",
    "teacher": "string",
    "learningArea": "${subject}",
    "grade": "${grade}",
    "term": "string",
    "week": 1,
    "lesson": 1,
    "date": "string",
    "duration": number,
    "enrolment": number
  },
  "strand": "string (exact from KICD curriculum design)",
  "subStrand": "string (exact from KICD curriculum design)",
  "specificLearningOutcomes": ["SLO1 - knowledge", "SLO2 - skill", "SLO3 - attitude"],
  "keyInquiryQuestions": ["open-ended question"],
  "coreCompetencies": ["pick 2-3 from the 7 CBC competencies"],
  "values": ["pick 1-2 from KICD values list"],
  "pcis": ["pick 1-2 Pertinent and Contemporary Issues"],
  "learningResources": ["resource with page numbers"],
  "organisationOfLearning": {
    "introduction": { "duration": 5, "teacherActivity": "string", "learnerActivity": "string" },
    "step1": { "duration": number, "teacherActivity": "string", "learnerActivity": "string" },
    "step2": { "duration": number, "teacherActivity": "string", "learnerActivity": "string" },
    "step3": { "duration": number, "teacherActivity": "string", "learnerActivity": "string" },
    "conclusion": { "duration": number, "teacherActivity": "string", "learnerActivity": "string" }
  },
  "assessment": "string",
  "extendedActivities": "string",
  "reflection": "string"
}
Return ONLY valid JSON. No markdown or explanation.`

    if (mode === 'single') {
      if (!topic || !duration || filteredObjectives.length === 0) {
        return NextResponse.json({ error: 'Topic, duration, and at least one objective required' }, { status: 400 })
      }

      const userPrompt = `Create a detailed ${duration}-minute lesson plan for:

Subject: ${subject}
Grade: ${grade}
Topic: ${topic}
${languageInstruction}

Learning Objectives: ${filteredObjectives.join(', ')}
Prerequisites: ${filteredPrerequisites.length > 0 ? filteredPrerequisites.join(', ') : 'None specified'}

Make this lesson plan practical, engaging, and specifically tailored for Kenyan ${grade} students.
Use local examples. Each activity should have clear timing and instructions.`

      const raw = await OpenAIService.generateLongContent(
        [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        { maxTokens: 6000, temperature: 0.5 }
      )

      let lessonData: any = {}
      try {
        const json = cleanAiJson(raw)
        if (!json) throw new Error('No JSON found')
        lessonData = JSON.parse(json)
      } catch (e) {
        console.warn('[LessonPlan] AI returned invalid JSON:', e, 'Raw:', raw.slice(0, 200))
        return NextResponse.json({ error: 'AI returned invalid format. Please try again.' }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        mode: 'single',
        lesson: lessonData,
        metadata: { subject, grade, topic, duration, language: isKiswahili ? 'swahili' : 'english' },
      })
    }

    // â”€â”€ Term mode: generate multiple lessons across weeks â”€â”€
    const finalWeeks = weeksCount || 13
    const finalLessonsPerWeek = lessonsPerWeek || 5
    const topicsList: string[] = requestTopics || (topic ? [topic] : [])

    const termPrompt = `Create a comprehensive set of lesson plans covering an entire term.

Subject: ${subject}
Grade: ${grade}
Term: ${term || 'Term'}
Duration: ${finalWeeks} weeks, ${finalLessonsPerWeek} lessons per week
Topics to cover: ${topicsList.join(', ')}
${languageInstruction}

You must generate lesson plans for ALL ${finalWeeks * finalLessonsPerWeek} lessons across ${finalWeeks} weeks.
Cover ALL topics: ${topicsList.join(', ')}
Distribute topics evenly across the weeks.

Return a JSON object with this structure:
{
  "title": "${subject} - ${grade} - Term Plan",
  "weeks": [
    {
      "weekNumber": 1,
      "theme": string,
      "lessons": [
        {
          "lessonNumber": 1,
          "topic": string,
          "duration": 40,
          "specificLearningOutcomes": string,
          "keyInquiryQuestions": string[],
          "introduction": { "duration": number, "activity": string, "teacherActions": string, "studentActions": string },
          "mainActivity": { "duration": number, "activity": string, "teacherActions": string, "studentActions": string, "coreCompetencies": string[] },
          "practiceActivity": { "duration": number, "activity": string },
          "conclusion": { "duration": number, "activity": string, "assessment": string },
          "learningResources": string[],
          "assessment": string,
          "homework": string
        }
      ]
    }
  ]
}
Return ONLY valid JSON. No markdown or explanation.`

    const raw = await OpenAIService.generateLongContent(
      [
        { role: 'system', content: systemPrompt.replace('Return ONLY valid JSON.', 'Return the full term plan as valid JSON.') },
        { role: 'user', content: termPrompt },
      ],
      { maxTokens: 8000, temperature: 0.5 }
    )

    let termData: any = {}
    try {
      const json = cleanAiJson(raw)
      if (!json) throw new Error('No JSON found')
      termData = JSON.parse(json)
    } catch (e) {
      console.warn('[GenerateLessonPlan] Term JSON parse failed:', e)
      return NextResponse.json({ error: 'AI returned invalid format. Please try again.' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      mode: 'term',
      termPlan: termData,
      metadata: { subject, grade, weeks: finalWeeks, lessonsPerWeek: finalLessonsPerWeek, topics: topicsList, language: isKiswahili ? 'swahili' : 'english' },
    })
})
