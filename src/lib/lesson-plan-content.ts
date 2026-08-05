/**
 * Lesson plan content normalization helpers.
 *
 * Lesson plans are saved as structured JSON (a JSON *string* in the DB).
 * These helpers turn any stored shape into a plain object and let the
 * various renderers (View / Edit / PDF / Word) decide how to draw it.
 * Kept dependency-free so it works on both the client and server.
 */

export function parseLessonContent(content: any): any {
  if (content == null) return null
  if (typeof content === 'string') {
    const trimmed = content.trim()
    if (trimmed === '') return null
    try {
      const parsed = JSON.parse(trimmed)
      return parsed && typeof parsed === 'object' ? parsed : null
    } catch {
      // Not JSON — treat as a plain markdown string (legacy/generatedContent)
      return { generatedContent: content }
    }
  }
  if (typeof content === 'object') return content
  return null
}

/** Term-plan shape: { title?, weeks: [{ weekNumber, theme?, lessons: [...] }] } */
export function isTermPlan(content: any): boolean {
  const c = parseLessonContent(content)
  return !!c && typeof c === 'object' && Array.isArray(c.weeks)
}

/** KICD 11-section / legacy structured lesson object (as opposed to a markdown string). */
export function hasStructuredLesson(content: any): boolean {
  const c = parseLessonContent(content)
  if (!c || typeof c !== 'object') return false
  if (Array.isArray(c.weeks)) return false
  if (typeof c.generatedContent === 'string') return false
  if (typeof c.content === 'string') return false
  return !!(
    c.strand || c.subStrand || c.lessonHeader ||
    c.specificLearningOutcomes || c.keyInquiryQuestions ||
    c.organisationOfLearning || c.learningResources ||
    c.assessment || c.introduction || c.mainActivity
  )
}

/** Extracts a raw markdown string from legacy content wrappers, if any. */
export function extractMarkdownContent(content: any): string | null {
  const c = parseLessonContent(content)
  if (!c || typeof c !== 'object') return null
  if (typeof c.generatedContent === 'string') return c.generatedContent
  if (typeof c.content === 'string') return c.content
  if (typeof c.description === 'string') return c.description
  return null
}

// Kiswahili-generated plans use Swahili keys in lessonHeader and
// organisationOfLearning. Map them to the canonical English keys so all
// renderers (View / Edit / PDF / Word) draw them identically.
const HEADER_ALIASES: Record<string, string> = {
  shule: 'school',
  mwalimu: 'teacher',
  eneolamasomo: 'learningArea',
  eneolakujifunza: 'learningArea',
  somo: 'lesson',
  darasa: 'grade',
  roboduara: 'term',
  robdo: 'term',
  wiki: 'week',
  tarehe: 'date',
  muda: 'duration',
  waliojiandikisha: 'enrolment',
}

const ORG_STEP_ALIASES: Record<string, string> = {
  utangulizi: 'introduction',
  hatuaya1: 'step1',
  hatuaya2: 'step2',
  hatuaya3: 'step3',
  hatuaya4: 'step4',
  hatuaya5: 'step5',
  hatuaya6: 'step6',
  hitimisho: 'conclusion',
  hatimisho: 'conclusion',
  mwisho: 'conclusion',
}

/**
 * Normalizes a lesson object so every renderer sees the same canonical keys.
 * Returns a shallow-cloned object; never mutates the input.
 */
export function normalizeLessonContent(content: any): any {
  const c = parseLessonContent(content)
  if (!c || typeof c !== 'object' || Array.isArray(c)) return c

  if (c.lessonHeader && typeof c.lessonHeader === 'object') {
    const h: any = {}
    for (const [k, v] of Object.entries(c.lessonHeader)) {
      h[HEADER_ALIASES[k.toLowerCase()] || k] = v
    }
    c.lessonHeader = h
  }

  if (c.organisationOfLearning && typeof c.organisationOfLearning === 'object') {
    const o: any = {}
    for (const [k, v] of Object.entries(c.organisationOfLearning)) {
      o[ORG_STEP_ALIASES[k.toLowerCase()] || k] = v
    }
    c.organisationOfLearning = o
  }

  return c
}
