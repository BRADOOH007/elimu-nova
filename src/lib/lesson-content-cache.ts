import { prisma } from '@/lib/prisma'
import { normalizeText, similarityScore } from '@/lib/lesson-cache'

export interface LessonContentCacheHit {
  content: string
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
 * Look up cached lesson content (markdown) by subject/topic/grade.
 */
export async function lookupLessonContent(
  subject: string,
  topic: string,
  grade: string,
  curriculum?: string,
): Promise<LessonContentCacheHit | null> {
  const normSubject = normalizeText(subject)
  const normTopic = normalizeText(curriculumPrefixed(topic, curriculum))
  const normGrade = normalizeText(grade)

  // 1) Exact normalized match
  try {
    const row = await prisma.lessonContentCache.findUnique({
      where: { subject_topic_grade: { subject: normSubject, topic: normTopic, grade: normGrade } },
    })
    if (row) {
      await prisma.lessonContentCache.update({ where: { id: row.id }, data: { hits: { increment: 1 } } })
      return { content: row.content, id: row.id, matchedVia: 'exact' }
    }
  } catch { /* continue to fuzzy */ }

  // 2) Fuzzy scan — filter by curriculum prefix if present
  try {
    const rows = await prisma.lessonContentCache.findMany({
      where: { subject: normSubject, grade: normGrade },
      select: { id: true, topic: true, content: true },
    })
    let best: LessonContentCacheHit | null = null
    let bestScore = 0
    for (const row of rows) {
      // When curriculum is specified, only match topics with the same prefix (or no prefix for CBC)
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
      await prisma.lessonContentCache.update({ where: { id: best.id }, data: { hits: { increment: 1 } } })
      return best
    }
  } catch { /* best-effort */ }

  return null
}

/**
 * Save generated lesson content (markdown) to cache.
 */
export async function saveLessonContent(
  subject: string,
  topic: string,
  grade: string,
  content: string,
  curriculum?: string,
): Promise<void> {
  const normSubject = normalizeText(subject)
  const normTopic = normalizeText(curriculumPrefixed(topic, curriculum))
  const normGrade = normalizeText(grade)

  try {
    await prisma.lessonContentCache.upsert({
      where: { subject_topic_grade: { subject: normSubject, topic: normTopic, grade: normGrade } },
      create: { subject: normSubject, topic: normTopic, grade: normGrade, content },
      update: { content },
    })
  } catch (e) {
    console.warn('[LessonContentCache] Save failed:', e)
  }
}
