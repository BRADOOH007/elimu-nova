/**
 * POST /api/ai/generate-scheme-structured
 *
 * Generates a CBC-compliant scheme of work in KICD table format.
 * BULLETPROOF DESIGN — never returns 500:
 *   1. Multi-provider waterfall with 3 retries each (Cerebras → DeepSeek → Groq)
 *   2. Chunked generation (up to 3 weeks per chunk) for reliability
 *   3. Intelligent JSON repair (truncation, fixups, partial extraction)
 *   4. Deterministic template-based fallback — if ALL AI fails, code builds
 *      a complete, valid scheme from the selected topics.
 */
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { type AIMessage, callAI } from '@/lib/ai-provider'
import { buildKICDSchemePrompt, CBC_SUBJECT_LESSON_ALLOCATION } from '@/lib/cbc-context'
import { route } from '@/lib/api-middleware'
import { getCurriculumContext, buildCurriculumPromptSection, getDocumentExamples, buildDocumentExamplesSection } from '@/lib/curriculum-intelligence'

export interface KICDRow {
  week: number; lesson: number; strand: string; subStrand: string
  specificLearningOutcomes: string; keyInquiryQuestions: string[]
  learningExperiences: string[]; learningResources: string[]
  assessment: string; reflection: string; durationMinutes: number
  type?: 'lesson' | 'break' | 'revision' | 'exam'
  breakReason?: string
}

const TERM_BREAKS: Record<string, Array<{ afterWeek: number; reason: string }>> = {
  'Term 1': [{ afterWeek: 4, reason: 'Mid-Term Break (1 week)' }, { afterWeek: 10, reason: 'End of Term Examinations' }],
  'Term 2': [{ afterWeek: 4, reason: 'Mid-Term Break (1 week)' }, { afterWeek: 10, reason: 'End of Term Examinations' }],
  'Term 3': [{ afterWeek: 4, reason: 'Mid-Term Break (1 week)' }, { afterWeek: 8, reason: 'Revision Week' }, { afterWeek: 9, reason: 'End of Year Examinations' }],
}

// ── Timeline builder ─────────────────────────────────────────
function buildTimeline(weeksCount: number, term: string) {
  const breaks = TERM_BREAKS[term] || TERM_BREAKS['Term 1']
  const timeline: Array<{ week: number; isBreak: boolean; breakReason?: string }> = []
  let teachingWeek = 0
  for (let cal = 1; cal <= weeksCount + breaks.length; cal++) {
    const brk = breaks.find(b => b.afterWeek === teachingWeek)
    if (brk) {
      timeline.push({ week: cal, isBreak: true, breakReason: brk.reason })
    } else {
      teachingWeek++
      if (teachingWeek > weeksCount) break
      timeline.push({ week: cal, isBreak: false })
    }
  }
  return timeline
}

// ── JSON repair / extraction ──────────────────────────────────
function repairTruncatedJson(json: string): string {
  // Remove trailing garbage after a partial JSON value
  let s = json.trim()
  // Strip trailing incomplete strings/values
  const lastBrace = s.lastIndexOf('}')
  const lastBracket = s.lastIndexOf(']')
  const end = Math.max(lastBrace, lastBracket)
  if (end > 0) s = s.slice(0, end + 1)
  // If it's a JSON object wrapper, try to find inner array
  if (s.startsWith('{')) {
    const arrStart = s.indexOf('[')
    const arrEnd = s.lastIndexOf(']')
    if (arrStart !== -1 && arrEnd > arrStart) {
      s = s.slice(arrStart, arrEnd + 1)
    }
  }
  // Balance brackets — add missing closing brackets
  let depth = 0
  for (const ch of s) { if (ch === '[') depth++; if (ch === ']') depth-- }
  while (depth > 0) { s += ']'; depth-- }
  // Balance braces inside array
  let braceDepth = 0
  for (const ch of s) { if (ch === '{') braceDepth++; if (ch === '}') braceDepth-- }
  while (braceDepth > 0) { const idx = s.lastIndexOf('}'); s = s.slice(0, idx) + '}' }
  return s
}

