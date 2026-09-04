/**
 * Grade-band intelligence.
 * Provides age-appropriate pedagogical guidance, reading levels,
 * cognitive expectations, and lesson structure adaptations
 * for four developmental bands.
 */

export type GradeBand = 'early_childhood' | 'primary' | 'junior_secondary' | 'senior_secondary' | 'adult'

export interface GradeBandProfile {
  id: GradeBand
  label: string
  gradeRange: string
  /** Approximate age range */
  ageRange: string
  /** Maximum recommended lesson duration in minutes */
  maxLessonDuration: number
  /** Recommended lesson structure phases */
  structurePhases: string[]
  /** Cognitive level description */
  cognitiveLevel: string
  /** Reading level guidance for AI content generation */
  readingLevel: string
  /** Vocabulary complexity */
  vocabularyLevel: string
  /** Types of activities appropriate for this band */
  activityTypes: string[]
  /** Assessment methods appropriate for this band */
  assessmentMethods: string[]
  /** What the AI should avoid (e.g., abstract reasoning for early childhood) */
  avoid: string[]
  /** Special considerations */
  considerations: string[]
  /** Max words for generated content */
  contentWordLimit: number
  /** Bloom's taxonomy starting level */
  bloomStartLevel: string
}

const GRADE_BAND_PROFILES: Record<GradeBand, GradeBandProfile> = {
  early_childhood: {
    id: 'early_childhood',
    label: 'Early Childhood Development (ECD)',
    gradeRange: 'PP1 - PP2',
    ageRange: '4-6 years',
    maxLessonDuration: 30,
    structurePhases: [
      'Circle Time / Song (5 min)',
      'Story / Demonstration (5 min)',
      'Hands-on Activity (10 min)',
      'Play-based Practice (5 min)',
      'Clean-up and Sharing (5 min)',
    ],
    cognitiveLevel: 'Pre-operational: concrete, sensory-based learning. Children learn through play, exploration, and direct experience. Abstract concepts must be represented with physical objects.',
    readingLevel: 'Emergent literacy. Use very simple sentences (5-8 words). Heavy use of visual support: pictures, icons, colour coding. No paragraphs — use bullet points with images.',
    vocabularyLevel: 'Everyday words only. Introduce 2-3 new words per lesson with visual support. Use repetition. No abstract academic vocabulary.',
    activityTypes: ['Singing and chanting', 'Colouring and drawing', 'Sorting and matching', 'Storytelling and role play', 'Sand/water play', 'Movement and dance', 'Cutting and pasting', 'Simple counting with objects'],
    assessmentMethods: ['Observation checklists', 'Anecdotal notes', 'Photo evidence', 'Portfolio samples', 'Show and tell', 'Simple matching tasks'],
    avoid: ['Abstract reasoning or inference', 'Long written instructions', 'Extended independent work', 'Complex multi-step directions', 'Text-heavy materials', 'Timed activities', 'Competitive activities'],
    considerations: ['Short attention span (5-10 minutes per activity)', 'Need for movement and physical activity', 'Social-emotional learning is primary focus', 'Bilingual/multilingual support needed', 'Play is the primary learning vehicle', 'Establish routines and clear transitions'],
    contentWordLimit: 400,
    bloomStartLevel: 'Remember',
  },
  primary: {
    id: 'primary',
    label: 'Primary School',
    gradeRange: 'Grade 1 - Grade 6',
    ageRange: '6-12 years',
    maxLessonDuration: 40,
    structurePhases: [
      'Warm-up / Review (5 min)',
      'Introduction / Hook (5 min)',
      'Direct Instruction / Modelling (10 min)',
      'Guided Practice (10 min)',
      'Independent Practice (5 min)',
      'Closure / Exit Ticket (5 min)',
    ],
    cognitiveLevel: 'Concrete operational (Grades 1-3): learning through manipulation and visual representation. Transitional (Grades 4-6): beginning abstract thought, can handle simple hypotheses and comparisons.',
    readingLevel: 'Developing readers. Use short paragraphs (3-5 sentences). Include tiered vocabulary with definitions. Support with visuals. Grades 1-3: mostly instructional text with images. Grades 4-6: can handle longer passages with comprehension support.',
    vocabularyLevel: 'Build academic vocabulary progressively. Define domain-specific terms. Use context clues and word families. Grades 1-3: 5-8 key words per lesson. Grades 4-6: 8-12 key words per lesson.',
    activityTypes: ['Guided reading', 'Collaborative pair work', 'Graphic organisers', 'Hands-on experiments', 'Math manipulatives', 'Drawing and labelling', 'Creative writing', 'Group projects', 'Games and competitions', 'Field observations'],
    assessmentMethods: ['Quizzes', 'Worksheets', 'Projects', 'Oral presentations', 'Peer assessment', 'Self-assessment journals', 'Portfolio assessments', 'Observation checklists'],
    avoid: ['Extended lecture-style instruction', 'Purely text-based learning', 'High-stakes testing pressure', 'Overly abstract concepts without concrete support', 'Long independent worksheets'],
    considerations: ['Developing attention span (15-25 minutes)', 'Need for variety and movement', 'Social learning is important', 'Concrete examples before abstract concepts', 'Culturally relevant content', 'Differentiated instruction needed'],
    contentWordLimit: 600,
    bloomStartLevel: 'Understand',
  },
  junior_secondary: {
    id: 'junior_secondary',
    label: 'Junior Secondary School',
    gradeRange: 'Grade 7 - Grade 9',
    ageRange: '12-15 years',
    maxLessonDuration: 45,
    structurePhases: [
      'Do Now / Bell Ringer (5 min)',
      'Hook / Real-world Connection (5 min)',
      'Direct Instruction / Discussion (10 min)',
      'Guided Practice / Lab (12 min)',
      'Independent Practice / Application (8 min)',
      'Closure / Reflection (5 min)',
    ],
    cognitiveLevel: 'Early formal operational: developing abstract reasoning, can handle hypothetical scenarios, beginning to think critically about evidence. Can engage in debate and structured argument.',
    readingLevel: 'Can handle textbook-length passages. Use varied text types: narratives, reports, instructions, persuasive texts. Include comprehension strategies (predicting, questioning, summarising).',
    vocabularyLevel: 'Build subject-specific terminology systematically. Use word walls, glossaries, and morphological analysis. Can handle Latin/Greek roots. 10-15 key terms per lesson.',
    activityTypes: ['Laboratory investigations', 'Research projects', 'Socratic seminars', 'Debates', 'Data analysis', 'Case studies', 'Technology-enhanced learning', 'Community surveys', 'Model building', 'Presentations'],
    assessmentMethods: ['Formative quizzes', 'Lab reports', 'Research essays', 'Project-based assessment', 'Peer review', 'Self-reflection journals', 'Standardised practice tests', 'Portfolio reviews'],
    avoid: ['Overly simplistic content', 'Pure memorisation tasks', 'Talking down to students', 'Ignoring their growing independence', 'Avoiding controversial topics entirely'],
    considerations: ['Developing identity and autonomy', 'Peer influence is strong', 'Need for relevance and real-world connections', 'Growing capacity for self-directed learning', 'Digital literacy is developing', 'Career awareness begins'],
    contentWordLimit: 1000,
    bloomStartLevel: 'Apply',
  },
  senior_secondary: {
    id: 'senior_secondary',
    label: 'Senior Secondary School',
    gradeRange: 'Grade 10 - Grade 12',
    ageRange: '15-18 years',
    maxLessonDuration: 55,
    structurePhases: [
      'Bell Ringer / Retrieval Practice (5 min)',
      'Mini-Lecture / Expert Input (12 min)',
      'Structured Practice / Discussion (12 min)',
      'Independent Deep Work (15 min)',
      'Meta-cognitive Reflection (5 min)',
    ],
    cognitiveLevel: 'Formal operational: abstract reasoning, hypothetical-deductive thinking, metacognition. Can handle complex texts, multi-step problems, and nuanced arguments. Ready for exam preparation.',
    readingLevel: 'Academic reading level. Can handle textbooks, journal articles, primary sources. Should be challenged with complex texts. Include annotation strategies and critical reading.',
    vocabularyLevel: 'Technical and discipline-specific terminology expected. Use precise definitions. Can handle jargon with explicit teaching. 15-20 key terms per lesson.',
    activityTypes: ['Laboratory investigations (extended)', 'Independent research', 'Academic writing', 'Socratic seminar', 'Mock examinations', 'Case study analysis', 'Policy debates', 'Data interpretation', 'Literature analysis', 'Engineering design challenges'],
    assessmentMethods: ['Past paper practice', 'Extended essays', 'Research projects', 'Laboratory practicals', 'Oral examinations', 'Portfolio assessment', 'Standardised test preparation', 'Self and peer evaluation'],
    avoid: ['Over-scaffolding', 'Treating them as passive recipients', 'Ignoring exam preparation needs', 'Disconnecting from career pathways', 'Avoiding intellectual challenge'],
    considerations: ['Exam pressure and stress management', 'Career planning and university preparation', 'Need for intellectual challenge and depth', 'Growing independence and self-direction', 'Social and emotional development', 'Time management skills needed'],
    contentWordLimit: 1500,
    bloomStartLevel: 'Analyse',
  },
  adult: {
    id: 'adult',
    label: 'Adult Learner (GED / High-School Equivalency)',
    gradeRange: 'Adult',
    ageRange: '16+ (typically 18-65)',
    maxLessonDuration: 60,
    structurePhases: [
      'Purpose / Why it matters (5 min)',
      'Pre-assessment / GED-style prompt (5 min)',
      'Direct Instruction / Worked Example (15 min)',
      'Guided Practice (15 min)',
      'Independent / Real-life Application (12 min)',
      'Self-check & Next Steps (8 min)',
    ],
    cognitiveLevel: 'Formal operational to post-formal. Adults are autonomous, self-directed learners with rich life experience. They reason abstractly, value relevance and efficiency, and learn best when content connects directly to work, money, family, and civic life.',
    readingLevel: 'Adult reading level. Can handle formal texts and GED-style passages. Respectful, plain language first, technical terms introduced with clear explanations. Premium on comprehension and application over memorisation.',
    vocabularyLevel: 'Adult and discipline-specific terminology, taught in context. Define GED test vocabulary (e.g. "inference", "primary source", "variable"). 10-15 key terms per lesson, each with a plain-language definition and example.',
    activityTypes: ['GED-style multiple choice', 'Worked examples', 'Real-life case studies', 'Budgeting / workplace applications', 'Extended response practice', 'Self-assessment checklists', 'Test-taking strategy practice', 'Discussion of real-world scenarios'],
    assessmentMethods: ['Timed GED-style practice questions', 'Scored practice tests (100-200 scale)', 'Self-assessment against exam readiness', 'Application scenarios', 'Progress mastery tracking', 'Mock-exam readiness checks'],
    avoid: ['Talking down or oversimplifying', 'Childish examples or fonts', 'Memorisation without application', 'Assuming prior school knowledge', 'Shame around learning gaps', 'Long unstructured lectures'],
    considerations: ['Self-directed and goal-oriented — surface the "why" for every topic', 'Valuing prior life/work experience as an asset', 'May be returning to study after years away — reduce jargon and anxiety', 'Time-poor (work, family) — make lessons efficient and high-yield', 'GED exam is time-limited — build speed and test strategy', 'Confidence matters — give frequent, explicit wins'],
    contentWordLimit: 1500,
    bloomStartLevel: 'Apply',
  },
}

