import { NextResponse } from 'next/server'
import { OpenAIService } from '@/lib/openai-service'
import { route } from '@/lib/api-middleware'
import { cleanAiJson } from '@/lib/ai-generation-utils'
import { buildCurriculumAssessmentContext } from '@/lib/curriculum-prompt'

/** Fallback quiz generator when AI fails — always returns valid questions */
function generateFallbackQuiz(subject: string, grade: string, topic: string): any[] {
  const topics = topic || subject
  return [
    { question: `What is a key concept in ${topics} for ${grade}?`, type: 'multiple_choice', options: [`A core idea in ${topics}`, 'An unrelated topic', 'A random fact', 'None of the above'], correct: 0, explanation: `This is a foundational concept in ${topics}.`, points: 2 },
    { question: `Which of the following best describes ${topics}?`, type: 'multiple_choice', options: [`A subject area studied in ${grade}`, 'A type of food', 'A historical event', 'A mathematical formula'], correct: 0, explanation: `${topics} is an academic subject area.`, points: 2 },
    { question: `Why is ${topics} important for students in ${grade}?`, type: 'multiple_choice', options: ['It builds foundational knowledge', 'It is not important', 'It is only for tests', 'It replaces other subjects'], correct: 0, explanation: `${topics} builds essential skills for ${grade} students.`, points: 2 },
    { question: `Which skill is developed by studying ${topics}?`, type: 'multiple_choice', options: ['Critical thinking', 'Nothing', 'Only memorization', 'Physical fitness'], correct: 0, explanation: `Studying ${topics} develops critical thinking.`, points: 2 },
    { question: `How can students apply knowledge of ${topics} in real life?`, type: 'multiple_choice', options: ['Through everyday problem-solving', 'They cannot apply it', 'Only in school', 'Only in exams'], correct: 0, explanation: `${topics} knowledge applies to real-world situations.`, points: 2 },
    { question: `What is the first step in learning about ${topics}?`, type: 'multiple_choice', options: ['Understanding basic concepts', 'Skipping to advanced topics', 'Memorizing everything', 'Ignoring the basics'], correct: 0, explanation: 'Starting with basics is the foundation of learning.', points: 2 },
    { question: `Which method helps students understand ${topics} better?`, type: 'multiple_choice', options: ['Practice and review', 'Avoiding practice', 'Only reading once', 'Skipping lessons'], correct: 0, explanation: 'Regular practice reinforces understanding.', points: 2 },
    { question: `What should a ${grade} student know about ${topics}?`, type: 'multiple_choice', options: ['Age-appropriate fundamentals', 'Graduate-level theory', 'Nothing at all', 'Only advanced topics'], correct: 0, explanation: `${grade} students focus on fundamentals.`, points: 2 },
    { question: `How does ${topics} connect to other subjects?`, type: 'multiple_choice', options: ['Through interdisciplinary concepts', 'It does not connect', 'Only through tests', 'Only in college'], correct: 0, explanation: 'Subjects are interconnected through shared concepts.', points: 2 },
    { question: `What is a good way to review ${topics} before a test?`, type: 'multiple_choice', options: ['Practice questions and notes', 'Not studying at all', 'Only sleeping', 'Watching TV'], correct: 0, explanation: 'Active review with practice is most effective.', points: 2 },
  ]
}

export const POST = route({ skipSubscriptionCheck: true }, async (request, { user }) => {
    const { lessonTitle, subject, grade, learningOutcomes, content, topic, subStrand, curriculum } = await request.json()
    if (!subject || !grade) return NextResponse.json({ error: 'subject and grade required' }, { status: 400 })

    const curCtx = curriculum && curriculum !== 'cbc' ? buildCurriculumAssessmentContext({ curriculum, grade, subject }) : ''

    const prompt = `Generate 10 multiple-choice checkpoint quiz questions for end of lesson.
${curCtx}
Lesson: ${lessonTitle || topic || subject}
Subject: ${subject} | Grade: ${grade}
Topic: ${subStrand || topic || lessonTitle || subject}
Learning Outcomes: ${learningOutcomes || content?.slice(0, 300) || 'Key concepts'}

Return ONLY a JSON array of 10 objects:
[
  {
    "question": "Short, clear question",
    "type": "multiple_choice",
    "options": ["A. Option A", "B. Option B", "C. Option C", "D. Option D"],
    "correct": 0,
    "explanation": "Why this is correct (1 sentence)",
    "points": 2
  }
]

ALL questions must be type "multiple_choice" with exactly 4 options (A-D) and a correct index (0-3). No true/false or short_answer. Easy for auto-grading.`

    const raw = await OpenAIService.generateText([
      { role: 'system', content: 'You are a quiz creator. Return ONLY valid JSON array. No LaTeX, no TeX commands.' },
      { role: 'user', content: prompt },
    ], { maxTokens: 2000, temperature: 0.6 }).catch(() => null)

    const json = raw ? cleanAiJson(raw) : ''
    let questions: any[] | null = null

    if (json) {
      try {
        questions = JSON.parse(json)
        if (!Array.isArray(questions) || questions.length === 0) questions = null
      } catch { /* fall through to fallback */ }
    }

    // Fallback: generate topic-relevant questions when AI fails
    if (!questions) {
      questions = generateFallbackQuiz(subject, grade, subStrand || topic || lessonTitle || subject)
    }

    const { stripLatex } = await import('@/lib/clean-ai-text')
    for (const q of questions) {
      for (const key of Object.keys(q)) {
        if (typeof q[key] === 'string') q[key] = stripLatex(q[key])
      }
    }
    return NextResponse.json({ questions, lessonTitle, totalPoints: questions.reduce((s: number, q: any) => s + (q.points || 2), 0) })
})
