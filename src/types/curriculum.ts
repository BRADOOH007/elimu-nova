// CBC Curriculum Types — shared across EduGenius
export type Term = 1 | 2 | 3

export type GradeLevel =
  | 'Grade 1' | 'Grade 2' | 'Grade 3' | 'Grade 4' | 'Grade 5' | 'Grade 6'
  | 'Grade 7' | 'Grade 8' | 'Grade 9'
  | 'Grade 10' | 'Grade 11' | 'Grade 12'
  | 'PP1' | 'PP2'

export interface SubStrand {
  name: string
  learningOutcomes?: string[]
  activities?: string[]
}

export interface Strand {
  name: string
  subStrands: SubStrand[]
}

export interface LearningAreaData {
  name: string
  strands: Strand[]
}

export interface TermCurriculum {
  term: Term
  grade: GradeLevel
  learningAreas: LearningAreaData[]
}