/** Map grade string to grade band */
export function getGradeBand(grade: string): GradeBand {
  const g = grade.toLowerCase().trim()

  // Adult / GED / high-school-equivalency learners
  if (g === 'adult' || g.includes('adult') || g.includes('ged') || g.includes('hiset') || g.includes('high school equivalency') || g === 'continuing education') {
    return 'adult'
  }

  // ECD
  if (g.includes('pp1') || g.includes('pp2') || g.includes('pre-primary') || g.includes('pre primary') || g.includes('kindergarten') || g.includes('kg')) {
    return 'early_childhood'
  }

  // Primary (Grade 1-6)
  const gradeNum = parseInt(g.replace(/[^0-9]/g, ''))
  if (!isNaN(gradeNum)) {
    if (gradeNum >= 1 && gradeNum <= 6) return 'primary'
    if (gradeNum >= 7 && gradeNum <= 9) return 'junior_secondary'
    if (gradeNum >= 10 && gradeNum <= 13) return 'senior_secondary'
  }

  // UK year system
  if (g.includes('year')) {
    const yearNum = parseInt(g.replace(/[^0-9]/g, ''))
    if (!isNaN(yearNum)) {
      if (yearNum <= 6) return 'primary'
      if (yearNum <= 9) return 'junior_secondary'
      return 'senior_secondary'
    }
  }

  // Form system (8-4-4)
  if (g.includes('form')) {
    return 'junior_secondary'
  }

  // Default to primary for unknown
  return 'primary'
}

