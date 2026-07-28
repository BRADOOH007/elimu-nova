/**
 * POST /api/ai/generate-scheme-structured
 *
 * Generates a CBC-compliant scheme of work in KICD table format.
 * Matches the schemesofwork.com format exactly — including mid-term breaks,
 * holidays, and revision weeks inserted at the correct positions.
 *
 * Each teaching row matches the official KICD columns:
 *   Week | Lesson | Strand | Sub-Strand | Specific Learning Outcomes |
 *   Key Inquiry Questions | Learning Experiences | Learning Resources |
 *   Assessment | Reflection
 *
 * Break rows use type: 'break' with a reason field.
 */

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { callAI } from '@/lib/ai-provider'
import { buildKICDSchemePrompt, CBC_SUBJECT_LESSON_ALLOCATION } from '@/lib/cbc-context'
import { route } from '@/lib/api-middleware'

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
  type?:                     'lesson' | 'break' | 'revision' | 'exam'
  breakReason?:              string  // e.g. "Mid-Term Break", "Public Holiday"
}

// ── Kenyan CBC term structure with standard breaks ─────────────────────────
const TERM_BREAKS: Record<string, Array<{ afterWeek: number; reason: string }>> = {
  'Term 1': [
    { afterWeek: 4,  reason: 'Mid-Term Break (1 week)' },
    { afterWeek: 10, reason: 'End of Term Examinations' },
  ],
  'Term 2': [
    { afterWeek: 4,  reason: 'Mid-Term Break (1 week)' },
    { afterWeek: 10, reason: 'End of Term Examinations' },
  ],
  'Term 3': [
    { afterWeek: 4,  reason: 'Mid-Term Break (1 week)' },
    { afterWeek: 8,  reason: 'Revision Week' },
    { afterWeek: 9,  reason: 'End of Year Examinations' },
  ],
}

/**
 * Build the full week timeline including break weeks.
 * Teaching weeks are numbered 1..weeksCount.
 * Break slots are inserted according to TERM_BREAKS.
 */
function buildTimeline(weeksCount: number, term: string): Array<{ week: number; isBreak: boolean; breakReason?: string }> {
  const breaks = TERM_BREAKS[term] || TERM_BREAKS['Term 1']
  const timeline: Array<{ week: number; isBreak: boolean; breakReason?: string }> = []
  let teachingWeek = 0

  for (let cal = 1; cal <= weeksCount + breaks.length; cal++) {
    const breakEntry = breaks.find(b => b.afterWeek === teachingWeek)
    if (breakEntry) {
      timeline.push({ week: cal, isBreak: true, breakReason: breakEntry.reason })
    } else {
      teachingWeek++
      if (teachingWeek > weeksCount) break
      timeline.push({ week: cal, isBreak: false })
    }
  }
  return timeline
}

/** 
 * Strip markdown fences and extract first JSON array from AI response.
 * Handles: ```json\n[...]\n```, plain [...], objects wrapping array.
 */
function extractJsonArray(raw: string): KICDRow[] {
  // Remove markdown code fences
  let cleaned = raw
    .replace(/```json\s*/gi, '')
    .replace(/```\s*/g, '')
    .trim()

  // Find first [ and matching last ]
  const start = cleaned.indexOf('[')
  const end   = cleaned.lastIndexOf(']')

  if (start !== -1 && end > start) {
    const candidate = cleaned.slice(start, end + 1)
    const parsed = JSON.parse(candidate)
    if (Array.isArray(parsed)) return parsed
  }

  // Some models wrap in {"rows": [...]} or {"scheme": [...]}
  const objStart = cleaned.indexOf('{')
  const objEnd   = cleaned.lastIndexOf('}')
  if (objStart !== -1 && objEnd > objStart) {
    const obj = JSON.parse(cleaned.slice(objStart, objEnd + 1))
    for (const key of Object.keys(obj)) {
      if (Array.isArray(obj[key])) return obj[key]
    }
  }

  throw new Error('No JSON array found in AI response')
}

