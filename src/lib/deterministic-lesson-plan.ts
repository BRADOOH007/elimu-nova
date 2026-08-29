/**
 * Deterministic, curriculum-driven lesson plan builder.
 *
 * Builds a complete KICD-structured lesson plan entirely WITHOUT AI by
 * combining three sources of structured knowledge:
 *   1. Real curriculum data from the DB (strand / sub-strand / learning outcomes)
 *   2. Grade-band pedagogy (getGradeBandProfile)
 *   3. Subject-specific pedagogy (getSubjectPedagogy)
 *
 * Kiswahili subjects generate fully localised Swahili content, mirroring the
 * style of the AI-generated Kiswahili plans (e.g. "Mazungumzo").
 *
 * The output matches the structure and quality of the AI-generated KICD plans
 * (e.g. "Counting and Writing Numbers") — and never depends on AI availability.
 */
import { getGradeBandProfile } from '@/lib/grade-bands'
import { getSubjectPedagogy } from '@/lib/subject-pedagogy'
import {
  lookupCurriculumTopic,
  isKiswahiliSubject,
  buildKiswahiliHeader,
  buildKiswahiliOrganisation,
  kiswahiliSLOs,
  kiswahiliInquiry,
  kiswahiliAssessment,
  kiswahiliExtended,
  KISWAHILI_COMPETENCIES,
  KISWAHILI_VALUES,
  KISWAHILI_PCIS,
} from '@/lib/deterministic-curriculum'

export interface LessonPlanInput {
  subject: string
  grade: string
  topic: string
  duration: number
  objectives?: string[]
  prerequisites?: string[]
  curriculum?: string
  country?: string
}

const CBC_PCIS = [
  'Learner-Centred Approaches',
  'Integration of ICT',
  'Life Skills and Values',
  'Environmental Education',
  'Citizenship Education',
  'Community Service Learning',
]

/** Pick the most relevant core competencies for a grade band. */
function pickCompetencies(subject: string, grade: string): string[] {
  const band = getGradeBandProfile(grade)
  if (isKiswahiliSubject(subject)) return KISWAHILI_COMPETENCIES
  const core = ['Communication and Collaboration', 'Critical Thinking and Problem Solving']
  if (band.id === 'early_childhood') core.push('Creativity and Imagination')
  else if (band.id === 'senior_secondary') core.push('Learning to Learn', 'Digital Literacy')
  else core.push('Learning to Learn')
  return core
}

function pickValues(subject: string, grade: string): string[] {
  if (isKiswahiliSubject(subject)) return KISWAHILI_VALUES
  const band = getGradeBandProfile(grade)
  if (band.id === 'early_childhood') return ['Respect', 'Love']
  return ['Respect', 'Responsibility']
}

function pickPCIs(subject: string, grade: string): string[] {
  if (isKiswahiliSubject(subject)) return KISWAHILI_PCIS
  const band = getGradeBandProfile(grade)
  if (band.id === 'senior_secondary') return ['Learner-Centred Approaches', 'Integration of ICT', 'Life Skills and Values']
  return CBC_PCIS.slice(0, 3)
}

/**
 * KICD-style grouping sequence used across the organisation steps, matching
 * the format of the TSC sample lesson plans (groups → pairs → individual).
 */
const GROUPING_SEQUENCE = [
  { group: 'groups', inPairs: 'In groups' },
  { group: 'pairs', inPairs: 'In pairs' },
  { group: 'individually', inPairs: 'Learners work individually' },
]

