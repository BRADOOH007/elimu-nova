/**
 * Student memory — lets the AI tutor "keep learning about each student".
 *
 * buildStudentContext(studentId)   → rich, per-student context string
 *                                    (grade, frequent subjects, mastery,
 *                                    difficulty, mistakes, streak, topics,
 *                                    stored memory) for tutor prompts.
 * extractAndStoreMemory(studentId) → fire-and-forget: asks the LLM to pull
 *                                    durable facts from the latest chat
 *                                    exchange and merges them into the
 *                                    student's persistent memory.
 */

import { prisma } from '@/lib/prisma'
import { OpenAIService } from '@/lib/openai-service'

export interface MemoryFact {
  id: string
  fact: string
  category: 'interest' | 'strength' | 'struggle' | 'goal' | 'preference' | 'info'
  source: string
  createdAt: string
  lastSeenAt: string
}

const FACT_CATEGORIES = ['interest', 'strength', 'struggle', 'goal', 'preference', 'info']
const MAX_FACTS = 25
const MAX_TOPICS = 6

function nowIso(): string {
  return new Date().toISOString()
}

function makeId(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
}

function parseFacts(value: unknown): MemoryFact[] {
  if (!Array.isArray(value)) return []
  return value.filter((f): f is MemoryFact => !!f && typeof (f as any).fact === 'string')
}

/**
 * Aggregate a student's learning activity into a formatted context block.
 * Called on every AI tutor chat so the model genuinely knows who it's
 * talking to: grade, favourite subjects, mastery, difficulty, mistakes.
 */
