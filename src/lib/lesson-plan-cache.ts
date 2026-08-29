import type { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { normalizeText, similarityScore, normalizeKey } from '@/lib/lesson-cache'

export interface LessonPlanCacheHit {
  content: Prisma.JsonValue
  id: string
  matchedVia: 'exact' | 'fuzzy'
}

/**
 * Prefix the topic string with the curriculum to create a
 * curriculum-aware cache key without requiring a schema migration.
 * CBC topics are stored as-is for backward compatibility.
 */
function curriculumPrefixed(topic: string, curriculum?: string): string {
  if (!curriculum || curriculum === 'cbc') return topic
  return `${curriculum}:${topic}`
}

/**
 * Look up a cached lesson plan by subject/topic/grade/mode.
 * Tries exact normalized key first, then fuzzy scan.
 */
export async function lookupLessonPlan(
  subject: string,
  topic: string,
  grade: string,
  mode: string = 'single',
  curriculum?: string,
): Promise<LessonPlanCacheHit | null> {
  const normSubject = normalizeText(subject)
  const normTopic = normalizeText(curriculumPrefixed(topic, curriculum))
  const normGrade = normalizeText(grade)
  const normMode = mode === 'term' ? 'term' : 'single'

  // 1) Exact normalized match
  try {
    const row = await prisma.lessonPlanCache.findUnique({
      where: { subject_topic_grade_mode: { subject: normSubject, topic: normTopic, grade: normGrade, mode: normMode } },
    })
    if (row) {
      await prisma.lessonPlanCache.update({ where: { id: row.id }, data: { hits: { increment: 1 } } })
      return { content: row.content, id: row.id, matchedVia: 'exact' }
    }
  } catch { /* continue to fuzzy */ }

  // 2) Fuzzy scan — filter by curriculum prefix if present
  try {
    const rows = await prisma.lessonPlanCache.findMany({
      where: { subject: normSubject, grade: normGrade, mode: normMode },
      select: { id: true, topic: true, content: true },
    })
    let best: LessonPlanCacheHit | null = null
    let bestScore = 0
    for (const row of rows) {
      if (curriculum && curriculum !== 'cbc') {
        if (row.topic.includes(':') && !row.topic.startsWith(`${curriculum}:`)) continue
        if (!row.topic.includes(':') && curriculum !== 'cbc') continue
      }
      const score = similarityScore(normTopic, row.topic)
      if (score > bestScore) {
        bestScore = score
        best = { content: row.content, id: row.id, matchedVia: 'fuzzy' }
      }
    }
    if (best && bestScore >= 0.7) {
      await prisma.lessonPlanCache.update({ where: { id: best.id }, data: { hits: { increment: 1 } } })
      return best
    }
  } catch { /* best-effort */ }

  return null
}

/**
 * Save a generated lesson plan to cache.
 */
export async function saveLessonPlan(
  subject: string,
  topic: string,
  grade: string,
  mode: string,
  content: Prisma.InputJsonValue,
  curriculum?: string,
): Promise<void> {
  const normSubject = normalizeText(subject)
  const normTopic = normalizeText(curriculumPrefixed(topic, curriculum))
  const normGrade = normalizeText(grade)
  const normMode = mode === 'term' ? 'term' : 'single'

  try {
    await prisma.lessonPlanCache.upsert({
      where: { subject_topic_grade_mode: { subject: normSubject, topic: normTopic, grade: normGrade, mode: normMode } },
      create: { subject: normSubject, topic: normTopic, grade: normGrade, mode: normMode, content },
      update: { content },
    })
  } catch (e) {
    console.warn('[LessonPlanCache] Save failed:', e)
  }
}
