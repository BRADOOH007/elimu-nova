import { getLearningAreasForTermAndGrade, seniorSecondaryCategories } from '@/data/grades1-9CurriculumByTerm'
import type { GradeLevel } from '@/types/curriculum'

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

// Multi-curriculum subject resolver
const USA_SUBJECTS: Record<string, string[]> = {
  'Grade 1': ['English Language Arts','Mathematics','Science','Social Studies','Art','Music','Physical Education'],
  'Grade 2': ['English Language Arts','Mathematics','Science','Social Studies','Art','Music','Physical Education'],
  'Grade 3': ['English Language Arts','Mathematics','Science','Social Studies','Art','Music','Physical Education'],
  'Grade 4': ['English Language Arts','Mathematics','Science','Social Studies','Art','Music','Physical Education'],
  'Grade 5': ['English Language Arts','Mathematics','Science','Social Studies','Art','Music','Physical Education'],
  'Grade 6': ['English Language Arts','Mathematics','Science','Social Studies','Art','Music','Physical Education'],
  'Grade 7': ['English Language Arts','Mathematics','Science','Social Studies','World Languages','Technology'],
  'Grade 8': ['English Language Arts','Mathematics','Science','Social Studies','World Languages','Technology'],
  'Grade 9': ['English Language Arts','Algebra','Biology','World History','World Languages','Technology'],
  'Grade 10': ['English Literature','Geometry','Chemistry','US History','World Languages','Computer Science'],
  'Grade 11': ['English Literature','Algebra II','Physics','US Government','World Languages','AP Electives'],
  'Grade 12': ['English Literature','Calculus','Advanced Science','Economics','World Languages','AP Electives'],
}

const UK_SUBJECTS: Record<string, string[]> = {
  'Year 1': ['English','Mathematics','Science','Computing','History','Geography','Art','Music','PE'],
  'Year 2': ['English','Mathematics','Science','Computing','History','Geography','Art','Music','PE'],
  'Year 3': ['English','Mathematics','Science','Computing','History','Geography','Art','Music','PE','Languages'],
  'Year 4': ['English','Mathematics','Science','Computing','History','Geography','Art','Music','PE','Languages'],
  'Year 5': ['English','Mathematics','Science','Computing','History','Geography','Art','Music','PE','Languages'],
  'Year 6': ['English','Mathematics','Science','Computing','History','Geography','Art','Music','PE','Languages'],
  'Year 7': ['English','Mathematics','Biology','Chemistry','Physics','History','Geography','Languages','Computing','Art','Music','PE'],
  'Year 8': ['English','Mathematics','Biology','Chemistry','Physics','History','Geography','Languages','Computing','Art','Music','PE'],
  'Year 9': ['English','Mathematics','Biology','Chemistry','Physics','History','Geography','Languages','Computing','Art','Music','PE'],
  'Year 10': ['English','Mathematics','Science (Double)', 'Option 1', 'Option 2', 'Option 3', 'PE'],
  'Year 11': ['English','Mathematics','Science (Double)', 'Option 1', 'Option 2', 'Option 3', 'PE'],
  'Year 12': ['A-Level Subject 1', 'A-Level Subject 2', 'A-Level Subject 3', 'A-Level Subject 4'],
  'Year 13': ['A-Level Subject 1', 'A-Level Subject 2', 'A-Level Subject 3', 'A-Level Subject 4'],
}

export function getSubjectsForCurriculum(curriculumId: string, grade?: string | null): string[] {
  if (!grade) return []

  // Map common-curriculum IDs to resolvers
  if (curriculumId === 'cbc' || !curriculumId) {
    return getKICDSubjectsForGrade(grade)
  }

  if (curriculumId === 'common-core' || curriculumId === 'us-common-core') {
    return USA_SUBJECTS[grade] || []
  }

  if (curriculumId === 'uk-national' || curriculumId === 'uk-curriculum' || curriculumId === 'cambridge') {
    // Map "Grade X" to "Year X" for UK
    const year = grade.replace('Grade ', 'Year ')
    return UK_SUBJECTS[year] || UK_SUBJECTS[grade] || []
  }

  // Fallback: try CBC
  return getKICDSubjectsForGrade(grade)
}
