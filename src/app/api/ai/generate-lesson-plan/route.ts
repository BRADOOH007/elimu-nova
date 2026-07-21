import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { OpenAIService } from '@/lib/openai-service'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized - Please log in' }, { status: 401 })
    }

    const userRole = session.user.role
    if (userRole !== 'TEACHER' && userRole !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Access denied - Teachers only' }, { status: 403 })
    }

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
    if (!templateText && userRole === 'TEACHER') {
      const teacher = await prisma.teacher.findUnique({
        where: { userId: session.user.id },
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

    const systemPrompt = `You are a Kenyan CBC curriculum expert creating detailed lesson plans.${templateBlock}
Return a JSON object with these fields:
{
  "title": string,
  "duration": number (minutes),
  "strand": string,
  "subStrand": string,
  "specificLearningOutcomes": string,
  "keyInquiryQuestions": string[],
  "introduction": { "duration": number, "activity": string, "teacherActions": string, "studentActions": string },
  "mainActivity": { "duration": number, "activity": string, "teacherActions": string, "studentActions": string, "coreCompetencies": string[] },
  "practiceActivity": { "duration": number, "activity": string },
  "conclusion": { "duration": number, "activity": string, "assessment": string },
  "learningResources": string[],
  "assessment": string,
  "differentiation": { "support": string, "extension": string },
  "homework": string,
  "teacherReflection": string
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
        { maxTokens: 2000, temperature: 0.5 }
      )

      let lessonData: any = {}
      try {
        const start = raw.indexOf('{')
        const end = raw.lastIndexOf('}')
        if (start === -1 || end === -1 || end <= start) throw new Error('No JSON found')
        lessonData = JSON.parse(raw.slice(start, end + 1))
      } catch {
        return NextResponse.json({ error: 'AI returned invalid format. Please try again.' }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        mode: 'single',
        lesson: lessonData,
        metadata: { subject, grade, topic, duration, language: isKiswahili ? 'swahili' : 'english' },
      })
    }

    // ── Term mode: generate multiple lessons across weeks ──
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
      { maxTokens: 4000, temperature: 0.5 }
    )

    let termData: any = {}
    try {
      const start = raw.indexOf('{')
      const end = raw.lastIndexOf('}')
      if (start === -1 || end === -1 || end <= start) throw new Error('No JSON found')
      termData = JSON.parse(raw.slice(start, end + 1))
    } catch {
      return NextResponse.json({ error: 'AI returned invalid format. Please try again.' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      mode: 'term',
      termPlan: termData,
      metadata: { subject, grade, weeks: finalWeeks, lessonsPerWeek: finalLessonsPerWeek, topics: topicsList, language: isKiswahili ? 'swahili' : 'english' },
    })
  } catch (error) {
    console.error('Error generating lesson plan:', error)
    return NextResponse.json(
      { error: 'Failed to generate lesson plan', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