/** Normalise a row so every required field is present */
function normaliseRow(r: any, week: number, lesson: number): KICDRow {
  return {
    week:                     r.week        ?? week,
    lesson:                   r.lesson      ?? lesson,
    strand:                   r.strand      || r.Strand      || '',
    subStrand:                r.subStrand   || r.SubStrand   || r['sub-strand'] || r['Sub-Strand'] || '',
    specificLearningOutcomes: r.specificLearningOutcomes || r.objectives || r.outcomes || '',
    keyInquiryQuestions:      Array.isArray(r.keyInquiryQuestions)  ? r.keyInquiryQuestions  : (r.keyInquiryQuestions  ? [r.keyInquiryQuestions]  : []),
    learningExperiences:      Array.isArray(r.learningExperiences)  ? r.learningExperiences  : (r.learningExperiences  ? [r.learningExperiences]  : []),
    learningResources:        Array.isArray(r.learningResources)    ? r.learningResources    : (r.learningResources    ? [r.learningResources]    : []),
    assessment:               r.assessment  || '',
    reflection:               r.reflection  || '',
    durationMinutes:          r.durationMinutes || r.duration || 40,
    type:                     'lesson',
  }
}

export const POST = route({ auth: 'TEACHER' }, async (request, { user }) => {
    const teacher = await prisma.teacher.findUnique({ where: { userId: user.id } })
    if (!teacher) return NextResponse.json({ error: 'Teacher not found' }, { status: 404 })

    const {
      title,
      subject,
      grade,
      term          = 'Term 1',
      weeksCount    = 13,
      lessonsPerWeek = 5,
      selectedTopics = [],
      saveToDb       = true,
      documentContext,
    } = await request.json()

    if (!subject || !grade) {
      return NextResponse.json({ error: 'subject and grade are required' }, { status: 400 })
    }

    // Fetch teacher's saved template if no explicit context provided
    let templateText = documentContext
    if (!templateText) {
      const t = await prisma.teacher.findUnique({
        where: { userId: user.id },
        select: { schemeOfWorkTemplate: true },
      })
      templateText = t?.schemeOfWorkTemplate || null
    }

    // Only ask AI to generate the TEACHING weeks (not break weeks)
    const teachingWeeks  = weeksCount
    const effectiveLessonsPerWeek = subject ? (CBC_SUBJECT_LESSON_ALLOCATION[subject] || lessonsPerWeek) : lessonsPerWeek
    const totalLessons   = teachingWeeks * effectiveLessonsPerWeek

    const topicsStr = selectedTopics.length > 0
      ? selectedTopics.map((t: any) => `${t.strand} → ${t.subStrand}`).join('\n')
      : `Generate appropriate CBC ${subject} topics for ${grade} ${term}`

    const templateBlock = templateText
      ? `\n\nA reference document was uploaded as a format template. Study its structure, sections, and style, then generate the scheme of work in the same format:\n\n${templateText.slice(0, 6000)}\n\n---\n`
      : ''

    // ── System prompt — extremely strict about output format ───────────────
    const kicdContext = buildKICDSchemePrompt(grade, subject)
    const systemPrompt = `You are a Kenyan CBC/CBE curriculum expert creating official KICD schemes of work.${templateBlock}
${kicdContext}
You MUST return ONLY a raw JSON array — no markdown, no code fences, no explanation text, nothing else.
The first character of your response must be [ and the last must be ].
Each element is an object with EXACTLY these keys (no extras, no missing):
{
  "week": <number 1-${teachingWeeks}>,
  "lesson": <number 1-${effectiveLessonsPerWeek}>,
  "strand": "<string>",
  "subStrand": "<string>",
  "specificLearningOutcomes": "<string — starts with 'By the end of the lesson, the learner should be able to'>",
  "keyInquiryQuestions": ["<question>", "<question>"],
  "learningExperiences": ["<activity>", "<activity>", "<activity>"],
  "learningResources": ["<resource>", "<resource>"],
  "assessment": "<string>",
  "reflection": "",
  "durationMinutes": 40
}
CBC-aligned content. Kenya-specific examples. Appropriate for ${grade} ${subject}.
Week numbers go 1 to ${teachingWeeks}. Lessons 1 to ${effectiveLessonsPerWeek} per week for ${subject}.`

    const userPrompt = `Generate a ${teachingWeeks}-week CBC scheme of work:
Subject: ${subject}
Grade: ${grade}
Term: ${term}
Lessons per week (KICD standard for ${subject}): ${effectiveLessonsPerWeek}
Total teaching lessons: ${totalLessons}

Topics (Strand → Sub-Strand):
${topicsStr}

Rules:
- Distribute topics evenly across all ${teachingWeeks} weeks
- Each week has exactly ${effectiveLessonsPerWeek} lessons
- Lessons within each week build progressively
- Use Kenyan contexts and examples
- Return exactly ${totalLessons} objects in the JSON array`

    // ── Try up to 3 providers in order — stop at first valid parse ────────
    let rows: KICDRow[] = []
    let lastError = ''

    const providers: Array<{ name: string; fn: () => Promise<string> }> = [
      {
        name: 'Cerebras',
        fn: async () => {
          const r = await callAI({ messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }], maxTokens: 4000, temperature: 0.2, cerebrasModel: 'llama3.1-8b' })
          return r.content
        }
      },
      {
        name: 'DeepSeek',
        fn: async () => {
          const r = await callAI({ messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }], maxTokens: 4000, temperature: 0.2 })
          return r.content
        }
      },
      {
        name: 'Groq',
        fn: async () => {
          const r = await callAI({ messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }], maxTokens: 4000, temperature: 0.2, groqModel: 'llama-3.3-70b' })
          return r.content
        }
      },
    ]

    for (const provider of providers) {
      try {
        console.log(`[SCHEME] Trying ${provider.name}...`)
        const raw = await provider.fn()
        console.log(`[SCHEME] ${provider.name} raw (first 200):`, raw.slice(0, 200))
        rows = extractJsonArray(raw).map((r, i) =>
          normaliseRow(r, Math.floor(i / effectiveLessonsPerWeek) + 1, (i % effectiveLessonsPerWeek) + 1)
        )
        if (rows.length > 0) {
          console.log(`[SCHEME] ✅ ${provider.name} returned ${rows.length} rows`)
          break
        }
      } catch (e: any) {
        lastError = `${provider.name}: ${e.message}`
        console.warn(`[SCHEME] ${provider.name} failed:`, e.message)
      }
    }

    if (rows.length === 0) {
      console.error('[SCHEME] All providers failed. Last error:', lastError)
      return NextResponse.json({
        error: 'Could not generate scheme. AI providers returned invalid format. Please try again.',
      }, { status: 500 })
    }

    // ── Insert break rows into the timeline ────────────────────────────────
    const timeline = buildTimeline(teachingWeeks, term)
    const allRows: KICDRow[] = []
    let rowIndex = 0

    for (const slot of timeline) {
      if (slot.isBreak) {
        allRows.push({
          week: slot.week, lesson: 0,
          strand: '', subStrand: '',
          specificLearningOutcomes: slot.breakReason || 'Break',
          keyInquiryQuestions: [], learningExperiences: [], learningResources: [],
          assessment: '', reflection: '', durationMinutes: 0,
          type: 'break', breakReason: slot.breakReason,
        })
      } else {
        // Add all lessons for this teaching week
        const weekRows = rows.filter(r => r.week === (rowIndex + 1))
        if (weekRows.length > 0) {
          weekRows.forEach(wr => allRows.push({ ...wr, week: slot.week }))
        } else {
          // fallback — use sequential rows
          for (let l = 1; l <= effectiveLessonsPerWeek; l++) {
            const idx = rowIndex * effectiveLessonsPerWeek + (l - 1)
            if (rows[idx]) allRows.push({ ...rows[idx], week: slot.week })
          }
        }
        rowIndex++
      }
    }

    if (!saveToDb) return NextResponse.json({ rows: allRows, totalLessons: rows.length })

    // ── Save to database ───────────────────────────────────────────────────
    const schemeTitle = title || `${subject} — ${grade} — ${term}`

    const scheme = await prisma.schemeOfWork.create({
      data: {
        title:     schemeTitle,
        subject,
        grade,
        term,
        content:   JSON.stringify(allRows),
        duration:  weeksCount,
        teacherId: teacher.id,
        schoolId:  teacher.schoolId || undefined,
        objectives: rows.slice(0, 5).map(r => r.specificLearningOutcomes).join('; '),
      },
    })

    // Save only teaching rows as SchemeTopic records
    const teachingRows = allRows.filter(r => r.type !== 'break')
    await prisma.schemeTopic.createMany({
      data: teachingRows.map(row => ({
        title:          `W${row.week} L${row.lesson}: ${row.subStrand}`,
        description:    row.specificLearningOutcomes,
        weekNumber:     row.week,
        lessonNumber:   row.lesson,
        objectives:     [row.specificLearningOutcomes],
        activities:     row.learningExperiences,
        resources:      row.learningResources,
        assessment:     row.assessment,
        duration:       row.durationMinutes || 40,
        schemeOfWorkId: scheme.id,
      })),
    })

    return NextResponse.json({
      scheme: { id: scheme.id, title: scheme.title, subject: scheme.subject, grade: scheme.grade, term: scheme.term },
      rows: allRows,
      totalLessons: teachingRows.length,
    })
})
