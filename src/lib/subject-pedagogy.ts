/**
 * Subject-specific pedagogy definitions.
 * Each subject family gets unique prompt augmentations so the AI generates
 * subject-appropriate content rather than one-size-fits-all plans.
 */

export interface SubjectPedagogy {
  /** The pedagogical approach unique to this subject */
  approach: string
  /** Subject-specific lesson structure modifications */
  structureGuidance: string
  /** What the AI should emphasise in organisation of learning */
  activityGuidance: string
  /** Subject-specific assessment methods */
  assessmentGuidance: string
  /** Subject-specific resources and materials */
  resourceGuidance: string
  /** What the AI should generate that other subjects don't need */
  extraFields: string
}

const MATH_PEDAGOGY: SubjectPedagogy = {
  approach: 'Mathematics requires a concrete-to-abstract progression. Start with real-world context or manipulatives, move to visual representation, then to abstract symbols and formulas.',
  structureGuidance: `Structure mathematics lessons as:
1. Warm-up / Prior Knowledge Activation (5 min): Quick mental maths, number talk, or review of prerequisite skill
2. Introduction with Real Context (5-8 min): Present a real-world problem that requires the new concept
3. Guided Practice / Direct Instruction (12-15 min): Model the procedure step-by-step with worked examples. Show multiple solution strategies where applicable.
4. Independent Practice (10-12 min): Scaffolded problems from simple to complex. Include at least one non-routine problem.
5. Closure (3-5 min): Summarise the key mathematical rule or formula. Exit ticket.`,
  activityGuidance: 'Include specific mathematical procedures: showing working, labelling diagrams, writing formulae, using mathematical vocabulary precisely. Every worked example must show full step-by-step calculations. Include mental maths strategies, estimation checks, and alternative solution methods.',
  assessmentGuidance: 'Use formative assessment checkpoints within the lesson: "Show me" problems, mini-whiteboard questions, think-pair-share on a calculation. Include at least 2 diagnostic questions that reveal common misconceptions. Assessment should test procedural fluency AND conceptual understanding.',
  resourceGuidance: 'List specific mathematical tools: rulers, protractors, calculators (where appropriate), graph paper, counters, number lines, hundred squares. Reference specific textbook pages, worksheets, or online tools (e.g., GeoGebra, Desmos) where available.',
  extraFields: 'Include a "Common Misconceptions" section listing 2-3 typical errors students make with this topic and how to address them. Include mathematical vocabulary with precise definitions. Show at least one fully worked example with all steps visible.',
}

const SCIENCE_PEDAGOGY: SubjectPedagogy = {
  approach: 'Science follows the inquiry cycle: Engage → Explore → Explain → Elaborate → Evaluate (5E model). Every lesson should involve observation, questioning, and evidence-based reasoning.',
  structureGuidance: `Structure science lessons using the 5E model:
1. Engage (5 min): Hook with a demonstration, puzzling observation, video clip, or provocative question
2. Explore (10-12 min): Hands-on activity, experiment, observation task, or data collection
3. Explain (10-12 min): Students share findings; teacher introduces scientific vocabulary and concepts. Connect observations to scientific principles.
4. Elaborate (8-10 min): Apply the concept to a new context. Include cross-curricular links ( maths for data, geography for earth science).
5. Evaluate (5 min): Formative assessment — concept check questions, exit ticket, or application problem.`,
  activityGuidance: 'Every science lesson must include at least one hands-on or minds-on activity. Describe the materials needed, safety considerations, and expected student observations. Include scientific method steps: hypothesis, experiment design, data collection, analysis, conclusion. Use real Kenyan/African/local examples where possible (local plants, weather, geology).',
  assessmentGuidance: 'Use claim-evidence-reasoning (CER) framework. Include observation checklists for practical work. Assessment should test both content knowledge and science practices (designing investigations, analysing data, drawing conclusions). Include at least one question requiring explanation with evidence.',
  resourceGuidance: 'List specific laboratory materials, specimens, or models needed. Reference practical equipment (microscopes, thermometers, beakers). Include safety equipment requirements. Mention any digital resources (simulations, videos, data sets).',
  extraFields: 'Include "Scientific Vocabulary" with precise definitions. List "Safety Considerations" for any practical work. Include "Expected Student Observations" so the teacher knows what students should discover. Add cross-curricular connections to Mathematics (data handling) and Social Studies (environmental issues).',
}

