export const CBC_CORE_COMPETENCIES = [
  'Communication and collaboration',
  'Critical thinking and problem solving',
  'Creativity and imagination',
  'Citizenship',
  'Digital literacy',
  'Learning to learn',
  'Self-efficacy',
]

export const CBC_VALUES = [
  'Respect',
  'Responsibility',
  'Love',
  'Peace',
  'Unity',
  'Patriotism',
  'Integrity',
  'Social justice',
]

export const CBC_PCIS = [
  'Life skills and values',
  'Health education',
  'Environmental education',
  'Financial literacy',
  'Career guidance',
  'Gender issues',
  'Child rights',
  'Human rights',
  'Safety and security',
  'Drug and substance abuse prevention',
  'Citizenship and social cohesion',
  'Disaster risk reduction',
]

export const CBC_THEMES = [
  'Health and nutrition',
  'Environmental conservation',
  'Patriotism and national unity',
  'Technology and innovation',
  'Financial literacy and entrepreneurship',
  'Human rights and governance',
  'Disaster risk reduction',
  'Gender equality',
]

export const CBC_SUBJECT_LESSON_ALLOCATION: Record<string, number> = {
  // Short names (from curricula.ts / create page)
  'Mathematics': 5,
  'English': 5,
  'Kiswahili': 5,
  'Science and Technology': 4,
  'Social Studies': 4,
  'Creative Arts': 5,
  'Physical Education': 2,
  'Agriculture and Nutrition': 4,
  'Home Science': 3,
  'Religious Education': 4,
  'Pre-Technical Studies': 4,
  'Business Studies': 3,
  'Computer Studies': 3,
  'Music': 2,
  'Art & Craft': 2,
  // DB / legacy names
  'Kiswahili / Kenya Sign Language': 5,
  'Integrated Science': 5,
  'CRE': 4,
  'IRE': 4,
  'HRE': 4,
  'Christian Religious Education': 4,
  'Pre-Technical and Pre-Career Education': 4,
  'Agriculture': 4,
  'Creative Arts and Sports': 5,
  'Health Education': 2,
  'Life Skills': 1,
  'Sports and Physical Education': 2,
  'Mathematics Activities': 5,
  'English Language Activities': 5,
  'English Activities': 5,
  'Environmental Activities': 3,
  'Indigenous Language Activities': 3,
  'Christian Religious Education Activities': 3,
  'Creative Arts Activities': 3,
  'Hygiene and Nutrition': 2,
  'Movement Activities': 3,
  'Literacy': 5,
  'Kiswahili Language Activities': 5,
  'Kenya Sign Language': 4,
  'Shughuli za Kiswahili': 5,
  'Science & Technology Activities': 4,
  'Science and Technology Activities': 4,
  'Social Studies Activities': 4,
  'C.R.E Activities': 3,
  'Integrated Science Activities': 4,
  'Agriculture & Nutrition Activities': 4,
  'Pretechnical Studies Activities': 4,
}

export function buildKICDSchemePrompt(grade?: string, subject?: string): string {
  const lessonsPerWeek = subject ? CBC_SUBJECT_LESSON_ALLOCATION[subject] || 5 : 5
  return `
CBC/CBE CONTEXT — KENYAN COMPETENCY-BASED CURRICULUM:
- Core Competencies (pick 2-3 per lesson): ${CBC_CORE_COMPETENCIES.join(', ')}
- Values (pick 1-2 per lesson): ${CBC_VALUES.join(', ')}
- Pertinent and Contemporary Issues - PCIs (pick 1-2 per lesson): ${CBC_PCIS.join(', ')}
- Themes: ${CBC_THEMES.join(', ')}
- Learning outcomes use the stem: "By the end of the lesson, the learner should be able to..."
- Use inquiry-based, learner-centred approaches
- Include Kenyan examples, contexts and locally available resources
- Reference Kenya's Vision 2030 and SDGs where relevant${grade ? `\n- Target grade: ${grade}` : ''}${subject ? `\n- Subject: ${subject}` : ''}
- Standard weekly lesson allocation for ${subject || 'this subject'}: ${lessonsPerWeek} lessons per week
- Each lesson is 35-40 minutes`
}

export function buildKICDLessonPrompt(grade?: string, subject?: string): string {
  return `
CBC/CBE CONTEXT — KENYAN COMPETENCY-BASED CURRICULUM:
- Core Competencies (pick 2-3 that the lesson genuinely develops): ${CBC_CORE_COMPETENCIES.join(', ')}
- Values (pick 1-2 the lesson reinforces): ${CBC_VALUES.join(', ')}
- Pertinent and Contemporary Issues - PCIs (pick 1-2 addressed): ${CBC_PCIS.join(', ')}
- SLOs must start with "By the end of the lesson, the learner should be able to..." and use action verbs
- KIQs must be open-ended (not yes/no)
- Organisation of Learning must be learner-centred at every step
- Time allocations must add up to the total lesson duration ${grade ? `\n- Target grade: ${grade}` : ''}${subject ? `\n- Subject: ${subject}` : ''}`
}

export const CBC_LEARNING_OUTCOME_PREFIX = 'By the end of the lesson, the learner should be able to'
