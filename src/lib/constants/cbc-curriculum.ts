export type CBCLevel = 'LOWER_PRIMARY' | 'UPPER_PRIMARY' | 'JUNIOR_SCHOOL' | 'SENIOR_SCHOOL'
export type SeniorPathway = 'STEM' | 'SOCIAL_SCIENCES' | 'ARTS_AND_SPORTS'

export interface SubjectConfig {
  coreSubjects: string[]
  maxTotalSubjects: number
  availableElectives?: Record<SeniorPathway, string[]>
}

export const CBC_RATIONALIZED_CURRICULUM: Record<CBCLevel, SubjectConfig> = {
  LOWER_PRIMARY: {
    maxTotalSubjects: 7,
    coreSubjects: [
      'English', 'Kiswahili / KSL', 'Mathematics', 'Indigenous Language',
      'Religious Education', 'Environmental Activities', 'Creative Activities',
    ],
  },
  UPPER_PRIMARY: {
    maxTotalSubjects: 8,
    coreSubjects: [
      'English', 'Kiswahili / KSL', 'Mathematics', 'Science & Technology',
      'Agriculture & Nutrition', 'Social Studies', 'Creative Arts', 'Religious Education',
    ],
  },
  JUNIOR_SCHOOL: {
    maxTotalSubjects: 9,
    coreSubjects: [
      'English', 'Kiswahili / KSL', 'Mathematics', 'Integrated Science',
      'Agriculture & Nutrition', 'Social Studies', 'Pre-Technical Studies',
      'Creative Arts & Sports', 'Religious Education',
    ],
  },
  SENIOR_SCHOOL: {
    maxTotalSubjects: 7,
    coreSubjects: [
      'English / Kiswahili / KSL', 'Mathematics', 'Community Service Learning', 'Physical Education',
    ],
    availableElectives: {
      STEM: ['Physics', 'Chemistry', 'Biology', 'Advanced Mathematics', 'Computer Studies', 'Agriculture'],
      SOCIAL_SCIENCES: ['History & Citizenship', 'Geography', 'Business Studies', 'Religious Education', 'Foreign Languages'],
      ARTS_AND_SPORTS: ['Sports & Health Science', 'Performing Arts', 'Visual Arts', 'Music'],
    },
  },
}

export function getCBCLevel(grade: string): CBCLevel {
  const n = parseInt(grade.replace(/\D/g, ''), 10)
  if (n >= 1 && n <= 3) return 'LOWER_PRIMARY'
  if (n >= 4 && n <= 6) return 'UPPER_PRIMARY'
  if (n >= 7 && n <= 9) return 'JUNIOR_SCHOOL'
  if (n >= 10 && n <= 12) return 'SENIOR_SCHOOL'
  return 'UPPER_PRIMARY'
}

export function getSubjectsForStudent(
  grade: string,
  selectedPathway?: SeniorPathway,
  chosenElectives: string[] = []
): string[] {
  const level = getCBCLevel(grade)
  const config = CBC_RATIONALIZED_CURRICULUM[level]

  if (level === 'SENIOR_SCHOOL') {
    const pathwayKey = selectedPathway || 'STEM'
    const validElectives = config.availableElectives?.[pathwayKey] || []
    const activeElectives = chosenElectives.length === 3 ? chosenElectives : validElectives.slice(0, 3)
    return [...config.coreSubjects, ...activeElectives]
  }

  return config.coreSubjects
}

export function getAllCBCSubjects(): string[] {
  const all = new Set<string>()
  for (const config of Object.values(CBC_RATIONALIZED_CURRICULUM)) {
    config.coreSubjects.forEach(s => all.add(s))
    if (config.availableElectives) {
      for (const electives of Object.values(config.availableElectives)) {
        electives.forEach(s => all.add(s))
      }
    }
  }
  return [...all]
}