const ELA_PEDAGOGY: SubjectPedagogy = {
  approach: 'English Language Arts follows a balanced literacy approach: reading, writing, speaking, and listening are integrated in every lesson. Use gradual release of responsibility (I do → We do → You do).',
  structureGuidance: `Structure ELA lessons using the Workshop Model:
1. Mini-Lesson (10 min): Teach one specific reading/writing skill with a short mentor text example
2. Guided Practice (10 min): Shared reading or collaborative writing applying the skill
3. Independent Reading/Writing (15-20 min): Students apply the skill to their own text/book
4. Share/Conference (5 min): Students share a sentence, paragraph, or insight. Teacher confers with 2-3 students.`,
  activityGuidance: 'Include specific reading comprehension strategies: predicting, questioning, clarifying, summarising, visualising, inferring. For writing: model the writing process (plan, draft, revise, edit, publish). Include vocabulary instruction with word wall words, context clues strategy, and morphology (prefixes, suffixes, roots). Reference specific genres: narrative, informational, persuasive, poetry.',
  assessmentGuidance: 'Use running records, comprehension questions at multiple Bloom\'s levels, vocabulary quizzes, writing rubrics. Include self-assessment and peer-assessment opportunities. Assess reading fluency, comprehension depth, and writing conventions.',
  resourceGuidance: 'Reference specific texts, leveled readers, anchor charts, word walls. Include digital tools (reading apps, writing platforms). List materials: chart paper, markers, individual whiteboards, book bins.',
  extraFields: 'Include "Vocabulary Focus" with 5-8 key words, definitions, and example sentences. List "Mentor Text" references. Include "Differentiated Reading Levels" for the independent practice. Add "Writing Prompt" options at different complexity levels.',
}

const SOCIAL_STUDIES_PEDAGOGY: SubjectPedagogy = {
  approach: 'Social Studies develops informed, critical citizens through inquiry-based investigation of history, geography, civics, and economics. Every lesson connects past events to present-day relevance.',
  structureGuidance: `Structure social studies lessons as:
1. Hook / Provocation (5 min): Primary source, photograph, map, artefact, or thought-provoking question
2. Inquiry Investigation (15 min): Students examine multiple sources, analyse evidence, discuss perspectives
3. Direct Instruction / Concept Building (10 min): Teacher introduces key concepts, vocabulary, and historical context
4. Application / Connection (10 min): Students connect learning to current events, local community, or personal experience
5. Reflection / Assessment (5 min): Written reflection, discussion, or exit ticket.`,
  activityGuidance: 'Include primary source analysis (documents, photographs, maps, artefacts). Use structured academic controversy or Socratic seminar for controversial topics. Include map skills, timeline construction, data analysis from charts/graphs. Always connect to the learner\'s own community, county, and country.',
  assessmentGuidance: 'Use document-based questions (DBQ), source analysis, geographic reasoning, and civic action projects. Include both content knowledge and skills (source evaluation, map reading, data interpretation).',
  resourceGuidance: 'Reference primary source collections, atlases, maps, timeline materials, current news articles, community resources. Include digital tools (Google Earth, interactive timelines, news sites).',
  extraFields: 'Include "Primary Sources" needed for the lesson. Add "Current Events Connection" linking the topic to today. List "Geographic Skills" if applicable. Include "Civic Action" suggestion for service-learning extension.',
}

const KISWAHILI_PEDAGOGY: SubjectPedagogy = {
  approach: 'Kiswahili instruction follows immersiya (immersion) principles: maximum target-language use, communicative competence, and cultural authenticity. Use real texts and authentic materials.',
  structureGuidance: `Structure Kiswahili lessons as:
1. Mshawasha / Motivation (5 min): Hadithi fupi (short story), wimbo (song), au picha (picture) to engage
2. Msamiati / Vocabulary (5 min): Introduce 5-8 new words with gestures, pictures, and context
3. Shofo / Modelling (10 min): Read aloud or demonstrate the language skill with full text
4. Mazoezi / Practice (15 min): Communicative activities — role-play, dialogue, pair work, writing
5. Tathmini / Assessment (5 min): Quick check — matching, fill-in, oral presentation`,
  activityGuidance: 'Prioritise oral communication: listening comprehension, speaking, storytelling, drama. Include reading comprehension with age-appropriate Kiswahili texts. Writing activities should move from copying to guided to free composition. Use Kiswahili cultural contexts: utanii (proverbs), hadithi za mazingira (folktales), nyimbo za elimu (educational songs).',
  assessmentGuidance: 'Use oral proficiency checks, reading comprehension passages with questions, writing samples, and vocabulary tests. Include self and peer assessment in Kiswahili.',
  resourceGuidance: 'Reference Kiswahili textbooks, graded readers, oral literature collections, song lyrics. Include visual aids with Kiswahili labels.',
  extraFields: 'Include "Maneno Mapya" (new words) with Kiswahili definitions and example sentences. Add "Utani wa Kiswahili" (Kiswahili proverb) related to the topic. Include "Shughuli za Kuzungumza" (speaking activities).',
}

