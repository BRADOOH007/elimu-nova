/**
 * Curriculum-aware AI prompt builder.
 *
 * Each curriculum gets a profile describing: identity, regional context,
 * terminology for the structural JSON keys, objective stems, and assessment
 * style. Output JSON keys stay IDENTICAL across curricula (frontend rendering
 * contract is stable); only the *content* and terminology adapt. A US Common
 * Core lesson still returns `{ strand, subStrand, ... }` but the AI is told
 * "strand" means "Unit" and "subStrand" means "Topic/Standard" for that user.
 */

export interface CurriculumPromptProfile {
  id: string
  name: string
  country: string
  identity: string
  contextNote: string
  strandLabel: string
  subStrandLabel: string
  objectiveStem: string
  assessmentStyle: string
  lessonDurationMinutes: number
  defaultLessonsPerWeek: number
  termLabel: string
  valuesGuidance: string
  competenciesGuidance: string
}

const US_BASE = {
  country: 'US',
  contextNote: 'Use United States contexts throughout: USD currency, US states and cities, American cultural references, US geography, and locally available US classroom resources. Refer to grade levels as Grade K-12 (or the specific US grade band given).',
  strandLabel: 'Unit',
  subStrandLabel: 'Topic / Standard',
  objectiveStem: 'By the end of the lesson, students will be able to',
  assessmentStyle: 'US classroom assessment style: formative checks, exit tickets, quizzes, and standards-aligned summative tasks. Avoid terminology specific to other national systems (e.g. "learner", "sub-strand", "PCIs", "KICD").',
  lessonDurationMinutes: 45,
  defaultLessonsPerWeek: 5,
  termLabel: 'Marking Period',
  valuesGuidance: 'Reinforce US civic and character values such as responsibility, respect, integrity, citizenship, and teamwork, integrated naturally into the lesson.',
  competenciesGuidance: 'Weave 21st-century skills into activities where they genuinely apply: critical thinking, collaboration, creativity, communication, and digital literacy.',
}