function extractJsonArray(raw: string): any[] {
  let cleaned = raw
    .replace(/```json\s*/gi, '')
    .replace(/```\s*/g, '')
    .replace(/^[\s\S]*?(\[)/, '$1')  // strip text before first [
    .trim()
  cleaned = repairTruncatedJson(cleaned)
  const start = cleaned.indexOf('[')
  const end = cleaned.lastIndexOf(']')
  if (start !== -1 && end > start) {
    const cand = cleaned.slice(start, end + 1)
    try { const p = JSON.parse(cand); if (Array.isArray(p)) return p } catch {}
    // Try fixing common AI JSON mistakes
    try {
      const fixed = cand
        .replace(/,\s*}/g, '}').replace(/,\s*\]/g, ']')
        .replace(/([{,]\s*)(\w+)(\s*:)/g, '$1"$2"$3') // unquoted keys
        .replace(/:\s*'([^']*)'/g, ':"$1"') // single quotes
      const p = JSON.parse(fixed); if (Array.isArray(p)) return p
    } catch {}
  }
  // Try object wrapper
  const objMatch = cleaned.match(/\{[\s\S]*\}/)
  if (objMatch) {
    try {
      const obj = JSON.parse(objMatch[0])
      for (const k of Object.keys(obj)) {
        if (Array.isArray(obj[k])) return obj[k]
      }
    } catch {}
    try {
      const fixed = repairTruncatedJson(objMatch[0])
      const obj = JSON.parse(fixed)
      for (const k of Object.keys(obj)) {
        if (Array.isArray(obj[k])) return obj[k]
      }
    } catch {}
  }
  throw new Error('No JSON array recoverable from AI response')
}

function normaliseRow(r: any, week: number, lesson: number): KICDRow {
  const slo = r.specificLearningOutcomes || r.objectives || r.outcomes || ''
  return {
    week, lesson,
    strand: r.strand || r.Strand || '',
    subStrand: r.subStrand || r.SubStrand || r['sub-strand'] || r['Sub-Strand'] || '',
    specificLearningOutcomes: slo || `By the end of the lesson, the learner should be able to understand key concepts in this topic.`,
    keyInquiryQuestions: Array.isArray(r.keyInquiryQuestions) ? r.keyInquiryQuestions : (r.keyInquiryQuestions ? [String(r.keyInquiryQuestions)] : ['What have I learned today?']),
    learningExperiences: Array.isArray(r.learningExperiences) ? r.learningExperiences : (r.learningExperiences ? [String(r.learningExperiences)] : ['Learners participate in guided discovery activities', 'Learners work in groups on tasks', 'Learners share and discuss findings']),
    learningResources: Array.isArray(r.learningResources) ? r.learningResources : (r.learningResources ? [String(r.learningResources)] : ['Textbook', 'Chalkboard', 'Charts and diagrams']),
    assessment: r.assessment || 'Oral questions, observation, review of written work',
    reflection: r.reflection || '',
    durationMinutes: r.durationMinutes || r.duration || 40,
    type: 'lesson',
  }
}

// ── Deterministic fallback: builds a complete scheme from selected topics ──
function buildFallbackScheme(topics: Array<{ strand: string; subStrand: string }>, weeksCount: number, lessonsPerWeek: number): KICDRow[] {
  const rows: KICDRow[] = []
  let topicIdx = 0
  for (let w = 1; w <= weeksCount; w++) {
    for (let l = 1; l <= lessonsPerWeek; l++) {
      const idx = (w - 1) * lessonsPerWeek + (l - 1)
      const t = topics[idx % topics.length] || topics[topicIdx++ % topics.length] || { strand: 'Topic', subStrand: 'Subtopic' }
      const activityTypes = ['Lecture/discussion', 'Group work and collaborative learning', 'Hands-on practical activity', 'Individual practice and exercises', 'Question and answer session']
      const resources = ['Textbook and exercise books', 'Chalkboard or whiteboard', 'Charts, diagrams or models', 'Digital learning resources', 'Local materials and realia']
      const questions = [
        'What do you already know about this topic?',
        'How does this concept apply to everyday life?',
        'Can you explain this to a friend?',
        'What challenges did you encounter?',
        'How can we solve this problem differently?',
      ]
      rows.push({
        week: w, lesson: l,
        strand: t.strand,
        subStrand: t.subStrand,
        specificLearningOutcomes: `By the end of the lesson, the learner should be able to describe and explain key concepts in ${t.subStrand} with at least 70% accuracy.`,
        keyInquiryQuestions: [questions[idx % questions.length], questions[(idx + 1) % questions.length]],
        learningExperiences: [
          activityTypes[idx % activityTypes.length],
          activityTypes[(idx + 1) % activityTypes.length],
          activityTypes[(idx + 2) % activityTypes.length],
        ],
        learningResources: [resources[idx % resources.length], resources[(idx + 1) % resources.length]],
        assessment: `Review learners' ability to explain ${t.subStrand}. Use oral questions, classwork, and observation.`,
        reflection: '',
        durationMinutes: 40,
        type: 'lesson',
      })
    }
  }
  return rows
}

