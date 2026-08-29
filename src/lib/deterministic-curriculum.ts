/**
 * Shared deterministic curriculum intelligence.
 *
 * Used by both the smart lesson-plan builder and the smart scheme-of-work
 * builder so they pull real strand / sub-strand / learning outcomes from the
 * DB (no AI) in a consistent way. Also hosts Kiswahili-aware payload templates
 * that mirror the style of the AI-generated Kiswahili plans.
 */
import { prisma } from '@/lib/prisma'
import { getCurriculumType } from '@/lib/curriculum-type-map'

export interface CurriculumTopicLookup {
  strandName: string
  subStrandName: string
  learningOutcomes: string[]
  matched: boolean
}

export function norm(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').replace(/\s+/g, ' ').trim()
}

/** Strip leading "N SUB-STRAND:" style labels from a topic/substrand name. */
export function normTopic(s: string): string {
  const cleaned = s.replace(/^\d+(\.\d+)*\s*(sub-?strand)?\s*[:.\-]\s*/i, '').trim()
  return norm(cleaned)
}

/** Tolerant subject-name equality (ignores "Activities"/"Subject" suffix). */
export function subjectMatches(a: string, b: string): boolean {
  const sig = (s: string) => norm(s).replace(/activities|subject$/g, ' ').replace(/\s+/g, ' ').trim()
  const ta = sig(a).split(' ').filter(w => w.length > 2)
  const tb = sig(b).split(' ').filter(w => w.length > 2)
  if (ta.length === 0 || tb.length === 0) return norm(a) === norm(b)
  const [short, long] = ta.length <= tb.length ? [ta, tb] : [tb, ta]
  return short.every(t => long.includes(t))
}

/**
 * Find the matching CurriculumSubstrand (strand + outcomes) for a topic in a
 * grade + subject + curriculum. Returns matched:false gracefully when no hit.
 */
export async function lookupCurriculumTopic(
  input: { grade: string; subject: string; topic: string; curriculum?: string }
): Promise<CurriculumTopicLookup> {
  const curriculumType = getCurriculumType(input.curriculum)
  const topicNorm = normTopic(input.topic)
  const nothing: CurriculumTopicLookup = { strandName: '', subStrandName: '', learningOutcomes: [], matched: false }

  try {
    const curriculums = await prisma.curriculum.findMany({
      where: { type: curriculumType, grade: input.grade, isActive: true },
      select: { id: true, subject: true },
    })
    if (curriculums.length === 0) return nothing

    const matchingIds = curriculums.filter(c => subjectMatches(c.subject, input.subject)).map(c => c.id)
    if (matchingIds.length === 0) return nothing

    const strandWithSubs = await prisma.curriculumStrand.findMany({
      where: { curriculumId: { in: matchingIds } },
      include: { substrands: { select: { id: true, name: true, learningOutcomes: true, order: true } } },
    })

    let best: CurriculumTopicLookup | null = null
    let bestScore = 0
    for (const strand of strandWithSubs) {
      for (const sub of strand.substrands) {
        const nameNorm = normTopic(sub.name)
        if (!nameNorm) continue
        const tTokens = topicNorm.split(' ').filter(w => w.length > 2)
        let score = 0
        if (nameNorm === topicNorm) score = 100
        else if (nameNorm.includes(topicNorm) || topicNorm.includes(nameNorm)) score = 65
        else if (tTokens.length > 0) {
          const overlap = tTokens.filter(t => nameNorm.includes(t)).length
          score = (overlap / tTokens.length) * 80
        } else if (nameNorm.split(' ').some(t => topicNorm.includes(t))) score = 30
        if (score > 0 && score > bestScore) {
          bestScore = score
          best = {
            strandName: strand.name,
            subStrandName: sub.name,
            learningOutcomes: sub.learningOutcomes || [],
            matched: true,
          }
        }
      }
    }
    return best || nothing
  } catch (e) {
    console.warn('[DeterministicCurriculum] lookup failed:', (e as Error).message)
    return nothing
  }
}

/** True if the subject is Kiswahili (shughuli za kiswahili, etc.). */
export function isKiswahiliSubject(subject: string): boolean {
  return norm(subject).includes('kiswahili') || norm(subject).includes('swahili')
}