const PROFILES: Record<string, CurriculumPromptProfile> = {
  // ── Kenya ──
  cbc: {
    id: 'cbc', name: 'CBC (Competency-Based Curriculum)', country: 'KE',
    identity: 'a Kenyan CBC/CBE curriculum expert creating materials in the official KICD format.',
    contextNote: 'Use Kenyan examples, contexts and locally available resources. Reference Kenya Vision 2030 and SDGs where relevant. Refer to grade levels as PP1/PP2/Grade 1-12.',
    strandLabel: 'Strand', subStrandLabel: 'Sub-Strand',
    objectiveStem: 'By the end of the lesson, the learner should be able to',
    assessmentStyle: 'KICD assessment methods: oral questions, observation, and review of written work, aligned to CBC learning outcomes.',
    lessonDurationMinutes: 40, defaultLessonsPerWeek: 5, termLabel: 'Term',
    valuesGuidance: 'Pick 1-2 from the KICD values list (respect, responsibility, love, peace, unity, patriotism, integrity, social justice).',
    competenciesGuidance: 'Pick 2-3 from the 7 CBC core competencies: communication and collaboration, critical thinking and problem solving, creativity and imagination, citizenship, digital literacy, learning to learn, self-efficacy.',
  },
  '8-4-4': {
    id: '8-4-4', name: '8-4-4 System', country: 'KE',
    identity: 'a Kenyan education expert creating materials for the traditional 8-4-4 system.',
    contextNote: 'Use Kenyan examples and locally relevant contexts. Refer to levels as Form 1-4 (secondary) and Standards 1-8 (primary).',
    strandLabel: 'Topic', subStrandLabel: 'Sub-Topic',
    objectiveStem: 'By the end of the lesson, the learner should be able to',
    assessmentStyle: 'Kenyan 8-4-4 assessment style: class exercises, tests, and national exam (KCSE/KCPE) style questions.',
    lessonDurationMinutes: 40, defaultLessonsPerWeek: 5, termLabel: 'Term',
    valuesGuidance: 'Reinforce positive values such as integrity, respect, responsibility and teamwork in the lesson.',
    competenciesGuidance: 'Develop knowledge, comprehension, application, analysis, synthesis and evaluation skills.',
  },

  // ── United States ──
  'common-core': {
    ...US_BASE,
    id: 'common-core', name: 'Common Core State Standards',
    identity: 'an expert educator and curriculum designer specializing in the Common Core State Standards (CCSS) for English Language Arts and Mathematics used across United States schools.',
    strandLabel: 'Domain', subStrandLabel: 'Cluster / Standard',
  },
  ngss: {
    ...US_BASE,
    id: 'ngss', name: 'Next Generation Science Standards (NGSS)',
    identity: 'an expert science educator specializing in the Next Generation Science Standards (NGSS) used across United States schools.',
    contextNote: 'Use United States contexts and phenomena throughout. Anchor learning in real-world phenomena and problems. Weave the three dimensions together: Disciplinary Core Ideas (DCIs), Science & Engineering Practices (SEPs), and Crosscutting Concepts (CCCs). Refer to grade bands K-2, 3-5, 6-8, 9-12 or the specific grade given.',
    strandLabel: 'Disciplinary Core Idea', subStrandLabel: 'Performance Expectation',
    assessmentStyle: 'NGSS-aligned assessment: phenomenon-based questions, explanation tasks, engineering design tasks, and SEP-focused performance items.',
    valuesGuidance: 'Encourage curiosity, evidence-based reasoning, environmental stewardship, and ethical use of science.',
    competenciesGuidance: 'Emphasize Science & Engineering Practices: asking questions, planning investigations, analyzing data, constructing explanations, and using models.',
  },
  teks: {
    ...US_BASE,
    id: 'teks', name: 'Texas Essential Knowledge and Skills (TEKS)',
    identity: 'an expert educator specializing in the Texas Essential Knowledge and Skills (TEKS) standards for Texas public schools.',
    contextNote: 'Use Texas contexts throughout: Texas history, geography, cities, and culture where relevant, plus USD and US resources. Align content to TEKS student expectations for the given grade and subject.',
  },
  'florida-best': {
    ...US_BASE,
    id: 'florida-best', name: 'Florida B.E.S.T. Standards',
    identity: 'an expert educator specializing in Florida Benchmark for Excellent Student Thinking (B.E.S.T.) standards.',
    contextNote: 'Use Florida and United States contexts throughout: Florida history, geography and culture where relevant, plus USD and US resources. Align content to Florida B.E.S.T. benchmarks and clarifications for the given grade.',
  },
  california: {
    ...US_BASE,
    id: 'california', name: 'California Content Standards',
    identity: 'an expert educator specializing in the California Content Standards (Common Core CA, NGSS CA, History-Social Science Framework).',
    contextNote: 'Use California and United States contexts throughout: California geography, history and culture where relevant, plus USD and US resources. Align content to the California Content Standards for the given grade and subject.',
  },
  'ny-state': {
    ...US_BASE,
    id: 'ny-state', name: 'New York State Next Generation Learning Standards',
    identity: 'an expert educator specializing in the New York State Next Generation Learning Standards.',
    contextNote: 'Use New York and United States contexts throughout: NY geography, history and culture where relevant, plus USD and US resources. Align content to the NYS Next Generation Learning Standards for the given grade.',
  },
  ap: {
    ...US_BASE,
    id: 'ap', name: 'Advanced Placement (AP)',
    identity: 'a college-level Advanced Placement (AP) instructor and curriculum designer for College Board AP courses.',
    contextNote: 'Use United States contexts and college-level rigor. Align content to the specific AP Course and Exam Description (CED): learning objectives (LOs), essential knowledge (EKs), and skills. Reference the AP exam format for the subject.',
    strandLabel: 'Unit', subStrandLabel: 'Topic / Learning Objective',
    assessmentStyle: 'AP-style assessment: multiple-choice and free-response questions matching the AP exam format, with clear scoring rubrics.',
    lessonDurationMinutes: 50,
    valuesGuidance: 'Model academic integrity, evidence-based argumentation, and disciplined inquiry.',
    competenciesGuidance: 'Build college-ready skills: source analysis, argumentation, quantitative reasoning, and subject-specific AP skills.',
  },
  'ged-hiset': {
    ...US_BASE,
    id: 'ged-hiset', name: 'GED / HiSET (High School Equivalency)',
    identity: 'an adult education instructor specializing in GED and HiSET high school equivalency test preparation.',
    contextNote: 'Use real-life, adult-oriented United States contexts: workplace, personal finance (USD), civic life, and everyday problem solving. Target adult learners preparing for the GED or HiSET exam.',
    strandLabel: 'Content Area', subStrandLabel: 'Topic / Skill',
    assessmentStyle: 'GED/HiSET-style assessment: multiple-choice and extended-response items mirroring the four test areas (Mathematical Reasoning, Reasoning Through Language Arts, Science, Social Studies).',
    defaultLessonsPerWeek: 4, termLabel: 'Module',
    valuesGuidance: 'Empower adult learners with confidence, persistence, and practical life-skills applications.',
    competenciesGuidance: 'Develop the skills measured by the GED/HiSET: reasoning through language arts, mathematical reasoning, science practices, and social studies practices.',
  },
  'us-homeschool': {
    ...US_BASE,
    id: 'us-homeschool', name: 'Homeschool / Custom',
    identity: 'a flexible, learner-centred educator for United States homeschool families.',
    contextNote: 'Use United States contexts throughout. Keep materials flexible, multi-age friendly, and adaptable to individual pacing. Suggest hands-on activities suitable for home learning with minimal equipment.',
    assessmentStyle: 'Homeschool-friendly assessment: portfolios, narration, observation, and informal checks rather than high-stakes exams.',
    defaultLessonsPerWeek: 4,
  },

  // ── United Kingdom ──
  cambridge: {
    id: 'cambridge', name: 'Cambridge International', country: 'GB',
    identity: 'a Cambridge International curriculum expert (Cambridge Primary, Lower Secondary, IGCSE and A Level pathways).',
    contextNote: 'Use British English and international contexts. Refer to Year levels (Year 1-13). Align to Cambridge syllabuses and assessment objectives.',
    strandLabel: 'Topic', subStrandLabel: 'Syllabus Point',
    objectiveStem: 'By the end of the lesson, learners will be able to',
    assessmentStyle: 'Cambridge-style assessment: structured questions and command words (state, describe, explain, evaluate) aligned to the syllabus.',
    lessonDurationMinutes: 45, defaultLessonsPerWeek: 5, termLabel: 'Term',
    valuesGuidance: 'Encourage respect, responsibility and international-mindedness.',
    competenciesGuidance: 'Develop Cambridge learner attributes: confident, responsible, reflective, innovative, engaged.',
  },
  gcse: {
    id: 'gcse', name: 'GCSE', country: 'GB',
    identity: 'a GCSE subject specialist for the English national curriculum and GCSE examinations.',
    contextNote: 'Use British English and UK contexts. Refer to Year 9-11 and GCSE qualification. Align to the relevant exam board specification (AQA, Edexcel, OCR, WJEC).',
    strandLabel: 'Topic', subStrandLabel: 'Specification Point',
    objectiveStem: 'By the end of the lesson, students will be able to',
    assessmentStyle: 'GCSE-style assessment: exam questions with mark schemes, command words, and grade descriptors (9-1).',
    lessonDurationMinutes: 50, defaultLessonsPerWeek: 4, termLabel: 'Term',
    valuesGuidance: 'Promote academic integrity, resilience and independent study.',
    competenciesGuidance: 'Develop examination skills: recall, application, analysis and evaluation to GCSE standard.',
  },
  'a-level': {
    id: 'a-level', name: 'A-Levels', country: 'GB',
    identity: 'an A Level subject specialist for UK Advanced Level qualifications.',
    contextNote: 'Use British English and UK contexts with A Level rigor. Refer to Year 12-13. Align to the relevant exam board specification.',
    strandLabel: 'Topic', subStrandLabel: 'Specification Point',
    objectiveStem: 'By the end of the lesson, students will be able to',
    assessmentStyle: 'A Level-style assessment: synoptic questions, extended response, and application to unfamiliar contexts.',
    lessonDurationMinutes: 55, defaultLessonsPerWeek: 5, termLabel: 'Term',
    valuesGuidance: 'Promote academic integrity, intellectual curiosity and independent study.',
    competenciesGuidance: 'Develop high-level skills: analysis, synthesis, evaluation and independent research.',
  },

  // ── South Africa ──
  caps: {
    id: 'caps', name: 'CAPS', country: 'ZA',
    identity: 'a South African curriculum expert specializing in the Curriculum and Assessment Policy Statement (CAPS).',
    contextNote: 'Use South African contexts throughout: ZAR currency, SA provinces, cultures, languages and geography. Refer to Grade R-12. Align to CAPS subject requirements.',
    strandLabel: 'Topic', subStrandLabel: 'Content / Concepts',
    objectiveStem: 'By the end of the lesson, learners will be able to',
    assessmentStyle: 'CAPS-aligned assessment: formal and informal tasks, with attention to cognitive levels (knowing, applying, reasoning, reflecting).',
    lessonDurationMinutes: 45, defaultLessonsPerWeek: 5, termLabel: 'Term',
    valuesGuidance: 'Promote ubuntu, respect for diversity, human dignity and social justice.',
    competenciesGuidance: 'Develop knowledge, skills and values required by the CAPS curriculum.',
  },
  ieb: {
    id: 'ieb', name: 'IEB', country: 'ZA',
    identity: 'a South African curriculum expert specializing in the Independent Examinations Board (IEB) syllabus.',
    contextNote: 'Use South African contexts throughout. Refer to Grade 10-12. Align to IEB subject assessment guidelines.',
    strandLabel: 'Topic', subStrandLabel: 'Content / Concepts',
    objectiveStem: 'By the end of the lesson, learners will be able to',
    assessmentStyle: 'IEB-style assessment: context-free questions, source-based questions, and extended writing aligned to IEB papers.',
    lessonDurationMinutes: 45, defaultLessonsPerWeek: 5, termLabel: 'Term',
    valuesGuidance: 'Promote independent thought, integrity and respect for diversity.',
    competenciesGuidance: 'Develop critical thinking, problem solving and analytical writing.',
  },

  // ── Nigeria ──
  nerdc: {
    id: 'nerdc', name: 'NERDC / UBE', country: 'NG',
    identity: 'a Nigerian curriculum expert specializing in the NERDC / Universal Basic Education (UBE) curriculum.',
    contextNote: 'Use Nigerian contexts throughout: NGN currency, Nigerian states, cultures, languages and geography. Refer to Primary 1-6, JSS 1-3, SSS 1-3. Align to NERDC thematic curriculum.',
    strandLabel: 'Theme', subStrandLabel: 'Topic',
    objectiveStem: 'By the end of the lesson, learners should be able to',
    assessmentStyle: 'NERDC-aligned assessment: continuous assessment, class exercises and objective/subjective tests.',
    lessonDurationMinutes: 40, defaultLessonsPerWeek: 5, termLabel: 'Term',
    valuesGuidance: 'Promote national values: integrity, honesty, respect, hard work and citizenship.',
    competenciesGuidance: 'Develop literacy, numeracy, life skills and vocational skills.',
  },

  // ── India ──
  cbse: {
    id: 'cbse', name: 'CBSE', country: 'IN',
    identity: 'a CBSE curriculum expert for the Central Board of Secondary Education (India).',
    contextNote: 'Use Indian contexts throughout: INR currency, Indian states, geography, culture and current events. Refer to Class 1-12. Align to NCERT/CBSE syllabus.',
    strandLabel: 'Unit', subStrandLabel: 'Topic',
    objectiveStem: 'By the end of the lesson, students will be able to',
    assessmentStyle: 'CBSE-style assessment: objective and descriptive questions, competency-based items, and value-based questions.',
    lessonDurationMinutes: 40, defaultLessonsPerWeek: 5, termLabel: 'Term',
    valuesGuidance: 'Promote universal human values and Indian constitutional values.',
    competenciesGuidance: 'Develop conceptual understanding, application, and analytical thinking as per NEP 2020.',
  },
  icse: {
    id: 'icse', name: 'ICSE', country: 'IN',
    identity: 'a CISCE/ICSE curriculum expert for the Indian Certificate of Secondary Education.',
    contextNote: 'Use Indian contexts throughout. Refer to Class 1-12. Align to CISCE syllabuses.',
    strandLabel: 'Unit', subStrandLabel: 'Topic',
    objectiveStem: 'By the end of the lesson, students will be able to',
    assessmentStyle: 'ICSE-style assessment: structured questions, and internal assessment components.',
    lessonDurationMinutes: 40, defaultLessonsPerWeek: 5, termLabel: 'Term',
    valuesGuidance: 'Promote universal human values and academic integrity.',
    competenciesGuidance: 'Develop conceptual understanding, application and analytical thinking.',
  },

  // ── International ──
  igcse: {
    id: 'igcse', name: 'IGCSE', country: 'INT',
    identity: 'an international curriculum expert specializing in the Cambridge IGCSE.',
    contextNote: 'Use international and British English contexts. Refer to Year 10-11. Align to the Cambridge IGCSE syllabus for the subject.',
    strandLabel: 'Topic', subStrandLabel: 'Syllabus Point',
    objectiveStem: 'By the end of the lesson, learners will be able to',
    assessmentStyle: 'IGCSE-style assessment: structured questions and command words aligned to the syllabus.',
    lessonDurationMinutes: 45, defaultLessonsPerWeek: 5, termLabel: 'Term',
    valuesGuidance: 'Encourage respect, responsibility and international-mindedness.',
    competenciesGuidance: 'Develop Cambridge learner attributes and assessment objectives.',
  },
  ib: {
    id: 'ib', name: 'International Baccalaureate (IB)', country: 'INT',
    identity: 'an International Baccalaureate (IB) curriculum expert (IBDP / MYP).',
    contextNote: 'Use international contexts and inquiry-based learning. Refer to IBDP Year 1-2 (Grade 11-12). Align to IB subject guides, assessment objectives, and the IB learner profile.',
    strandLabel: 'Unit', subStrandLabel: 'Topic / Statement of Inquiry',
    objectiveStem: 'By the end of the lesson, students will be able to',
    assessmentStyle: 'IB-style assessment: essays, data-based questions, and internal assessment components aligned to IB criteria.',
    lessonDurationMinutes: 50, defaultLessonsPerWeek: 5, termLabel: 'Unit',
    valuesGuidance: 'Promote the IB learner profile: inquirers, knowledgeable, thinkers, communicators, principled, open-minded, caring, risk-takers, balanced, reflective.',
    competenciesGuidance: 'Develop ATL skills (approaches to learning): thinking, research, communication, social and self-management skills.',
  },
  general: {
    id: 'general', name: 'General', country: 'INT',
    identity: 'a versatile, knowledgeable educator creating inclusive learning materials.',
    contextNote: 'Use clear, widely accessible examples. Adapt terminology to the grade level and subject provided.',
    strandLabel: 'Unit', subStrandLabel: 'Topic',
    objectiveStem: 'By the end of the lesson, students will be able to',
    assessmentStyle: 'Balanced assessment: formative and summative checks appropriate to the subject and age group.',
    lessonDurationMinutes: 45, defaultLessonsPerWeek: 5, termLabel: 'Term',
    valuesGuidance: 'Reinforce respect, responsibility, honesty and teamwork.',
    competenciesGuidance: 'Develop critical thinking, problem solving, collaboration and communication skills.',
  },
}

