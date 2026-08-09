export interface Curriculum {
  id: string
  name: string
  country: string
  subjects: string[]
  grades: string[]
}

export interface Country {
  code: string
  name: string
  flag: string
}

export const COUNTRIES: Country[] = [
  { code: 'KE', name: 'Kenya', flag: '🇰🇪' },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧' },
  { code: 'US', name: 'United States', flag: '🇺🇸' },
  { code: 'ZA', name: 'South Africa', flag: '🇿🇦' },
  { code: 'NG', name: 'Nigeria', flag: '🇳🇬' },
  { code: 'IN', name: 'India', flag: '🇮🇳' },
  { code: 'INT', name: 'International', flag: '🌍' },
]

export const CURRICULA: Curriculum[] = [
  // ── Kenya ──
  {
    id: 'cbc',
    name: 'CBC (PP1–Grade 12)',
    country: 'KE',
    subjects: [
      'Mathematics', 'English', 'Kiswahili', 'Science and Technology',
      'Social Studies', 'Creative Arts', 'Physical Education',
      'Agriculture and Nutrition', 'Home Science', 'Religious Education',
      'Pre-Technical Studies', 'Business Studies', 'Computer Studies',
      'Music', 'Art & Craft',
    ],
    grades: [
      'PP1', 'PP2', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4',
      'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9',
      'Grade 10', 'Grade 11', 'Grade 12',
    ],
  },
  {
    id: '8-4-4',
    name: '8-4-4 System',
    country: 'KE',
    subjects: [
      'Mathematics', 'English', 'Kiswahili', 'Biology', 'Chemistry',
      'Physics', 'History', 'Geography', 'Religious Education',
      'Agriculture', 'Business Studies', 'Computer Studies',
      'Music', 'Art & Craft', 'Physical Education',
    ],
    grades: ['Form 1', 'Form 2', 'Form 3', 'Form 4'],
  },

  // ── United Kingdom ──
  {
    id: 'cambridge',
    name: 'Cambridge International',
    country: 'GB',
    subjects: [
      'Mathematics', 'English', 'Science', 'Physics', 'Chemistry',
      'Biology', 'History', 'Geography', 'Economics', 'Business Studies',
      'Computer Science', 'Art & Design', 'Music', 'Physical Education',
      'French', 'Spanish', 'Accounting',
    ],
    grades: [
      'Year 1', 'Year 2', 'Year 3', 'Year 4', 'Year 5', 'Year 6',
      'Year 7', 'Year 8', 'Year 9', 'Year 10', 'Year 11', 'Year 12', 'Year 13',
    ],
  },
  {
    id: 'gcse',
    name: 'GCSE',
    country: 'GB',
    subjects: [
      'Mathematics', 'English Language', 'English Literature',
      'Biology', 'Chemistry', 'Physics', 'Combined Science',
      'History', 'Geography', 'Economics', 'Business Studies',
      'Computer Science', 'Art & Design', 'Music', 'Physical Education',
      'Religious Studies', 'French', 'German', 'Spanish',
    ],
    grades: ['Year 9', 'Year 10', 'Year 11'],
  },
  {
    id: 'a-level',
    name: 'A-Levels',
    country: 'GB',
    subjects: [
      'Mathematics', 'Further Mathematics', 'English Literature',
      'Biology', 'Chemistry', 'Physics', 'History', 'Geography',
      'Economics', 'Business Studies', 'Computer Science',
      'Art & Design', 'Music', 'Psychology', 'Sociology', 'Law', 'Accounting',
    ],
    grades: ['Year 12', 'Year 13'],
  },

  // ── United States ──
  {
    id: 'common-core',
    name: 'Common Core',
    country: 'US',
    subjects: [
      'Mathematics', 'English Language Arts', 'Science', 'Social Studies',
      'History', 'Geography', 'Economics', 'Art', 'Music',
      'Physical Education', 'Health', 'Spanish', 'French',
      'Computer Science',
    ],
    grades: [
      'Kindergarten', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4',
      'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9',
      'Grade 10', 'Grade 11', 'Grade 12',
    ],
  },
  {
    id: 'ngss',
    name: 'NGSS (Next Generation Science Standards)',
    country: 'US',
    subjects: [
      'Physical Science', 'Life Science', 'Earth & Space Science',
      'Engineering Design', 'Science & Engineering Practices',
      'Crosscutting Concepts',
    ],
    grades: [
      'Kindergarten', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4',
      'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9',
      'Grade 10', 'Grade 11', 'Grade 12',
    ],
  },
  {
    id: 'teks',
    name: 'TEKS (Texas Essential Knowledge & Skills)',
    country: 'US',
    subjects: [
      'English Language Arts & Reading', 'Mathematics', 'Science',
      'Social Studies', 'Health Education', 'Physical Education',
      'Fine Arts', 'Languages Other Than English', 'Technology Applications',
      'Career & Technical Education', 'Economics',
    ],
    grades: [
      'Kindergarten', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4',
      'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9',
      'Grade 10', 'Grade 11', 'Grade 12',
    ],
  },
  {
    id: 'florida-best',
    name: 'Florida B.E.S.T. Standards',
    country: 'US',
    subjects: [
      'English Language Arts', 'Mathematics', 'Science', 'Social Studies',
      'Health & PE', 'Fine Arts', 'World Languages', 'Computer Science',
      'Career & Technical Education',
    ],
    grades: [
      'Kindergarten', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4',
      'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9',
      'Grade 10', 'Grade 11', 'Grade 12',
    ],
  },
  {
    id: 'california',
    name: 'California Content Standards',
    country: 'US',
    subjects: [
      'English Language Arts', 'Mathematics', 'Science', 'History-Social Science',
      'Health Education', 'Physical Education', 'Visual & Performing Arts',
      'World Languages', 'Computer Science',
    ],
    grades: [
      'Kindergarten', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4',
      'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9',
      'Grade 10', 'Grade 11', 'Grade 12',
    ],
  },
  {
    id: 'ny-state',
    name: 'New York State Standards',
    country: 'US',
    subjects: [
      'English Language Arts', 'Mathematics', 'Science', 'Social Studies',
      'The Arts', 'Health & Physical Education', 'World Languages',
      'Career Development', 'Computer Science & Digital Fluency',
    ],
    grades: [
      'Kindergarten', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4',
      'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9',
      'Grade 10', 'Grade 11', 'Grade 12',
    ],
  },
  {
    id: 'ap',
    name: 'Advanced Placement (AP)',
    country: 'US',
    subjects: [
      'AP Biology', 'AP Chemistry', 'AP Physics 1', 'AP Physics 2',
      'AP Physics C', 'AP Calculus AB', 'AP Calculus BC', 'AP Statistics',
      'AP English Language & Composition', 'AP English Literature & Composition',
      'AP United States History', 'AP World History', 'AP European History',
      'AP US Government & Politics', 'AP Human Geography', 'AP Psychology',
      'AP Macroeconomics', 'AP Microeconomics', 'AP Computer Science A',
      'AP Computer Science Principles', 'AP Environmental Science',
      'AP Art History', 'AP Studio Art', 'AP Music Theory',
      'AP Spanish Language & Culture', 'AP French Language & Culture',
    ],
    grades: ['Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'],
  },
  {
    id: 'ged-hiset',
    name: 'GED / HiSET (High School Equivalency)',
    country: 'US',
    subjects: [
      'Mathematical Reasoning', 'Reasoning Through Language Arts',
      'Science', 'Social Studies',
    ],
    grades: ['Adult Learner', 'High School Equivalency'],
  },
  {
    id: 'us-homeschool',
    name: 'Homeschool / Custom',
    country: 'US',
    subjects: [
      'Mathematics', 'English Language Arts', 'Science', 'Social Studies',
      'History', 'Geography', 'Economics', 'Art', 'Music',
      'Physical Education', 'Health', 'Foreign Languages',
      'Computer Science', 'Life Skills',
    ],
    grades: [
      'Kindergarten', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4',
      'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9',
      'Grade 10', 'Grade 11', 'Grade 12',
    ],
  },

  // ── South Africa ──
  {
    id: 'caps',
    name: 'CAPS',
    country: 'ZA',
    subjects: [
      'Mathematics', 'English Home Language', 'English First Additional Language',
      'Afrikaans', 'Life Skills', 'Natural Sciences', 'Social Sciences',
      'Technology', 'Physical Sciences', 'Life Sciences', 'Geography',
      'History', 'Business Studies', 'Economics', 'Accounting',
      'Computer Applications Technology', 'Visual Arts', 'Music',
    ],
    grades: [
      'Grade R', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5',
      'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11',
      'Grade 12',
    ],
  },
  {
    id: 'ieb',
    name: 'IEB',
    country: 'ZA',
    subjects: [
      'Mathematics', 'English Home Language', 'English First Additional Language',
      'Afrikaans', 'Life Orientation', 'Physical Sciences', 'Life Sciences',
      'Geography', 'History', 'Business Studies', 'Economics', 'Accounting',
      'Computer Applications Technology', 'Visual Arts', 'Music', 'Dramatic Arts',
    ],
    grades: ['Grade 10', 'Grade 11', 'Grade 12'],
  },

  // ── Nigeria ──
  {
    id: 'nerdc',
    name: 'NERDC / UBE',
    country: 'NG',
    subjects: [
      'Mathematics', 'English Studies', 'Basic Science', 'Basic Technology',
      'Social Studies', 'Civic Education', 'Christian Religious Studies',
      'Islamic Studies', 'Agricultural Science', 'Home Economics',
      'Physical Health Education', 'Creative Arts', 'Computer Studies / ICT',
      'French', 'Hausa', 'Igbo', 'Yoruba',
    ],
    grades: [
      'Primary 1', 'Primary 2', 'Primary 3', 'Primary 4', 'Primary 5', 'Primary 6',
      'JSS 1', 'JSS 2', 'JSS 3', 'SSS 1', 'SSS 2', 'SSS 3',
    ],
  },

  // ── India ──
  {
    id: 'cbse',
    name: 'CBSE',
    country: 'IN',
    subjects: [
      'Mathematics', 'English', 'Hindi', 'Science', 'Social Science',
      'Sanskrit', 'French', 'Computer Science', 'Physics', 'Chemistry',
      'Biology', 'History', 'Geography', 'Economics', 'Accountancy',
      'Business Studies', 'Political Science', 'Psychology', 'Physical Education',
    ],
    grades: [
      'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5', 'Class 6',
      'Class 7', 'Class 8', 'Class 9', 'Class 10', 'Class 11', 'Class 12',
    ],
  },
  {
    id: 'icse',
    name: 'ICSE',
    country: 'IN',
    subjects: [
      'Mathematics', 'English', 'Hindi', 'Science', 'Social Studies',
      'History', 'Geography', 'Physics', 'Chemistry', 'Biology',
      'Computer Science', 'Economics', 'Art', 'Physical Education',
      'French', 'German', 'Sanskrit',
    ],
    grades: [
      'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5', 'Class 6',
      'Class 7', 'Class 8', 'Class 9', 'Class 10', 'Class 11', 'Class 12',
    ],
  },

  // ── International ──
  {
    id: 'igcse',
    name: 'IGCSE',
    country: 'INT',
    subjects: [
      'Mathematics', 'English', 'Physics', 'Chemistry', 'Biology',
      'Combined Science', 'History', 'Geography', 'Economics',
      'Business Studies', 'Computer Science', 'Art & Design',
      'Music', 'Physical Education', 'Accounting', 'French', 'Spanish',
    ],
    grades: ['Year 10', 'Year 11'],
  },
  {
    id: 'ib',
    name: 'International Baccalaureate (IB)',
    country: 'INT',
    subjects: [
      'Mathematics: Analysis & Approaches',
      'Mathematics: Applications & Interpretation',
      'English A: Literature',
      'English A: Language & Literature',
      'Biology', 'Chemistry', 'Physics',
      'History', 'Geography', 'Economics',
      'Business Management', 'Computer Science',
      'Visual Arts', 'Music', 'Psychology',
      'French B', 'Spanish B',
    ],
    grades: ['IBDP Year 1 (Grade 11)', 'IBDP Year 2 (Grade 12)'],
  },
  {
    id: 'general',
    name: 'General',
    country: 'INT',
    subjects: [
      'Mathematics', 'English', 'Science', 'History', 'Geography',
      'Art', 'Music', 'Physical Education', 'Computer Science',
      'Foreign Languages', 'Social Studies',
    ],
    grades: [
      'Beginner', 'Elementary', 'Intermediate', 'Advanced',
      'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5',
      'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10',
      'Grade 11', 'Grade 12',
    ],
  },
]

export function getCurriculaByCountry(countryCode: string): Curriculum[] {
  return CURRICULA.filter((c) => c.country === countryCode)
}

export function getCurriculum(id: string): Curriculum | undefined {
  return CURRICULA.find((c) => c.id === id)
}

export function getSubjectsForCurriculum(id: string): string[] {
  const curriculum = getCurriculum(id)
  return curriculum?.subjects ?? []
}

export function getGradesForCurriculum(id: string): string[] {
  const curriculum = getCurriculum(id)
  return curriculum?.grades ?? []
}
