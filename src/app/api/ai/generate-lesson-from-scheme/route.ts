/**
 * POST /api/ai/generate-lesson-from-scheme
 *
 * Generates a detailed lesson plan from a specific scheme row.
 * The scheme row provides full CBC context so the AI generates
 * a much richer, more specific lesson plan than generating from scratch.
 *
 * Also saves the lesson plan linked to the scheme in the DB.
 */

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { OpenAIService } from '@/lib/openai-service'
import { buildKICDLessonPrompt } from '@/lib/cbc-context'
import type { KICDRow } from '@/app/api/ai/generate-scheme-structured/route'
import { route } from '@/lib/api-middleware'
import { cleanAiJson } from '@/lib/ai-generation-utils'

export const POST = route({ auth: 'TEACHER' }, async (request, { user }) => {
    const teacher = await prisma.teacher.findUnique({ where: { userId: user.id } })
    if (!teacher) return NextResponse.json({ error: 'Teacher not found' }, { status: 404 })

    const {
      schemeId,        // optional Ã¢â‚¬â€ link to existing scheme
      row,             // KICDRow data
      subject,
      grade,
      saveToDb = true,
      documentContext,
    }: {
      schemeId?: string
      row: KICDRow
      subject: string
      grade: string
      saveToDb?: boolean
      documentContext?: string
    } = await request.json()

    if (!row || !subject || !grade) {
      return NextResponse.json({ error: 'row, subject and grade are required' }, { status: 400 })
    }

    // Fetch teacher's saved lesson plan template if no explicit context
    let templateText = documentContext
    if (!templateText) {
      const t = await prisma.teacher.findUnique({
        where: { userId: user.id },
        select: { lessonPlanTemplate: true },
      })
      templateText = t?.lessonPlanTemplate ?? undefined
    }
    const templateBlock = templateText
      ? `\n\nA reference lesson plan document was uploaded as a format template. Study its structure, sections, and style, then generate the lesson plan in the same format:\n\n${templateText.slice(0, 6000)}\n\n---\n`
      : ''

    const kicdContext = buildKICDLessonPrompt(grade, subject)
    const systemPrompt = `You are a Kenyan CBC/CBE curriculum expert creating detailed lesson plans in the official KICD format.${templateBlock}
${kicdContext}
The lesson plan must match exactly what is in the scheme of work row provided.

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
    "week": number,
    "lesson": number,
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

    const userPrompt = `Create a detailed ${row.durationMinutes || 40}-minute lesson plan for:

Subject: ${subject}
Grade: ${grade}
Week: ${row.week}, Lesson: ${row.lesson}
Strand: ${row.strand || subject}
Sub-Strand: ${row.subStrand || ''}

Specific Learning Outcomes:
${row.specificLearningOutcomes || ''}

Key Inquiry Questions:
${Array.isArray(row.keyInquiryQuestions) && row.keyInquiryQuestions.length
  ? row.keyInquiryQuestions.join('\n')
  : 'Generate appropriate inquiry questions'}

Learning Experiences from Scheme:
${Array.isArray(row.learningExperiences) && row.learningExperiences.length
  ? row.learningExperiences.join('\n')
  : 'Generate appropriate learning experiences'}

Required Resources:
${Array.isArray(row.learningResources) && row.learningResources.length
  ? row.learningResources.join('\n')
  : 'Standard classroom resources'}

Assessment Method:
${row.assessment || 'Oral questions and written exercises'}

Make this lesson plan practical, engaging, and specifically tailored for Kenyan ${grade} students.
Use local examples. Each activity should have clear timing and instructions.`

    const raw = await OpenAIService.generateLongContent(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user',   content: userPrompt   },
      ],
      { maxTokens: 2000, temperature: 0.5 }
    )

    // Robust JSON extraction Ã¢â‚¬â€ find first { and last }
    let lessonData: any = {}
    try {
      const json = cleanAiJson(raw)
      if (!json) throw new Error('No JSON object found')
      lessonData = JSON.parse(json)
    } catch (e) {
      return NextResponse.json({ error: 'AI returned invalid format. Please try again.' }, { status: 500 })
    }

    if (!saveToDb) return NextResponse.json({ lessonPlan: lessonData })

    // Save to DB linked to scheme
    const title = lessonData.title || `${subject} - ${row.subStrand} - Week ${row.week} Lesson ${row.lesson}`

    // Ã¢â€â‚¬Ã¢â€â‚¬ Dedup: never create duplicates for the same scheme row Ã¢â€â‚¬Ã¢â€â‚¬
    // A lesson plan for this scheme + week + lesson already exists? Return it.
    if (schemeId) {
      const existingForRow = await prisma.lessonPlan.findFirst({
        where: {
          teacherId: teacher.id,
          schemeOfWorkId: schemeId,
          title: { contains: row.subStrand || subject },
        },
        orderBy: { createdAt: 'desc' },
        select: { id: true, title: true, subject: true, grade: true },
      })

      if (existingForRow) {
        // Also verify content matches to avoid dupes from double-click
        return NextResponse.json({
          lessonPlan: {
            id:      existingForRow.id,
            title:   existingForRow.title,
            subject: existingForRow.subject,
            grade:   existingForRow.grade,
            existing: true,
          },
        })
      }
    }

    const lessonPlan = await prisma.lessonPlan.create({
      data: {
        title,
        subject,
        grade,
        content:       JSON.stringify(lessonData),
        teacherId:     teacher.id,
        schemeOfWorkId: schemeId || null,
      },
    })

    return NextResponse.json({
      lessonPlan: {
        id:      lessonPlan.id,
        title:   lessonPlan.title,
        subject: lessonPlan.subject,
        grade:   lessonPlan.grade,
        content: lessonData,
      },
    })
})