const FALLBACK: CurriculumPromptProfile = PROFILES.general

export function getCurriculumProfile(curriculumId?: string | null, country?: string | null): CurriculumPromptProfile {
  if (curriculumId && PROFILES[curriculumId]) return PROFILES[curriculumId]
  if (country) {
    const match = Object.values(PROFILES).find(p => p.country === country)
    if (match) return match
  }
  return FALLBACK
}

/** Build the full curriculum context block for lesson-plan generation. */
export function buildCurriculumLessonContext(opts: {
  curriculum?: string | null
  country?: string | null
  grade?: string
  subject?: string
}): string {
  const p = getCurriculumProfile(opts.curriculum, opts.country)
  return [
    `CURRICULUM: ${p.name} (${p.country}). You are ${p.identity}`,
    `CONTEXT: ${p.contextNote}`,
    `TERMINOLOGY: In this curriculum, "strand" means ${p.strandLabel} and "subStrand" means ${p.subStrandLabel}. Fill these JSON fields using the correct terminology for ${p.name}.`,
    `OBJECTIVES: Use the stem "${p.objectiveStem}" for learning outcomes.`,
    `VALUES: ${p.valuesGuidance}`,
    `COMPETENCIES: ${p.competenciesGuidance}`,
    `ASSESSMENT: ${p.assessmentStyle}`,
    opts.grade ? `GRADE: ${opts.grade}` : '',
    opts.subject ? `SUBJECT: ${opts.subject}` : '',
    `LESSON DURATION: default ${p.lessonDurationMinutes} minutes per lesson.`,
  ].filter(Boolean).join('\n')
}