// ── AI provider waterfall with retries ────────────────────────
const PROVIDERS = [
  {
    name: 'Cerebras',
    call: async (sys: string, usr: string) => {
      const r = await callAI({ messages: [{ role: 'system', content: sys }, { role: 'user', content: usr }], maxTokens: 4096, temperature: 0.2, cerebrasModel: 'llama3.1-8b' })
      return r.content
    },
  },
  {
    name: 'DeepSeek',
    call: async (sys: string, usr: string) => {
      const r = await callAI({ messages: [{ role: 'system', content: sys }, { role: 'user', content: usr }], maxTokens: 4096, temperature: 0.2 })
      return r.content
    },
  },
  {
    name: 'Groq',
    call: async (sys: string, usr: string) => {
      const r = await callAI({ messages: [{ role: 'system', content: sys }, { role: 'user', content: usr }], maxTokens: 4096, temperature: 0.2, groqModel: 'llama-3.3-70b' })
      return r.content
    },
  },
]

async function generateAIChunk(systemPrompt: string, userPrompt: string): Promise<KICDRow[]> {
  let lastErr = ''
  for (const provider of PROVIDERS) {
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        console.log(`[SCHEME] 📡 ${provider.name} attempt ${attempt}…`)
        const raw = await provider.call(systemPrompt, userPrompt)
        console.log(`[SCHEME] ${provider.name} response (first 150):`, raw.slice(0, 150))
        const parsed = extractJsonArray(raw)
        if (parsed.length > 0) {
          console.log(`[SCHEME] ✅ ${provider.name} returned ${parsed.length} rows`)
          return parsed
        }
        lastErr = `Empty array from ${provider.name}`
      } catch (e: any) {
        lastErr = `${provider.name} #${attempt}: ${e.message}`
        console.warn(`[SCHEME] ❌ ${lastErr}`)
        if (attempt < 3) await new Promise(r => setTimeout(r, 1500 * attempt))
      }
    }
  }
  throw new Error(`All providers exhausted. Last: ${lastErr}`)
}

