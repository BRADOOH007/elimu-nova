import { getLearningAreasForTermAndGrade, seniorSecondaryCategories } from '@/data/grades1-9CurriculumByTerm'
import type { GradeLevel } from '@/types/curriculum'
import { CURRICULA } from '@/lib/curricula'

const PRE_PRIMARY_SUBJECTS = [
  'Language Activities', 'Mathematical Activities', 'Environmental Activities',
  'Psychomotor and Creative Activities', 'Religious Education Activities',
]

export function getKICDSubjectsForGrade(grade?: string | null): string[] {
  if (!grade) return []

  const normalized = grade.trim()

  if (normalized === 'PP1' || normalized === 'PP2') {
    return PRE_PRIMARY_SUBJECTS
  }

  // Senior secondary (Grade 10-12): core subjects common to all pathways.
  if (/^Grade 1[0-2]$/i.test(normalized)) {
    return [...(seniorSecondaryCategories['Core Subjects'] || [])]
  }

  // Grades 1-9: union learning areas across all three terms (dedupe).
  const seen = new Set<string>()
  for (let term = 1; term <= 3; term++) {
    for (const area of getLearningAreasForTermAndGrade(term, normalized as GradeLevel)) {
      seen.add(area)
    }
  }
  if (seen.size > 0) return Array.from(seen)

  return []
}

// Multi-curriculum resolver — uses curricula.ts definitions for all non-CBC curricula
export function getSubjectsForCurriculum(curriculumId: string, _grade?: string | null): string[] {
  // CBC uses the deep KICD database for grade-specific subjects
  if (curriculumId === 'cbc' || !curriculumId) {
    return getKICDSubjectsForGrade(_grade)
  }

  // All other curricula: use the flat subjects array from curricula.ts
  const curriculum = CURRICULA.find(c => c.id === curriculumId)
  if (curriculum && curriculum.subjects.length > 0) {
    return [...curriculum.subjects]
  }

  // Fallback to CBC
  return getKICDSubjectsForGrade(_grade)
}