/** Build the organisation of learning from grade-band + subject pedagogy. */
function buildOrganisation(input: LessonPlanInput, pedagogy: ReturnType<typeof getSubjectPedagogy>): any {
  const band = getGradeBandProfile(input.grade)
  const ph = pedagogy?.activityGuidance || ''
  const approach = pedagogy?.approach || 'Use a guided, interactive approach that moves from concrete examples to guided practice, then independent application.'
  const topic = input.topic
  const d = input.duration
  const subjectKey = input.subject.toLowerCase()

  const isMath = subjectKey.includes('math') || subjectKey.includes('numeracy')
  const isScience = subjectKey.includes('science') || subjectKey.includes('technology')
  const isLiteracy = subjectKey.includes('english') || subjectKey.includes('language') || subjectKey.includes('literacy')
  const isSocial = subjectKey.includes('social') || subjectKey.includes('history') || subjectKey.includes('geography') || subjectKey.includes('civic')

  const activities = band.activityTypes || []
  const step1Act = activities[0] || 'guided discussion'
  const step2Act = activities[1] || 'structured practice'
  const step3Act = activities[2] || 'a hands-on application task'

  // Distribute the lesson following the TSC sample: 5/25/5 for a 35 min lesson,
  // otherwise intro ~10%, development ~82%, conclusion ~8%.
  const intro = Math.max(3, Math.round(d * 0.1))
  const conclude = Math.max(3, Math.round(d * 0.08))
  const step = Math.max(5, Math.round((d - intro - conclude) / 3))

  // Subject-specific "verify" phrasing for the independent step, mirroring the
  // sample's "check using multiplication" pattern.
  let verify: string
  if (isMath) verify = 'checking each answer using the related operation or estimation'
  else if (isScience) verify = 'recording observations and comparing results with the class'
  else if (isLiteracy) verify = 'checking their draft against the model and self-correcting spelling and punctuation'
  else if (isSocial) verify = 'justifying their response with evidence from the sources studied'
  else verify = 'reviewing their work and explaining how they arrived at their answers'

  const introTeacher = `Introduce the lesson by posing the key inquiry question for "${topic}". Recap the previous lesson to build on learners' prior knowledge, then introduce ${topic}. ${approach}`

  return {
    introduction: {
      duration: intro,
      teacherActivity: introTeacher,
      learnerActivity: `Learners respond to the inquiry question, share what they already know about ${topic}, and state what they hope to learn.`,
    },
    step1: {
      duration: step,
      teacherActivity: `Guide learners in groups through ${step1Act} on ${topic}, building understanding through concrete examples and guided questioning. ${ph}`,
      learnerActivity: `${GROUPING_SEQUENCE[0].inPairs}, learners work together on ${step1Act} for ${topic}, discussing their reasoning.`,
    },
    step2: {
      duration: step,
      teacherActivity: `Have learners work in pairs on ${step2Act} for ${topic}, circulating to give immediate feedback and clarify common misconceptions.`,
      learnerActivity: `${GROUPING_SEQUENCE[1].inPairs}, learners attempt ${step2Act} on ${topic} and receive feedback before moving on.`,
    },
    step3: {
      duration: d - intro - conclude - step * 2,
      teacherActivity: `Have learners individually apply ${topic} through ${step3Act}, ${verify}. Circulate to support and check understanding.`,
      learnerActivity: `${GROUPING_SEQUENCE[2].inPairs} on ${step3Act} for ${topic}, then share and discuss their findings with the class.`,
    },
    conclusion: {
      duration: conclude,
      teacherActivity: `Summarise the key points of ${topic}, relate them back to the inquiry question, revisit the learning objectives, and set a short review question for the next lesson.`,
      learnerActivity: `Learners recap what they learned about ${topic}, answer the review questions, and complete a quick summary or exit ticket.`,
    },
  }
}

/** Organisation-of-learning summary line (classroom grouping + environment). */
function organisationSummary(band: ReturnType<typeof getGradeBandProfile>): string {
  return `In the classroom individual and group work. ${band.id === 'senior_secondary' ? 'Learners also work independently on extended tasks.' : 'Use of the natural environment and local context where relevant.'}`
}

/**
 * Generate a complete, deterministic KICD lesson plan.
 */