// ── Main handler ──────────────────────────────────────────────
export const POST = route({ auth: 'TEACHER' }, async (request, { user }) => {
    const teacher = await prisma.teacher.findUnique({ where: { userId: user.id } })
    if (!teacher) return NextResponse.json({ error: 'Teacher not found' }, { status: 404 })

    const {
      title, subject, grade, term = 'Term 1', weeksCount = 13, lessonsPerWeek = 5,
      selectedTopics = [], saveToDb = true, documentContext,
    } = await request.json()

    if (!subject || !grade) {
      return NextResponse.json({ error: 'subject and grade are required' }, { status: 400 })
    }

    const effectiveLpw = CBC_SUBJECT_LESSON_ALLOCATION[subject] || lessonsPerWeek
    const totalLessons = weeksCount * effectiveLpw

    // Normalize topics — ensure we have at least one
    let topics: Array<{ strand: string; subStrand: string }> = Array.isArray(selectedTopics) ? selectedTopics : []
    if (topics.length === 0) {
      topics = [{ strand: 'General', subStrand: subject }]
    }

    // Fetch teacher's saved template
    let templateText = documentContext
    if (!templateText) {
      const t = await prisma.teacher.findUnique({ where: { userId: user.id }, select: { schemeOfWorkTemplate: true } })
      templateText = t?.schemeOfWorkTemplate || null
    }
    const templateBlock = templateText
      ? `\n\nReference document (use this format/style):\n${templateText.slice(0, 5000)}\n---\n`
      : ''

    const kicdCtx = buildKICDSchemePrompt(grade, subject)

    // Fetch curriculum intelligence — official outcomes + teacher examples
    const curriculumCtx = await getCurriculumContext(grade, subject)
    const curriculumSection = curriculumCtx ? buildCurriculumPromptSection(curriculumCtx) : ''
    const docExamples = await getDocumentExamples(grade, subject, 'scheme_of_work', 3)
    const examplesSection = buildDocumentExamplesSection(docExamples)

    const topicsStr = topics.map(t => `- ${t.strand} → ${t.subStrand}`).join('\n')

    // ── Try AI generation (chunked for large schemes) ──────────
    let aiRows: KICDRow[] = []
    let usedFallback = false

    const CHUNK_SIZE = 3 // generate 3 teaching weeks at a time

    if (weeksCount <= CHUNK_SIZE) {
      // Small scheme — single call
      try {
        const systemPrompt = `You are a Kenyan CBC/CBE education expert creating official KICD schemes of work.${templateBlock}${kicdCtx}
${curriculumSection}
${examplesSection}
Return ONLY a raw JSON array. First char [ last char ]. No markdown. No explanation.
Each object: {"week":<1-${weeksCount}>,"lesson":<1-${effectiveLpw}>,"strand":"...","subStrand":"...","specificLearningOutcomes":"By the end of the lesson, the learner should be able to...","keyInquiryQuestions":["...","..."],"learningExperiences":["...","...","..."],"learningResources":["...","..."],"assessment":"...","reflection":"","durationMinutes":40}
CBC-aligned. Kenya-specific examples. ${grade} ${subject}. Distribute topics: ${topicsStr} across ${weeksCount} weeks. Exactly ${effectiveLpw} lessons per week. Return exactly ${totalLessons} objects.`
        const userPrompt = `${weeksCount}-week ${subject} scheme ${grade} ${term}. ${effectiveLpw} lessons/week. Total: ${totalLessons} lessons.\nTopics:\n${topicsStr}`
        const raw = await generateAIChunk(systemPrompt, userPrompt)
        aiRows = raw.map((r, i) => normaliseRow(r, Math.floor(i / effectiveLpw) + 1, (i % effectiveLpw) + 1))
      } catch (e: any) {
        console.warn('[SCHEME] AI generation failed:', e.message)
      }
    } else {
      // Large scheme — generate in chunks
      const topicChunks: Array<Array<{ strand: string; subStrand: string }>> = []
      const perChunk = Math.floor(weeksCount / Math.ceil(weeksCount / CHUNK_SIZE))
      for (let i = 0; i < weeksCount; i += perChunk) {
        const chunkWeeks = Math.min(perChunk, weeksCount - i)
        const chunkTopics: Array<{ strand: string; subStrand: string }> = []
        for (let j = 0; j < chunkWeeks; j++) {
          const idx = (i + j) % topics.length
          chunkTopics.push(topics[idx])
        }
        topicChunks.push(chunkTopics)
      }

      for (let ci = 0; ci < topicChunks.length; ci++) {
        const chunkTopics = topicChunks[ci]
        const chunkWeeks = chunkTopics.length
        const startWeek = Math.floor(weeksCount * ci / topicChunks.length) + 1
        const chunkLessons = chunkWeeks * effectiveLpw
        const chunkTopicsStr = chunkTopics.map(t => `- ${t.strand} → ${t.subStrand}`).join('\n')

        try {
          const systemPrompt = `You are a Kenyan CBC/CBE education expert creating official KICD schemes of work.${kicdCtx}
${curriculumSection}
${examplesSection}
Return ONLY a raw JSON array. First char [ last char ]. No markdown. No explanation.
Each object: {"week":<${startWeek}-${startWeek + chunkWeeks - 1}>,"lesson":<1-${effectiveLpw}>,"strand":"...","subStrand":"...","specificLearningOutcomes":"By the end of the lesson, the learner should be able to...","keyInquiryQuestions":["...","..."],"learningExperiences":["...","...","..."],"learningResources":["...","..."],"assessment":"...","reflection":"","durationMinutes":40}
CBC-aligned. Kenya-specific. ${grade} ${subject}. Topics: ${chunkTopicsStr}. ${chunkWeeks} weeks × ${effectiveLpw} lessons = ${chunkLessons} rows.`
          const userPrompt = `Weeks ${startWeek}-${startWeek + chunkWeeks - 1} of ${subject} ${grade} ${term}. ${effectiveLpw} lessons/week.\nTopics:\n${chunkTopicsStr}`
          const raw = await generateAIChunk(systemPrompt, userPrompt)
          const chunkRows = raw.map((r, i) => normaliseRow(r, Math.floor(i / effectiveLpw) + startWeek, (i % effectiveLpw) + 1))
          aiRows.push(...chunkRows)
          console.log(`[SCHEME] Chunk ${ci + 1}/${topicChunks.length}: ${chunkRows.length} rows`)
        } catch (e: any) {
          console.warn(`[SCHEME] Chunk ${ci + 1} failed:`, e.message)
          // Generate fallback rows for this chunk
          const fallback = buildFallbackScheme(chunkTopics, chunkWeeks, effectiveLpw).map(r => ({ ...r, week: r.week + startWeek - 1 }))
          aiRows.push(...fallback)
          console.log(`[SCHEME] 🔧 Fallback chunk ${ci + 1}: ${fallback.length} rows`)
        }
      }
    }

    // Sort and deduplicate
    aiRows.sort((a, b) => a.week - b.week || a.lesson - b.lesson)
    const seen = new Set<string>()
    aiRows = aiRows.filter(r => { const k = `${r.week}|${r.lesson}`; if (seen.has(k)) return false; seen.add(k); return true })

    // Ensure all weeks/lessons covered
    const covered = new Set<string>()
    aiRows.forEach(r => covered.add(`${r.week}|${r.lesson}`))

    // ── Fallback for missing or all-failed ────────────────────
    if (aiRows.length < totalLessons * 0.5) {
      // AI got less than half the needed rows — use full fallback
      console.log(`[SCHEME] ⚠️ AI only produced ${aiRows.length}/${totalLessons} rows — using deterministic fallback for reliability.`)
      aiRows = buildFallbackScheme(topics, weeksCount, effectiveLpw)
      usedFallback = true
    }

    // Fill any missing slot
    for (let w = 1; w <= weeksCount; w++) {
      for (let l = 1; l <= effectiveLpw; l++) {
        const key = `${w}|${l}`
        if (!covered.has(key)) {
          const t = topics[(w * effectiveLpw + l) % topics.length]
          aiRows.push(normaliseRow({}, w, l))
          const last = aiRows[aiRows.length - 1]
          last.strand = t.strand
          last.subStrand = t.subStrand
        }
      }
    }

    // Sort final and limit to totalLessons
    aiRows.sort((a, b) => a.week - b.week || a.lesson - b.lesson)
    aiRows = aiRows.slice(0, totalLessons)

    // ── Insert break rows into timeline ───────────────────────
    const timeline = buildTimeline(weeksCount, term)
    const allRows: KICDRow[] = []
    let teachingIdx = 0
    for (const slot of timeline) {
      if (slot.isBreak) {
        allRows.push({
          week: slot.week, lesson: 0, strand: '', subStrand: '',
          specificLearningOutcomes: slot.breakReason || 'Break',
          keyInquiryQuestions: [], learningExperiences: [], learningResources: [],
          assessment: '', reflection: '', durationMinutes: 0,
          type: 'break', breakReason: slot.breakReason,
        })
      } else {
        const weekRows = aiRows.filter(r => r.week === (teachingIdx + 1))
        weekRows.forEach(wr => allRows.push({ ...wr, week: slot.week }))
        teachingIdx++
      }
    }

    if (!saveToDb) return NextResponse.json({ rows: allRows, totalLessons: aiRows.length, usedFallback })

    // ── Save to database ──────────────────────────────────────
    const schemeTitle = title || `${subject} — ${grade} — ${term}`
    const scheme = await prisma.schemeOfWork.create({
      data: {
        title: schemeTitle, subject, grade, term,
        content: JSON.stringify(allRows),
        duration: weeksCount,
        teacherId: teacher.id,
        schoolId: teacher.schoolId || undefined,
        objectives: aiRows.slice(0, 5).map(r => r.specificLearningOutcomes).join('; '),
      },
    })

    const teachingRows = allRows.filter(r => r.type !== 'break')
    await prisma.schemeTopic.createMany({
      data: teachingRows.map(row => ({
        title: `W${row.week} L${row.lesson}: ${row.subStrand}`,
        description: row.specificLearningOutcomes,
        weekNumber: row.week, lessonNumber: row.lesson,
        objectives: [row.specificLearningOutcomes],
        activities: row.learningExperiences,
        resources: row.learningResources,
        assessment: row.assessment,
        duration: row.durationMinutes || 40,
        schemeOfWorkId: scheme.id,
      })),
    })

    return NextResponse.json({
      scheme: { id: scheme.id, title: scheme.title, subject: scheme.subject, grade: scheme.grade, term: scheme.term },
      rows: allRows, totalLessons: teachingRows.length, usedFallback,
    })
})