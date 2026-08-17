// GED (US General Education Diploma) constants shared across senior-student
// pages and APIs.

export const GED_SUBJECTS = [
  'Mathematical Reasoning',
  'Reasoning Through Language Arts',
  'Science',
  'Social Studies',
] as const

export type GEDSubject = (typeof GED_SUBJECTS)[number]

// Official GED score scale is 100–200; 145 passes a subject test.
export const GED_PASS_SCORE = 145

// Mastery (0–100) threshold at which a subject is considered "GED-ready".
export const GED_READY_MASTERY = 75

// Map a 0–100 mastery value onto the official 100–200 GED score scale.
export function masteryToGEDScore(mastery: number): number {
  return Math.max(100, Math.min(200, 100 + Math.round(mastery)))
}
