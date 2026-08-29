/**
 * Maps curriculum IDs to their database CurriculumType enum values.
 * Used by curriculum intelligence, auto-populate, and cache layers
 * so queries are no longer hardcoded to type: 'CBC'.
 */

type CurriculumType = 'CBC' | 'CAMBRIDGE' | 'IGCSE' | 'IB' | 'GED' | 'OTHER'

const CURRICULUM_TYPE_MAP: Record<string, CurriculumType> = {
  // Kenya
  cbc: 'CBC',
  '8-4-4': 'OTHER',

  // UK
  cambridge: 'CAMBRIDGE',
  gcse: 'CAMBRIDGE',
  'a-level': 'CAMBRIDGE',

  // International
  igcse: 'IGCSE',
  ib: 'IB',

  // US
  'common-core': 'OTHER',
  ngss: 'OTHER',
  teks: 'OTHER',
  'florida-best': 'OTHER',
  california: 'OTHER',
  'ny-state': 'OTHER',
  ap: 'OTHER',
  'ged-hiset': 'GED',
  'us-homeschool': 'OTHER',

  // South Africa
  caps: 'OTHER',
  ieb: 'OTHER',

  // Nigeria
  nerdc: 'OTHER',

  // India
  cbse: 'OTHER',
  icse: 'OTHER',

  // Fallback
  general: 'OTHER',
}

/**
 * Get the DB CurriculumType for a curriculum ID.
 * Accepts both the curriculum ID (e.g. 'cbc', 'common-core')
 * and legacy 'cbc' strings.
 */
export function getCurriculumType(curriculumId?: string | null): CurriculumType {
  if (!curriculumId) return 'CBC'
  return CURRICULUM_TYPE_MAP[curriculumId.toLowerCase()] || 'OTHER'
}

/**
 * Build a Prisma where clause filter for curriculum type.
 * Used to replace hardcoded `type: 'CBC'` across the codebase.
 */
export function curriculumTypeFilter(curriculumId?: string | null): { type: CurriculumType } {
  return { type: getCurriculumType(curriculumId) }
}

/**
 * Get the default lessons per week for a curriculum.
 * Falls back to profile-based defaults from curriculum-prompt.ts.
 */
export function getDefaultLessonsPerWeek(curriculumId?: string | null): number {
  const type = getCurriculumType(curriculumId)
  if (type === 'CBC') return 5
  if (curriculumId === 'ged-hiset' || curriculumId === 'us-homeschool') return 4
  return 5
}
