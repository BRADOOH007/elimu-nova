/**
 * Maps curriculum IDs to their database CurriculumType enum values.
 * Used by curriculum intelligence, auto-populate, and cache layers
 * so queries are no longer hardcoded to type: 'CBC' and so each
 * curriculum is individually identifiable in the DB.
 */

type CurriculumType =
  | 'CBC' | 'EIGHT_FOUR_FOUR'
  | 'CAMBRIDGE' | 'GCSE' | 'A_LEVEL' | 'IGCSE' | 'IB'
  | 'COMMON_CORE' | 'NGSS' | 'TEKS' | 'FLORIDA_BEST' | 'CALIFORNIA'
  | 'NY_STATE' | 'AP' | 'GED' | 'US_HOMESCHOOL'
  | 'CAPS' | 'IEB' | 'NERDC' | 'CBSE' | 'ICSE'
  | 'OTHER'

const CURRICULUM_TYPE_MAP: Record<string, CurriculumType> = {
  // Kenya
  cbc: 'CBC',
  '8-4-4': 'EIGHT_FOUR_FOUR',

  // UK / international
  cambridge: 'CAMBRIDGE',
  gcse: 'GCSE',
  'a-level': 'A_LEVEL',
  igcse: 'IGCSE',
  ib: 'IB',

  // US
  'common-core': 'COMMON_CORE',
  ngss: 'NGSS',
  teks: 'TEKS',
  'florida-best': 'FLORIDA_BEST',
  california: 'CALIFORNIA',
  'ny-state': 'NY_STATE',
  ap: 'AP',
  'ged-hiset': 'GED',
  'us-homeschool': 'US_HOMESCHOOL',

  // South Africa
  caps: 'CAPS',
  ieb: 'IEB',

  // Nigeria
  nerdc: 'NERDC',

  // India
  cbse: 'CBSE',
  icse: 'ICSE',

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