/** Get the profile for a grade band */
export function getGradeBandProfile(grade: string): GradeBandProfile {
  return GRADE_BAND_PROFILES[getGradeBand(grade)]
}

/**
 * Build a grade-band prompt section for injection into AI system prompts.
 * Adapts content expectations, reading level, and cognitive demand.
 */
export function buildGradeBandSection(grade: string): string {
  const band = getGradeBandProfile(grade)
  const lines: string[] = []

  lines.push('## GRADE-APPROPRIATE ADAPTATIONS')
  lines.push(`Grade Band: ${band.label} (${band.gradeRange}, ages ${band.ageRange})`)
  lines.push(`Maximum lesson duration: ${band.maxLessonDuration} minutes`)
  lines.push(`Cognitive level: ${band.cognitiveLevel}`)
  lines.push(`Reading level: ${band.readingLevel}`)
  lines.push(`Vocabulary complexity: ${band.vocabularyLevel}`)
  lines.push(`Bloom's starting level: ${band.bloomStartLevel}`)
  lines.push('')
  lines.push(`Recommended lesson phases: ${band.structurePhases.join(' → ')}`)
  lines.push('')
  lines.push(`Appropriate activity types: ${band.activityTypes.join(', ')}`)
  lines.push('')
  lines.push(`Assessment methods: ${band.assessmentMethods.join(', ')}`)
  lines.push('')
  lines.push(`AVOID: ${band.avoid.join('; ')}`)
  lines.push('')
  lines.push(`Special considerations: ${band.considerations.join('; ')}`)
  lines.push('')
  lines.push(`Content word limit: ~${band.contentWordLimit} words for generated content`)
  lines.push('')
  lines.push('---')
  lines.push('')

  return lines.join('\n')
}

/** Get the recommended max content word limit for a grade */
export function getContentWordLimit(grade: string): number {
  return getGradeBandProfile(grade).contentWordLimit
}
