import type { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'

/**
 * Intelligent lesson-cache matching.
 *
 * Layers:
 *  1. Normalization   — case, punctuation, stopwords, plurals folded to a canonical key.
 *  2. Curriculum      — free-form topic text is fuzzy-matched onto the official
 *                       curriculum strand/substrand names for the subject+grade, so
 *                       different phrasings of the same topic share one cache row.
 *  3. Fuzzy fallback  — a request that still misses is scored against existing rows
 *                       (token Jaccard + bigram overlap) and served if close enough.
 *
 * Every near-match records the requested phrasing as an alias so the next hit is exact.
 */

const STOP_WORDS = new Set([
  'a', 'an', 'the', 'of', 'and', 'to', 'in', 'on', 'for', 'with', 'about',
  'at', 'by', 'from', 'is', 'are', 'was', 'were', 'be', 'been', 'its', 'it',
  'that', 'this', 'their', 'there', 'which', 'what', 'when', 'where',
])

// App-level short subject names -> DB CBC subject names (mirrors learning-path)
const SUBJECT_ALIASES: Record<string, string[]> = {
  Mathematics: ['Mathematics Activities', 'Mathematics', 'Maths', 'Essential Mathematics'],
  English: ['English Activities', 'English Language Activities', 'English'],
  Kiswahili: ['Shughuli za Kiswahili', 'Kiswahili'],
  Science: ['Science & Technology Activities', 'Science and Technology Activities', 'Integrated Science Activities', 'Integrated Science', 'Science'],
  'Social Studies': ['Social Studies Activities', 'Social Studies'],
  CRE: ['C.R.E Activities', 'Christian Religious Education Activities', 'CRE Activities', 'Religious Activities', 'CRE'],
  Agriculture: ['Agriculture & Nutrition Activities', 'Agriculture and Nutrition Activities', 'Agriculture'],
  Physics: ['Physics'],
  Chemistry: ['Chemistry'],
  Biology: ['Biology'],
  History: ['History'],
  Geography: ['Geography'],
  'Business Studies': ['Business Studies'],
  'Computer Studies': ['Computer Studies', 'Pretechnical Studies Activities'],
}

/* ── Layer 1: normalization ─────────────────────────────────────────────── */

function singularize(word: string): string {
  if (word.length < 4) return word
  if (word.endsWith('ies') && word.length > 4) return word.slice(0, -3) + 'y'
  if (word.endsWith('sses')) return word.slice(0, -2)
  if (word.endsWith('ches') || word.endsWith('shes') || word.endsWith('xes')) return word.slice(0, -2)
  if (word.endsWith('es') && word.length > 4) return word.slice(0, -1)
  if (word.endsWith('s') && !word.endsWith('ss')) return word.slice(0, -1)
  return word
}

export function normalizeText(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')   // punctuation -> space
    .replace(/\b\d+(st|nd|rd|th)\b/g, m => m.replace(/\D/g, '')) // "3rd" -> "3"
    .split(/\s+/)
    .filter(Boolean)
    .filter(w => !STOP_WORDS.has(w))
    .map(singularize)
    .join(' ')
}

export function normalizeKey(subject: string, topic: string, grade: string): string {
  return [normalizeText(subject), normalizeText(topic), normalizeText(grade)].join('|')
}

/* ── similarity ─────────────────────────────────────────────────────────── */

function tokenSet(s: string): Set<string> {
  return new Set(s.split(/\s+/).filter(Boolean))
}

function bigrams(s: string): string[] {
  const g: string[] = []
  for (let i = 0; i < s.length - 1; i++) g.push(s.slice(i, i + 2))
  return g
}

/**
 * 0..1 similarity combining token Jaccard (60%) and bigram overlap (40%),
 * so both near-identical and mildly rephrased topics score well.
 */
export function similarityScore(a: string, b: string): number {
  const na = normalizeText(a)
  const nb = normalizeText(b)
  if (!na || !nb) return 0
  if (na === nb) return 1

  const setA = tokenSet(na)
  const setB = tokenSet(nb)
  let inter = 0
  for (const t of setA) if (setB.has(t)) inter++
  const union = setA.size + setB.size - inter
  const jaccard = union > 0 ? inter / union : 0

  const ba = bigrams(na.replace(/\s+/g, ' '))
  const bb = bigrams(nb.replace(/\s+/g, ' '))
  let bInter = 0
  const setBB = new Set(bb)
  for (const g of new Set(ba)) if (setBB.has(g)) bInter++
  const bScore = ba.length > 0 ? bInter / ba.length : 0

  return 0.6 * jaccard + 0.4 * bScore
}

/* ── Layer 2: curriculum canonical topics ───────────────────────────────── */

async function findCurriculumId(grade: string, subject: string): Promise<string | null> {
  const exact = await prisma.curriculum.findFirst({ where: { type: 'CBC', grade, subject, isActive: true }, select: { id: true } })
  if (exact) return exact.id

  const aliases = SUBJECT_ALIASES[subject] || []
  if (aliases.length > 0) {
    const viaAlias = await prisma.curriculum.findFirst({
      where: { type: 'CBC', grade, subject: { in: aliases }, isActive: true },
      select: { id: true },
    })
    if (viaAlias) return viaAlias.id
  }

  const fuzzy = await prisma.curriculum.findFirst({
    where: { type: 'CBC', grade, isActive: true, subject: { contains: subject } },
    select: { id: true },
  })
  return fuzzy?.id || null
}

/**
 * Fetch the official topic names (strands + substrands) for a subject+grade.
 * Returns a flat list of canonical phrases, longest first for best matching.
 */
async function getCurriculumTopicCandidates(grade: string, subject: string): Promise<string[]> {
  try {
    const curriculumId = await findCurriculumId(grade, subject)
    if (!curriculumId) return []

    const strands = await prisma.curriculumStrand.findMany({
      where: { curriculumId },
      select: { id: true, name: true },
    })
    if (strands.length === 0) return []

    const substrands = await prisma.curriculumSubstrand.findMany({
      where: { strandId: { in: strands.map(s => s.id) } },
      select: { name: true },
    })

    const names = new Set<string>()
    for (const s of strands) names.add(s.name)
    for (const ss of substrands) names.add(ss.name)
    return Array.from(names).sort((a, b) => b.length - a.length)
  } catch {
    return []
  }
}

/**
 * Resolve free-form topic text onto the closest official curriculum name.
 * Returns the canonical topic when a confident match exists, else null.
 */
export async function resolveCanonicalTopic(grade: string, subject: string, topic: string): Promise<string | null> {
  const candidates = await getCurriculumTopicCandidates(grade, subject)
  if (candidates.length === 0) return null

  const normTopic = normalizeText(topic)
  let best: { name: string; score: number } | null = null
  for (const name of candidates) {
    const score = similarityScore(normTopic, name)
    if (best === null || score > best.score) best = { name, score }
    if (score >= 0.95) break
  }
  if (!best || best.score < 0.5) return null
  return best.name
}

/* ── Layer 3: fuzzy fallback over existing cache rows ───────────────────── */

export interface LessonCacheHit {
  content: Prisma.JsonValue
  id: string
  topic: string
  subject: string
  grade: string
  matchedVia: 'exact' | 'canonical' | 'fuzzy'
  canonicalTopic?: string | null
}

/**
 * Full intelligent lookup for a lesson.
 * Priority: exact normalized key → canonical curriculum topic → fuzzy near-match.
 */
export async function intelligentCacheLookup(
  subject: string,
  topic: string,
  grade: string,
): Promise<LessonCacheHit | null> {
  const normSubject = normalizeText(subject)
  const normTopic = normalizeText(topic)
  const normGrade = normalizeText(grade)

  // 1) Exact normalized match (also matches previously learned aliases stored in topic field)
  const exact = await findRow(normSubject, normTopic, normGrade)
  if (exact) {
    await bumpHits(exact.id)
    return { ...exact, matchedVia: 'exact' }
  }

  // 2) Canonical curriculum topic: re-key the request and retry exact lookup
  let canonicalTopic: string | null = null
  try {
    canonicalTopic = await resolveCanonicalTopic(grade, subject, topic)
  } catch { /* curriculum lookup is best-effort */ }

  if (canonicalTopic && normalizeText(canonicalTopic) !== normTopic) {
    const canonicalRow = await findRow(normSubject, normalizeText(canonicalTopic), normGrade)
    if (canonicalRow) {
      await bumpHits(canonicalRow.id)
      await recordAlias(canonicalRow.id, normTopic)
      return { ...canonicalRow, matchedVia: 'canonical', canonicalTopic }
    }
  }

  // 3) Fuzzy scan of existing rows for this subject+grade
  const rows = await prisma.lessonCache.findMany({
    where: { subject: normSubject, grade: normGrade },
    select: { id: true, topic: true, subject: true, grade: true, content: true },
  })
  let best: LessonCacheHit | null = null
  let bestScore = 0
  for (const row of rows) {
    const score = similarityScore(normTopic, row.topic)
    if (score > bestScore) {
      bestScore = score
      best = {
        content: row.content,
        id: row.id,
        topic: row.topic,
        subject: row.subject,
        grade: row.grade,
        matchedVia: 'fuzzy',
        canonicalTopic: canonicalTopic || null,
      }
    }
  }
  if (best && bestScore >= 0.68) {
    await bumpHits(best.id)
    await recordAlias(best.id, normTopic)
    return best
  }

  return null
}

async function findRow(subject: string, topic: string, grade: string) {
  return prisma.lessonCache.findUnique({
    where: { subject_topic_grade: { subject, topic, grade } },
  })
}

async function bumpHits(id: string): Promise<void> {
  try {
    await prisma.lessonCache.update({ where: { id }, data: { hits: { increment: 1 } } })
  } catch { /* best-effort */ }
}

async function recordAlias(id: string, aliasTopic: string): Promise<void> {
  try {
    const row = await prisma.lessonCache.findUnique({ where: { id }, select: { aliases: true } })
    const aliases = row?.aliases || []
    if (!aliases.includes(aliasTopic)) {
      await prisma.lessonCache.update({
        where: { id },
        data: { aliases: { push: aliasTopic } },
      })
    }
  } catch { /* best-effort */ }
}

/**
 * Persist a freshly generated lesson under its canonical key when one can be
 * resolved, otherwise under the normalized request key. The requested topic is
 * recorded as an alias on the row so later identical requests hit exactly.
 */
export async function intelligentCacheSave(
  subject: string,
  topic: string,
  grade: string,
  content: Prisma.InputJsonValue,
): Promise<void> {
  const normSubject = normalizeText(subject)
  const normGrade = normalizeText(grade)
  const normTopic = normalizeText(topic)

  let canonicalTopic: string | null = null
  try {
    canonicalTopic = await resolveCanonicalTopic(grade, subject, topic)
  } catch { /* best-effort */ }

  const keyTopic = canonicalTopic ? normalizeText(canonicalTopic) : normTopic

  try {
    await prisma.lessonCache.upsert({
      where: { subject_topic_grade: { subject: normSubject, topic: keyTopic, grade: normGrade } },
      create: {
        subject: normSubject,
        topic: keyTopic,
        grade: normGrade,
        content,
        aliases: canonicalTopic ? [normTopic] : [],
      },
      update: { content },
    })
  } catch (e) {
    console.warn('[LessonCache] Save failed:', e)
  }
}
