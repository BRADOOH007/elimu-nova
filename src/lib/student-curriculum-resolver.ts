import { CURRICULA, getCurriculum, getCurriculaByCountry } from '@/lib/curricula'

/**
 * Resolve the effective curriculum for a student, making it country-aware:
 * never cascade to Kenya's CBC for a student outside Kenya. Country takes
 * precedence so a non-Kenyan student is never served CBC, even if the field
 * happens to be set to 'cbc'.
 *
 * Priority:
 *   1. A valid explicitly-saved non-CBC curriculum (e.g. a senior student's
 *      'ged-hiset', or anyone who chose 'common-core') is always honoured.
 *   2. Otherwise, a non-Kenyan country -> the first matching curriculum for that
 *      country (e.g. US -> common-core, GB -> cambridge), falling back to
 *      'general'. This keeps CBC from ever leaking to students outside Kenya,
 *      even if the curriculum field was left empty or accidentally set to 'cbc'.
 *   3. Kenya (or unknown country) falls back to CBC.
 */
export function resolveEffectiveCurriculum(
  country?: string | null,
  explicitCurriculum?: string | null
): string {
  const code = (country || '').trim().toUpperCase()

  // Honour a valid, explicitly-chosen non-CBC curriculum (e.g. senior GED).
  if (explicitCurriculum && getCurriculum(explicitCurriculum) && explicitCurriculum !== 'cbc') {
    return explicitCurriculum
  }

  // Outside Kenya -> never CBC. Use the country default (or 'general').
  if (code && code !== 'KE') {
    const countryDefault = getCurriculaByCountry(code)[0]
    if (countryDefault) return countryDefault.id
    const general = getCurriculum('general')
    if (general) return general.id
    return 'general'
  }

  // Kenya or unknown, no explicit curriculum (or explicit = cbc) -> CBC.
  return 'cbc'
}

/**
 * True if the student should be served Kenya's CBC. CBC is only valid when the
 * user is in Kenya (or their country is unknown / not yet set) and no other
 * curriculum was explicitly chosen.
 */
export function isCBCForStudent(
  country?: string | null,
  explicitCurriculum?: string | null
): boolean {
  return resolveEffectiveCurriculum(country, explicitCurriculum) === 'cbc'
}

/**
 * Advance a grade by a number of school years (calendar year rollovers).
 * Walks the curriculum's ordered grade list so non-sequential systems
 * (Form 1-4, Year 7-13, Class 1-12, PP1/PP2...) advance correctly, and clamps
 * at the final grade so the student never exceeds the curriculum.
 */
export function advanceGradeByYears(
  grade: string,
  yearsElapsed: number,
  gradeList: string[]
): string {
  const years = Math.max(0, Math.floor(yearsElapsed))
  if (years === 0 || !grade) return grade

  const list = gradeList.filter(Boolean)
  if (list.length > 0) {
    const idx = list.indexOf(grade)
    if (idx >= 0) {
      return list[Math.min(idx + years, list.length - 1)]
    }
  }

  // Fallback: numeric grade systems like 'Grade N' or 'Class N' / 'Form N'
  const match = grade.match(/(\d+)/)
  if (match) {
    const n = parseInt(match[1], 10) + years
    const prefix = grade.replace(/\d+/, '')
    return `${prefix}${n}`
  }

  return grade
}

/**
 * Compute the school year the student's base grade was assigned.
 * Prefers a saved `startYear`, else derives it from the preference row's
 * creation/update date so existing accounts behave sensibly.
 */
export function getGradeStartYear(createdAt?: string | Date | null, updatedAt?: string | Date | null): number {
  const d = createdAt || updatedAt || new Date()
  const year = new Date(d).getFullYear()
  return Number.isFinite(year) ? year : new Date().getFullYear()
}

/**
 * Compute how many calendar-year rollovers have occurred since the grade was set.
 * Each new calendar year on/after Jan 1 advances the grade one step.
 */
export function getYearsElapsedSince(startYear: number): number {
  const now = new Date().getFullYear()
  return Math.min(Math.max(0, now - startYear), 13)
}

/**
 * Resolve both the effective curriculum and the year-advanced grade for a
 * student in a single call.
 */
export function resolveStudentGradeAndCurriculum(opts: {
  grade?: string | null
  country?: string | null
  curriculum?: string | null
  createdAt?: string | Date | null
  updatedAt?: string | Date | null
  classGrade?: string | null
}): { grade: string; curriculum: string } {
  const curriculum = resolveEffectiveCurriculum(opts.country, opts.curriculum)

  const baseGrade = opts.grade
    || opts.classGrade
    || 'Grade 4'

  const curriculumDef = getCurriculum(curriculum)
  const gradeList = curriculumDef?.grades || []

  const startYear = getGradeStartYear(opts.createdAt, opts.updatedAt)
  const yearsElapsed = getYearsElapsedSince(startYear)

  return {
    grade: advanceGradeByYears(baseGrade, yearsElapsed, gradeList),
    curriculum,
  }
}

export { CURRICULA }