/** Map subject name patterns to their pedagogy */
const SUBJECT_PEDAGOGY_MAP: Record<string, SubjectPedagogy> = {
  // Mathematics family
  'math': MATH_PEDAGOGY,
  'mathematics': MATH_PEDAGOGY,
  'maths': MATH_PEDAGOGY,
  'essential mathematics': MATH_PEDAGOGY,
  'mathematical activities': MATH_PEDAGOGY,
  'numeracy': MATH_PEDAGOGY,
  'pre-technical': MATH_PEDAGOGY,

  // Science family
  'science': SCIENCE_PEDAGOGY,
  'integrated science': SCIENCE_PEDAGOGY,
  'science and technology': SCIENCE_PEDAGOGY,
  'science & technology': SCIENCE_PEDAGOGY,
  'environmental activities': SCIENCE_PEDAGOGY,
  'agriculture': SCIENCE_PEDAGOGY,
  'agriculture and nutrition': SCIENCE_PEDAGOGY,
  'agriculture & nutrition': SCIENCE_PEDAGOGY,

  // ELA family
  'english': ELA_PEDAGOGY,
  'english activities': ELA_PEDAGOGY,
  'english language': ELA_PEDAGOGY,
  'language': ELA_PEDAGOGY,
  'literacy': ELA_PEDAGOGY,
  'kiswahili': KISWAHILI_PEDAGOGY,
  'kiswahili activities': KISWAHILI_PEDAGOGY,
  'shughuli za kiswahili': KISWAHILI_PEDAGOGY,
  'kenya sign language': KISWAHILI_PEDAGOGY,

  // Social Studies family
  'social studies': SOCIAL_STUDIES_PEDAGOGY,
  'social studies activities': SOCIAL_STUDIES_PEDAGOGY,
  'history': SOCIAL_STUDIES_PEDAGOGY,
  'geography': SOCIAL_STUDIES_PEDAGOGY,
  'civics': SOCIAL_STUDIES_PEDAGOGY,
  'citizenship': SOCIAL_STUDIES_PEDAGOGY,
}

/**
 * Get the subject-specific pedagogy for a given subject name.
 * Returns null for subjects without special pedagogy (arts, PE, music, etc.)
 * — these use the generic prompt.
 */
export function getSubjectPedagogy(subject: string): SubjectPedagogy | null {
  const key = subject.toLowerCase().trim()
  return SUBJECT_PEDAGOGY_MAP[key] || null
}

/**
 * Build a subject-pedagogy prompt block for injection into AI system prompts.
 * Returns empty string if no subject-specific pedagogy is defined.
 */
export function buildSubjectPedagogySection(subject: string): string {
  const pedagogy = getSubjectPedagogy(subject)
  if (!pedagogy) return ''

  const lines: string[] = []
  lines.push('## SUBJECT-SPECIFIC PEDAGOGY')
  lines.push(`Approach: ${pedagogy.approach}`)
  lines.push('')
  lines.push(`Lesson Structure: ${pedagogy.structureGuidance}`)
  lines.push('')
  lines.push(`Activity Requirements: ${pedagogy.activityGuidance}`)
  lines.push('')
  lines.push(`Assessment Approach: ${pedagogy.assessmentGuidance}`)
  lines.push('')
  lines.push(`Resources: ${pedagogy.resourceGuidance}`)
  lines.push('')
  lines.push(`Additional Requirements: ${pedagogy.extraFields}`)
  lines.push('')
  lines.push('---')
  lines.push('')

  return lines.join('\n')
}

/**
 * Get the recommended Bloom's taxonomy levels for a given subject.
 */
export function getRecommendedBloomLevels(subject: string): string[] {
  const key = subject.toLowerCase().trim()
  if (['math', 'mathematics', 'maths', 'essential mathematics'].includes(key)) {
    return ['Apply', 'Analyse', 'Evaluate', 'Create']
  }
  if (key.includes('science')) {
    return ['Understand', 'Apply', 'Analyse', 'Evaluate']
  }
  if (['english', 'language', 'literacy', 'kiswahili'].some(s => key.includes(s))) {
    return ['Understand', 'Apply', 'Analyse', 'Create', 'Evaluate']
  }
  if (['social studies', 'history', 'geography', 'civics'].some(s => key.includes(s))) {
    return ['Understand', 'Analyse', 'Evaluate', 'Create']
  }
  return ['Remember', 'Understand', 'Apply', 'Analyse']
}