/** Build the full curriculum context block for scheme-of-work generation. */
export function buildCurriculumSchemeContext(opts: {
  curriculum?: string | null
  country?: string | null
  grade?: string
  subject?: string
}): string {
  const p = getCurriculumProfile(opts.curriculum, opts.country)
  return [
    `CURRICULUM: ${p.name} (${p.country}). You are ${p.identity}`,
    `CONTEXT: ${p.contextNote}`,
    `TERMINOLOGY: In this curriculum, "strand" means ${p.strandLabel} and "subStrand" means ${p.subStrandLabel}. Fill the scheme columns using the correct terminology for ${p.name}.`,
    `OBJECTIVES: Use the stem "${p.objectiveStem}" for learning outcomes.`,
    `VALUES: ${p.valuesGuidance}`,
    `COMPETENCIES: ${p.competenciesGuidance}`,
    `ASSESSMENT: ${p.assessmentStyle}`,
    opts.grade ? `GRADE: ${opts.grade}` : '',
    opts.subject ? `SUBJECT: ${opts.subject}` : '',
    `TERM: ${p.termLabel} structure. Default ${p.defaultLessonsPerWeek} lessons per week.`,
  ].filter(Boolean).join('\n')
}

/** Build the full curriculum context block for assessment/exam generation. */
export function buildCurriculumAssessmentContext(opts: {
  curriculum?: string | null
  country?: string | null
  grade?: string
  subject?: string
}): string {
  const p = getCurriculumProfile(opts.curriculum, opts.country)
  return [
    `CURRICULUM: ${p.name} (${p.country}). You are ${p.identity}`,
    `CONTEXT: ${p.contextNote}`,
    `OBJECTIVES: Assess against the stem "${p.objectiveStem}" for this curriculum.`,
    `ASSESSMENT: ${p.assessmentStyle}`,
    opts.grade ? `GRADE: ${opts.grade}` : '',
    opts.subject ? `SUBJECT: ${opts.subject}` : '',
  ].filter(Boolean).join('\n')
}
