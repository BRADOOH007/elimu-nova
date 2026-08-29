import { getLearningAreasForTermAndGrade, seniorSecondaryCategories } from '@/data/grades1-9CurriculumByTerm'
import type { GradeLevel } from '@/types/curriculum'
import { CURRICULA } from '@/lib/curricula'

const PRE_PRIMARY_SUBJECTS = [
  'Language Activities', 'Mathematical Activities', 'Environmental Activities',
  'Psychomotor and Creative Activities', 'Religious Education Activities',
]

function normalizeSubjectKey(s: string): string {
  return s.toLowerCase().replace(/&/g, 'and').replace(/\./g, '').replace(/\s+/g, ' ').trim()
}

function dedupeSubjects(subjects: string[]): string[] {
  const map = new Map<string, string>()
  for (const s of subjects) {
    const key = normalizeSubjectKey(s)
    if (!map.has(key)) map.set(key, s)
  }
  return Array.from(map.values()).sort((a, b) => a.localeCompare(b))
}

export function getKICDSubjectsForGrade(grade?: string | null): string[] {
  // When no grade is selected yet (initial dropdown), return union of all CBC subjects
  // so the subject picker is not empty — teacher can pick subject first, then grade filters.
  if (!grade || !grade.trim()) {
    const all: string[] = []
    // PP
    all.push(...PRE_PRIMARY_SUBJECTS)
    // Grades 1-9 across all terms
    const basicGrades: GradeLevel[] = ['Grade 1','Grade 2','Grade 3','Grade 4','Grade 5','Grade 6','Grade 7','Grade 8','Grade 9']
    for (const g of basicGrades) {
      for (let term = 1; term <= 3; term++) {
        all.push(...getLearningAreasForTermAndGrade(term, g))
      }
    }
    // Senior secondary 10-12
    const senior = seniorSecondaryCategories['Core Subjects'] || []
    all.push(...senior)
    if (all.length > 0) return dedupeSubjects(all)
    // Fallback to CURRICULA flat list
    const cbc = CURRICULA.find(c => c.id === 'cbc')
    if (cbc) return dedupeSubjects([...cbc.subjects])
    return []
  }

  const normalized = grade.trim()

  if (normalized === 'PP1' || normalized === 'PP2') {
    return PRE_PRIMARY_SUBJECTS
  }

  // Senior secondary (Grade 10-12): core subjects common to all pathways.
  if (/^Grade 1[0-2]$/i.test(normalized)) {
    return [...(seniorSecondaryCategories['Core Subjects'] || [])]
  }

  // Grades 1-9: union learning areas across all three terms (dedupe).
  const seen: string[] = []
  for (let term = 1; term <= 3; term++) {
    seen.push(...getLearningAreasForTermAndGrade(term, normalized as GradeLevel))
  }
  if (seen.length > 0) return dedupeSubjects(seen)

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

  // Fallback to general/international curriculum — NEVER fall back to CBC Kenya
  const general = CURRICULA.find(c => c.id === 'general')
  if (general) return [...general.subjects]
  return ['Mathematics', 'English', 'Science', 'Social Studies']
}