export async function buildSmartLessonPlan(input: LessonPlanInput): Promise<any> {
  const { subject, grade, topic, duration, curriculum } = input
  const objectives = (input.objectives || []).filter(o => o && o.trim())
  const band = getGradeBandProfile(grade)
  const pedagogy = getSubjectPedagogy(subject)
  const kiswahili = isKiswahiliSubject(subject)

  const lookup = await lookupCurriculumTopic({ grade, subject, topic, curriculum })
  const strand = lookup.matched ? lookup.strandName : subject
  const subStrand = lookup.matched ? lookup.subStrandName : topic

  let plan: any

  if (kiswahili) {
    const slo = kiswahiliSLOs(topic, lookup.learningOutcomes)
    plan = {
      title: topic,
      duration,
      lessonHeader: buildKiswahiliHeader(grade, duration),
      strand,
      subStrand,
      specificLearningOutcomes: slo,
      keyInquiryQuestions: kiswahiliInquiry(topic),
      coreCompetencies: KISWAHILI_COMPETENCIES,
      values: KISWAHILI_VALUES,
      pcis: KISWAHILI_PCIS,
      learningResources: ['Kitabu cha Kiswahili', 'Ubao mweupe', 'Chati na picha', 'Madaftari ya wanafunzi'],
      assessment: kiswahiliAssessment(topic),
      extendedActivities: kiswahiliExtended(topic),
      reflection: `Kujifunza kutokana na mafanikio na changamoto za somo la ${topic}.`,
      organisation: 'Darasani, kazi ya mtu binafsi na ya kikundi. Matumizi ya mazingira ya asili na muktadha wa eneo.',
      organisationOfLearning: buildKiswahiliOrganisation(topic, duration),
      vocabulary: [{
        term: topic.trim(),
        definition: `Dhana kuu inayofundishwa katika somo hili (${topic}).`,
        example: `Inatumika katika muktadha wa ${topic}.`,
      }],
      topic, subject, grade,
    }
    return plan
  }

  // ── English-language plan ──────────────────────────────────
  let slo: string[]
  if (lookup.matched && lookup.learningOutcomes.length > 0) {
    slo = lookup.learningOutcomes.slice(0, 4)
  } else if (objectives.length > 0) {
    slo = objectives.map(o => (o.toLowerCase().startsWith('by the end') ? o : `By the end of the lesson, the learner should be able to ${o.charAt(0).toLowerCase()}${o.slice(1)}`))
  } else {
    slo = [
      `By the end of the lesson, the learner should be able to describe and explain key concepts in ${topic}.`,
      `By the end of the lesson, the learner should be able to apply ${topic} in real-life situations.`,
      `By the end of the lesson, the learner should be able to demonstrate knowledge of ${topic}.`,
    ]
  }

  const keyQuestions = [
    `What do you already know about ${topic}?`,
    `How can ${topic} be used in everyday life?`,
    `What is the most important idea about ${topic}, and can you explain it in your own words?`,
  ]

  const assessmentMethods = (band.assessmentMethods || ['oral questions', 'worksheets', 'observation']).slice(0, 3).join(', ')
  const assessment = `Learners are assessed through ${assessmentMethods} on ${topic}. ${pedagogy?.assessmentGuidance?.split('.').slice(0, 2).join('. ') || ''} By the end of the lesson, learners should be able to ${slo[0]?.replace(/^By the end of the lesson, the learner should be able to /i, '') || 'demonstrate understanding of ' + topic}.`

  const learningResources = [
    `${subject} textbook`,
    'Whiteboard or chalkboard and markers/chalk',
    'Charts, diagrams or models',
    'Learner exercise books',
  ]
  if (band.activityTypes?.length) learningResources.push(`Materials for: ${band.activityTypes.slice(0, 2).join(', ')}`)

  const organisation = buildOrganisation(input, pedagogy)

  plan = {
    title: topic,
    duration,
    lessonHeader: {
      school: '', teacher: '', learningArea: subject, grade,
      term: 'Term 1', week: 1, lesson: 1,
      date: new Date().toISOString().slice(0, 10),
      duration, enrolment: 0,
    },
    strand,
    subStrand,
    specificLearningOutcomes: slo,
    keyInquiryQuestions: keyQuestions,
    coreCompetencies: pickCompetencies(subject, grade),
    values: pickValues(subject, grade),
    pcis: pickPCIs(subject, grade),
    learningResources,
    assessment,
    extendedActivities: `Learners complete a short exercise on ${topic} and observe how ${topic} appears in their everyday environment.`,
    reflection: 'Reflect on learner participation and understanding during the lesson; adjust pacing and reteach any challenging aspects next lesson if needed.',
    vocabulary: [{
      term: topic.trim(),
      definition: `The key concept explored in this lesson (${topic}).`,
      example: `Used in context while investigating ${topic}.`,
    }],
    misconceptions: [
      {
        statement: `Learners may confuse ${topic} with closely related ideas.`,
        correction: 'Clarify the differences using concrete examples during step 2.',
        preventionTip: 'Preview common confusions before the main activity.',
      },
    ],
    differentiation: {
      support: `Provide additional guided questions, visual aids, and peer support for learners who need help with ${topic}.`,
      extension: `Challenge advanced learners with open-ended questions and extension problems that apply ${topic} to new contexts.`,
      learningStyles: ['visual', 'auditory', 'kinesthetic'],
      grouping: 'Mix ability levels in groups so stronger learners can support their peers.',
    },
    crossCurricularLinks: [
      { subject: 'Language and Communication', connection: 'Reading comprehension and vocabulary', activity: `Learners read and discuss short texts related to ${topic}.` },
    ],
    rubric: [
      {
        criteria: `Understanding of ${topic}`,
        excellent: 'Explains and applies the concept independently',
        good: 'Explains the concept with some support',
        developing: 'Recognises the concept but needs guidance',
      },
    ],
    formativeCheckpoints: [
      'Oral check during the introduction to gauge prior knowledge',
      'Review of guided practice in step 2',
      'Observation of group work in step 3',
    ],
    organisation: organisationSummary(band),
    organisationOfLearning: organisation,
    topic, subject, grade,
  }

  return plan
}

/** Convenience wrapper for code that only needs the deterministic, DB-driven plan. */
export { lookupCurriculumTopic }
