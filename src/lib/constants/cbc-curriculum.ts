export type CBCLevel = 'LOWER_PRIMARY' | 'UPPER_PRIMARY' | 'JUNIOR_SCHOOL' | 'SENIOR_SCHOOL'
export type SeniorPathway = 'STEM' | 'TVET' | 'SOCIAL_SCIENCES' | 'ARTS_AND_SPORTS'

export interface SubjectConfig {
  coreSubjects: string[]
  maxTotalSubjects: number
  availableElectives?: Record<string, string[]>
}

export interface TVETSpecialization {
  id: string
  name: string
  coreModules: string[]
}

export const TVET_SPECIALIZATIONS: TVETSpecialization[] = [
  {
    id: 'electrical_electronics',
    name: 'Electrical & Electronics Crafts',
    coreModules: ['Electrical Wiring & Safety', 'Circuit Analysis', 'Solar Installation', 'Digital Electronics'],
  },
  {
    id: 'building_construction',
    name: 'Building & Construction Technology',
    coreModules: ['Technical Drawing & CAD', 'Carpentry & Joinery', 'Masonry & Concrete Work', 'Plumbing'],
  },
  {
    id: 'agri_tech',
    name: 'Agribusiness & Farm Machinery',
    coreModules: ['Soil Management', 'Crop Production Tech', 'Farm Machinery Operations', 'Livestock Husbandry'],
  },
  {
    id: 'ict_support',
    name: 'ICT Support & Networking',
    coreModules: ['Computer Hardware Maintenance', 'Network Fundamentals', 'Web Operations', 'Cyber Safety'],
  },
  {
    id: 'culinary_hospitality',
    name: 'Culinary Arts & Hospitality',
    coreModules: ['Food Safety & Hygiene', 'Commercial Cookery', 'Catering Management', 'Bakery Arts'],
  },
]

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
  if (isNaN(n)) return 'UPPER_PRIMARY'
  return 'UPPER_PRIMARY'
}

export const ALL_GRADES = ['Grade 1','Grade 2','Grade 3','Grade 4','Grade 5','Grade 6','Grade 7','Grade 8','Grade 9','Grade 10','Grade 11','Grade 12']

const VALID_PATHWAYS: SeniorPathway[] = ['STEM', 'TVET', 'SOCIAL_SCIENCES', 'ARTS_AND_SPORTS']

export function getSubjectsForStudent(
  grade?: string | null,
  selectedPathway?: SeniorPathway | string | null,
  chosenElectives?: string[] | null
): string[] {
  const safeGrade = grade || 'Grade 4'
  const level = getCBCLevel(safeGrade)
  const config = CBC_RATIONALIZED_CURRICULUM[level]
  const safeElectives = Array.isArray(chosenElectives) ? chosenElectives : []

  if (level !== 'SENIOR_SCHOOL') return config.coreSubjects

  const pathwayKey: SeniorPathway = VALID_PATHWAYS.includes(selectedPathway as SeniorPathway)
    ? (selectedPathway as SeniorPathway)
    : 'STEM'

  if (pathwayKey === 'TVET') {
    // TVET: 4 core subjects + 4 modules from selected TVET specialization
    const tvetModules = safeElectives.length > 0
      ? safeElectives
      : TVET_SPECIALIZATIONS[0].coreModules
    return [...config.coreSubjects, ...tvetModules]
  }

  const validElectives = config.availableElectives?.[pathwayKey] || []
  const activeElectives = safeElectives.length === 3 ? safeElectives : validElectives.slice(0, 3)
  return [...config.coreSubjects, ...activeElectives]
}

export function getTVETModules(specializationId: string): string[] {
  const spec = TVET_SPECIALIZATIONS.find(s => s.id === specializationId)
  return spec?.coreModules || TVET_SPECIALIZATIONS[0].coreModules
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
  for (const spec of TVET_SPECIALIZATIONS) {
    spec.coreModules.forEach(s => all.add(s))
  }
  return [...all]
}

export function getStrandsForSubject(grade: string, subjectName: string): string[] {
  if (!subjectName) return []
  const normalized = subjectName.trim().toLowerCase()
  const map: Record<string, string[]> = {
    'english': [],
    'english language activities': [],
    'kiswahili': [],
    'kiswahili / ksl': [],
    'mathematics': [],
    'maths': [],
    'science': [],
    'science & technology': [],
    'integrated science': [],
    'social studies': [],
    'religious education': [],
    'cre': [],
    'creative arts': [],
    'creative arts & sports': [],
    'agriculture': [],
    'agriculture & nutrition': [],
    'pre-technical studies': [],
    'business studies': [],
    'computer studies': [],
    'indigenous language': [],
    'environmental activities': [],
    'physics': [],
    'chemistry': [],
    'biology': [],
    'history & citizenship': [],
    'geography': [],
    'community service learning': [],
    'physical education': [],
  }
  return map[normalized] || []
}
