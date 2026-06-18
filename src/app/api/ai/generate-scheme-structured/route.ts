/**
 * POST /api/ai/generate-scheme-structured
 *
 * Generates a CBC-compliant scheme of work in KICD table format.
 * Returns structured JSON rows (one per lesson) — not prose/markdown.
 *
 * Each row matches the official KICD columns:
 *   Week | Lesson | Strand | Sub-Strand | Specific Learning Outcomes |
 *   Key Inquiry Questions | Learning Experiences | Learning Resources |
 *   Assessment | Reflection
 *
 * The structured output is saved to DB (SchemeOfWork + SchemeTopic records)
 * and can be used to generate lesson plans and PowerPoints for any row.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { OpenAIService } from '@/lib/openai-service'

export interface KICDRow {
  week:                      number
  lesson:                    number
  strand:                    string
  subStrand:                 string
  specificLearningOutcomes:  string
  keyInquiryQuestions:       string[]
  learningExperiences:       string[]
  learningResources:         string[]
  assessment:                string
  reflection:                string
  durationMinutes:           number
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || session.user.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const teacher = await prisma.teacher.findUnique({ where: { userId: session.user.id } })
    if (!teacher) return NextResponse.json({ error: 'Teacher not found' }, { status: 404 })

    const {
      title, subject, grade, term,
      weeksCount      = 13,
      lessonsPerWeek  = 5,
      selectedTopics  = [],   // array of { strand, subStrand } from CBC data
      termStartDate,
      saveToDb        = true,
    } = await request.json()

    if (!subject || !grade) {
      return NextResponse.json({ error: 'subject and grade are required' }, { status: 400 })
    }

    const totalLessons = weeksCount * lessonsPerWeek
    const topicsStr = selectedTopics.length > 0
      ? selectedTopics.map((t: any) => `${t.strand} → ${t.subStrand}`).join('\n')
      : `Generate appropriate ${subject} topics for ${grade}`

    // ── Ask AI to return structured JSON rows ──────────────────────────────
    const systemPrompt = `You are a Kenyan CBC curriculum expert. You create schemes of work in the official KICD format.
Return ONLY a valid JSON array. No markdown, no explanation, just the JSON array.
Each object must have exactly these fields:
week, lesson, strand, subStrand, specificLearningOutcomes, keyInquiryQuestions (array), learningExperiences (array), learningResources (array), assessment, reflection, durationMinutes.
Make content practical, CBC-aligned, and appropriate for ${grade} ${subject}.`

    const userPrompt = `Create a CBC scheme of work with these details:
Subject: ${subject}
Grade: ${grade}
Term: ${term || 'Term 1'}
Total weeks: ${weeksCount}
Lessons per week: ${lessonsPerWeek}
Total lessons: ${totalLessons}

Topics to cover (Strand → Sub-Strand):
${topicsStr}

Return a JSON array of exactly ${totalLessons} lesson objects.
Distribute topics evenly across weeks.
Each lesson should build on the previous one.
Use Kenya-specific examples and contexts.`

    const raw = await OpenAIService.generateLongContent(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user',   content: userPrompt   },
      ],
      { maxTokens: 4000, temperature: 0.4 }
    )

    // ── Parse JSON response ────────────────────────────────────────────────
    let rows: KICDRow[] = []
    try {
      const jsonMatch = raw.match(/\[[\s\S]*\]/)
      if (!jsonMatch) throw new Error('No JSON array found in response')
      rows = JSON.parse(jsonMatch[0])
    } catch (e) {
      console.error('[SCHEME] JSON parse failed:', e)
      return NextResponse.json({ error: 'AI returned invalid format. Please try again.' }, { status: 500 })
    }

    if (!saveToDb) return NextResponse.json({ rows, totalLessons: rows.length })

    // ── Save to database ───────────────────────────────────────────────────
    const schemeTitle = title || `${subject} - ${grade} - ${term || 'Term 1'}`

    const scheme = await prisma.schemeOfWork.create({
      data: {
        title:     schemeTitle,
        subject,
        grade,
        term:      term || 'Term 1',
        content:   JSON.stringify(rows),
        duration:  weeksCount,
        teacherId: teacher.id,
        schoolId:  teacher.schoolId || undefined,
        objectives: rows.slice(0, 5).map(r => r.specificLearningOutcomes).join('; '),
      },
    })

    // Save each lesson row as a SchemeTopic
    const topicRecords = rows.map(row => ({
      title:         `W${row.week} L${row.lesson}: ${row.subStrand}`,
      description:   row.specificLearningOutcomes,
      weekNumber:    row.week,
      lessonNumber:  row.lesson,
      objectives:    [row.specificLearningOutcomes],
      activities:    row.learningExperiences,
      resources:     row.learningResources,
      assessment:    row.assessment,
      duration:      row.durationMinutes || 40,
      schemeOfWorkId: scheme.id,
    }))

    await prisma.schemeTopic.createMany({ data: topicRecords })

    // Return scheme with all rows
    return NextResponse.json({
      scheme: {
        id:      scheme.id,
        title:   scheme.title,
        subject: scheme.subject,
        grade:   scheme.grade,
        term:    scheme.term,
      },
      rows,
      totalLessons: rows.length,
    })
  } catch (error: any) {
    console.error('[GENERATE_SCHEME_STRUCTURED]', error)
    return NextResponse.json({ error: error.message || 'Failed to generate scheme' }, { status: 500 })
  }
}