/**
 * Kiswahili templates mirroring the AI-generated "Mazungumzo" plan:
 * Swahili lesson header, Swahili organisation steps, Swahili SLOs etc.
 * Uses canonical English keys (which all renderers normalise to) so the
 * Kiswahili plan renders identically in View / Edit / PDF / Word.
 */
export function buildKiswahiliHeader(grade: string, duration: number) {
  const darasa = `Darasa la ${grade.replace(/^Grade\s*/i, '')}`
  return {
    school: '', teacher: '',
    learningArea: 'Kiswahili',
    grade: darasa,
    term: 'Robo duara ya 1',
    week: 1, lesson: 1,
    date: new Date().toISOString().slice(0, 10),
    duration, enrolment: 0,
  }
}

export function buildKiswahiliOrganisation(topic: string, duration: number) {
  const d = Math.max(3, Math.round(duration * 0.1))
  const step = Math.max(5, Math.round((duration - d * 2) / 3))
  return {
    introduction: {
      duration: d,
      teacherActivity: `Kuwakaribisha wanafunzi na kuanzisha mada ya "${topic}". Kuwauliza wanafunzi mawazo yao kuhusu ${topic}.`,
      learnerActivity: 'Kusikiliza na kushiriki mawazo yao juu ya mada.',
    },
    step1: {
      duration: step,
      teacherActivity: `Kufafanua dhana kuu ya ${topic} kwa kutumia mifano halisi na maswali ya mwongozo.`,
      learnerActivity: 'Kushiriki, kuuliza maswali, na kuchukua maelezo mafupi.',
    },
    step2: {
      duration: step,
      teacherActivity: `Kuwaongoza wanafunzi katika mazoezi ya kikundi kuhusu ${topic} na kutoa mrejesho wa mara moja.`,
      learnerActivity: `Kufanya mazoezi ya kikundi kuhusu ${topic} kwa kushirikiana.`,
    },
    step3: {
      duration: duration - d * 2 - step * 2,
      teacherActivity: `Kuwapa wanafunzi shughuli ya kutumia ${topic} katika hali halisi na kuzunguka kuwaunga mkono.`,
      learnerActivity: `Wanafunzi wanatumia ${topic} katika mazoezi kisha wanawasilisha matokeo.`,
    },
    conclusion: {
      duration: d,
      teacherActivity: `Kuhitimisha somo la ${topic}, kukagua malengo, na kugawa shughuli za nyumbani.`,
      learnerActivity: 'Kukumbuka yaliyojifunza na kuandika shughuli za nyumbani.',
    },
  }
}

export const KISWAHILI_COMPETENCIES = ['Mawasiliano na ushirikiano', 'Kufikiri kwa kina na kutatua matatizo', 'Uundaji na ubunifu']
export const KISWAHILI_VALUES = ['Heshima', 'Wajibu']
export const KISWAHILI_PCIS = ['Elimu ya maisha', 'Elimu ya mazingira']

const KISWAHILI_SLO_TEMPLATES = [
  (t: string) => `Kuelewa dhana ya ${t}`,
  (t: string) => `Kutumia ${t} katika hali za kweli za maisha`,
  (t: string) => `Kuonyesha ujuzi wa ${t}`,
]

export function kiswahiliSLOs(topic: string, realOutcomes: string[]): string[] {
  if (realOutcomes && realOutcomes.length > 0) return realOutcomes.slice(0, 4)
  return KISWAHILI_SLO_TEMPLATES.map(fn => fn(topic))
}

const KISWAHILI_INQUIRY = (t: string) => `Je, ${t} ni nini na umuhimu wake katika maisha ya kila siku?`

export function kiswahiliInquiry(topic: string): string[] {
  return [KISWAHILI_INQUIRY(topic)]
}

export function kiswahiliAssessment(topic: string): string {
  return `Kutathmini uelewa wa wanafunzi wa ${topic} kwa kutumia maswali ya mdomo, uchunguzi wa kazi za darasani, na shughuli za nyumbani.`
}

export function kiswahiliExtended(topic: string): string {
  return `Wanafunzi kuandika insha fupi kuhusu umuhimu wa ${topic} katika maisha ya kila siku.`
}
