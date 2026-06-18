/**
 * POST /api/ai/generate-lesson-from-scheme
 *
 * Generates a detailed lesson plan from a specific scheme row.
 * The scheme row provides full CBC context so the AI generates
 * a much richer, more specific lesson plan than generating from scratch.
 *
 * Also saves the lesson plan linked to the scheme in the DB.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { OpenAIService } from '@/lib/openai-service'
import type { KICDRow } from '@/app/api/ai/generate-scheme-structured/route'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || session.user.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const teacher = await prisma.teacher.findUnique({ where: { userId: session.user.id } })
    if (!teacher) return NextResponse.json({ error: 'Teacher not found' }, { status: 404 })

    const {
      schemeId,       // optional — link to existing scheme
      row,            // KICDRow data
      subject,
      grade,
      saveToDb = true,
    }: {
      schemeId?: string
      row: KICDRow
      subject: string
      grade: string
      saveToDb?: boolean
    } = await request.json()

    if (!row || !subject || !grade) {
      return NextResponse.json({ error: 'row, subject and grade are required' }, { status: 400 })
    }

    const systemPrompt = `You are a Kenyan CBC curriculum expert creating detailed lesson plans.
The lesson plan must match exactly what is in the scheme of work row provided.
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

    // Robust JSON extraction — find first { and last }
    let lessonData: any = {}
    try {
      const start = raw.indexOf('{')
      const end   = raw.lastIndexOf('}')
      if (start === -1 || end === -1 || end <= start) throw new Error('No JSON object found')
      lessonData = JSON.parse(raw.slice(start, end + 1))
    } catch (e) {
      return NextResponse.json({ error: 'AI returned invalid format. Please try again.' }, { status: 500 })
    }

    if (!saveToDb) return NextResponse.json({ lessonPlan: lessonData })

    // Save to DB linked to scheme
    const title = lessonData.title || `${subject} - ${row.subStrand} - Week ${row.week} Lesson ${row.lesson}`

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
  } catch (error: any) {
    console.error('[GENERATE_LESSON_FROM_SCHEME]', error)
    return NextResponse.json({ error: error.message || 'Failed to generate lesson plan' }, { status: 500 })
  }
}