export async function buildStudentContext(studentId: string): Promise<string> {
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: {
      user: { select: { firstName: true, lastName: true } },
      class: { include: { teacher: { include: { user: true } } } },
      memory: true,
    },
  })

  if (!student) return ''

  const parts: string[] = []
  parts.push(`You are talking to ${student.user.firstName} ${student.user.lastName}.`)

  // Grade / class
  if (student.class) {
    const rawGrade = student.class.grade
    const gradeLabel = rawGrade
      ? (String(rawGrade).toLowerCase().startsWith('grade')
        ? ` (${rawGrade})`
        : ` (Grade ${rawGrade})`)
      : ''
    parts.push(`They are in ${student.class.name || 'a class'}${gradeLabel}.`)
  } else {
    parts.push('They are an independent learner (no school class assigned).')
  }

  const [studySessions, unitMasteries, latestProgress, tutorSessions, reviewSchedules] = await Promise.all([
    prisma.studySession.findMany({
      where: { studentId },
      orderBy: { createdAt: 'desc' },
      select: { subject: true, topic: true, duration: true, createdAt: true },
      take: 300,
    }).catch(() => []),
    prisma.unitMastery.findMany({
      where: { studentId },
      select: { subject: true, unitName: true, masteryScore: true, masteryLevel: true },
      take: 300,
    }).catch(() => []),
    prisma.studentProgress.findFirst({
      where: { studentId },
      orderBy: { updatedAt: 'desc' },
      select: {
        preferredDifficulty: true,
        commonMistakes: true,
        engagementProfile: true,
        streak: true,
        xp: true,
        totalQuestions: true,
        correctAnswers: true,
      },
    }).catch(() => null),
    prisma.aITutorSession.findMany({
      where: { studentId },
      orderBy: { createdAt: 'desc' },
      select: { subject: true, topic: true, question: true },
      take: 30,
    }).catch(() => []),
    prisma.reviewSchedule.findMany({
      where: { studentId, nextReviewAt: { lte: new Date() } },
      select: { subject: true, topic: true },
      take: 5,
    }).catch(() => []),
  ])

  // Frequently studied subjects (by study time, boosted by session count)
  const subjectStats: Record<string, { minutes: number; sessions: number; masterySum: number; masteryCount: number; mastered: number }> = {}
  const addSubject = (name: string) => {
    if (!name) return
    if (!subjectStats[name]) subjectStats[name] = { minutes: 0, sessions: 0, masterySum: 0, masteryCount: 0, mastered: 0 }
  }
  for (const s of studySessions) {
    addSubject(s.subject)
    subjectStats[s.subject].minutes += s.duration || 0
    subjectStats[s.subject].sessions++
  }
  for (const m of unitMasteries) {
    addSubject(m.subject)
    subjectStats[m.subject].masterySum += m.masteryScore
    subjectStats[m.subject].masteryCount++
    if (m.masteryLevel === 'MASTERED') subjectStats[m.subject].mastered++
  }
  // Assigned learning areas count as a mild signal
  for (const s of student.subjects) {
    addSubject(s)
    subjectStats[s].sessions += 1
  }

  const ranked = Object.entries(subjectStats)
    .map(([subject, d]) => ({
      subject,
      score: d.minutes + d.sessions * 10,
      minutes: d.minutes,
      sessions: d.sessions,
      mastery: d.masteryCount > 0 ? Math.round(d.masterySum / d.masteryCount) : null,
      mastered: d.mastered,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)

  if (ranked.length > 0) {
    const list = ranked.map(r => {
      const m = r.mastery != null ? ` (${r.mastery}% mastery${r.mastered > 0 ? `, ${r.mastered} mastered` : ''})` : ''
      return `${r.subject}${m}`
    }).join(', ')
    parts.push(`Frequently studies: ${list}.`)
  }

  // Recent topics across study + tutor sessions
  const recentTopics = [...new Set([
    ...studySessions.map(s => s.topic).filter(Boolean),
    ...tutorSessions.map(t => t.topic).filter(Boolean),
  ] as string[])].slice(0, MAX_TOPICS)
  if (recentTopics.length > 0) {
    parts.push(`Recently working on: ${recentTopics.join(', ')}.`)
  }

  // Mastery / progress profile
  if (latestProgress) {
    const p = latestProgress
    const acc = p.totalQuestions > 0 ? Math.round((p.correctAnswers / p.totalQuestions) * 100) : null
    const profileBits: string[] = []
    if (p.preferredDifficulty && p.preferredDifficulty !== 'medium') {
      profileBits.push(`prefers ${p.preferredDifficulty} difficulty`)
    }
    if (acc != null) profileBits.push(`${acc}% accuracy`)
    if (p.streak > 0) profileBits.push(`${p.streak}-day streak`)
    if (profileBits.length > 0) parts.push(`Learning profile: ${profileBits.join(', ')}.`)

    const mistakes = Array.isArray(p.commonMistakes) ? p.commonMistakes : []
    if (mistakes.length > 0) {
      const m = mistakes.slice(0, 4).map((x: any) => (typeof x === 'string' ? x : x?.mistake || x?.pattern)).filter(Boolean)
      if (m.length > 0) parts.push(`Common mistakes to watch for: ${m.join('; ')}.`)
    }
    if (p.engagementProfile) {
      try {
        const e = p.engagementProfile as any
        const likes = Array.isArray(e) ? e : [e]
        const bits = likes.map((x: any) => (typeof x === 'string' ? x : x?.style || x?.preference)).filter(Boolean)
        if (bits.length > 0) parts.push(`Engagement style: ${bits.join(', ')}.`)
      } catch { /* non-critical */ }
    }
  }

  // Review queue
  if (reviewSchedules.length > 0) {
    parts.push(`Due for review now: ${reviewSchedules.map(r => r.topic || r.subject).join(', ')}.`)
  }

  // Persistent AI memory (what the tutor has learned about them)
  if (student.memory) {
    const facts = parseFacts(student.memory.facts)
    if (student.memory.summary) {
      parts.push(`What you know about them so far: ${student.memory.summary}`)
    }
    if (facts.length > 0) {
      const grouped = FACT_CATEGORIES.filter(c => facts.some(f => f.category === c))
        .map(c => `${c}s: ${facts.filter(f => f.category === c).map(f => f.fact).join('; ')}`)
      parts.push(`Student memory: ${grouped.join('. ')}.`)
    }
  }

  parts.push(`Use the student's name naturally. Adapt explanations to their grade level. Reference their frequent subjects and recent topics. Build on what you know about them — be personal and encouraging.`)

  return parts.join('\n')
}

/**
 * Ask the LLM to extract durable facts about the student from the latest
 * chat exchange, merge them into the stored memory, and refresh the summary.
 * Called fire-and-forget after a tutor response so it never blocks the chat.
 */
export async function extractAndStoreMemory(
  studentId: string,
  input: { userMessage: string; aiResponse: string; subject?: string; topic?: string }
): Promise<void> {
  try {
    const existing = await prisma.studentMemory.findUnique({ where: { studentId } })
    const facts = parseFacts(existing?.facts)
    const currentSummary = existing?.summary || ''

    const prompt = `You maintain a learner profile for an AI tutor. Read the latest chat exchange and the student's existing profile, then update it.

EXISTING PROFILE SUMMARY:
${currentSummary || '(none yet)'}

EXISTING FACTS:
${facts.length > 0 ? facts.map(f => `- [${f.category}] ${f.fact}`).join('\n') : '(none yet)'}

LATEST EXCHANGE:
Student said: ${(input.userMessage || '').slice(0, 800)}
Tutor replied: ${(input.aiResponse || '').slice(0, 1200)}
${input.subject ? `Context: subject "${input.subject}"${input.topic ? `, topic "${input.topic}"` : ''}.` : ''}

Extract up to 3 NEW durable facts not already covered. Facts must be:
- About the student personally (interests, strengths, struggles, goals, study preferences, topics/subjects they love or dislike).
- Specific, concise (max 15 words each), and stable over time (NOT one-off questions like "what is 2+2?").
- Skip trivial exchanges (greetings, single answers, or questions with no personal signal) — return an empty newFacts list.
Category must be one of: interest, strength, struggle, goal, preference, info.

Return ONLY valid JSON in this exact shape (no markdown, no extra text):
{"summary": "<updated 1-2 sentence profile of this learner>", "newFacts": [{"fact": "...", "category": "..."}]}`

    const raw = await OpenAIService.generateText(
      [{ role: 'user', content: prompt }],
      { maxTokens: 500, temperature: 0.2 }
    )

    const parsed = parseExtraction(raw)
    if (!parsed) return

    const now = nowIso()
    const merged: MemoryFact[] = [...facts]
    let summary = currentSummary

    for (const nf of (parsed.newFacts || [])) {
      const fact = (nf.fact || '').trim()
      const category = (FACT_CATEGORIES.includes(nf.category) ? nf.category : 'info') as MemoryFact['category']
      if (!fact) continue
      const key = fact.toLowerCase()
      const dup = merged.find(f => f.fact.toLowerCase() === key)
      if (dup) {
        dup.lastSeenAt = now
        dup.category = category
      } else {
        merged.push({
          id: makeId(),
          fact,
          category,
          source: 'ai_tutor_chat',
          createdAt: now,
          lastSeenAt: now,
        })
      }
    }

    if (typeof parsed.summary === 'string' && parsed.summary.trim()) summary = parsed.summary.trim()

    const trimmed = merged.slice(-MAX_FACTS)
    if (existing) {
      await prisma.studentMemory.update({
        where: { id: existing.id },
        data: { summary, facts: trimmed as any },
      })
    } else {
      await prisma.studentMemory.create({
        data: { studentId, summary, facts: trimmed as any },
      })
    }
  } catch (e) {
    console.error('[StudentMemory] extraction failed:', e)
  }
}

function parseExtraction(raw: string): { summary?: string; newFacts?: Array<{ fact: string; category: string }> } | null {
  try {
    let text = raw.trim()
    const fence = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/)
    if (fence) text = fence[1].trim()
    const jsonStart = text.indexOf('{')
    const jsonEnd = text.lastIndexOf('}')
    if (jsonStart >= 0 && jsonEnd > jsonStart) {
      text = text.slice(jsonStart, jsonEnd + 1)
    }
    return JSON.parse(text)
  } catch (e) {
    console.error('[StudentMemory] could not parse extraction:', e)
    return null
  }
}
