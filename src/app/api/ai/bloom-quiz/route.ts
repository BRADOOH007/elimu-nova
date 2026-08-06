/**
 * POST /api/ai/bloom-quiz
 * Bloom's Taxonomy Quiz Generator — CBC aligned
 * Generates 6 questions across all Bloom's levels from lesson/scheme context
 */
import { NextResponse } from 'next/server'
import { OpenAIService } from '@/lib/openai-service'
import { route } from '@/lib/api-middleware'
import { cleanAiJson } from '@/lib/ai-generation-utils'

export const POST = route({}, async (request, { user }) => {
    const { subject, grade, strand, subStrand, topic, concepts = [], numQuestions = 6 } = await request.json()
    if (!subject || !grade) return NextResponse.json({ error: 'subject and grade required' }, { status: 400 })

    const conceptsStr = concepts.length > 0 ? concepts.join(', ') : topic || `${strand} — ${subStrand}`
    const numQ = Math.max(3, Math.min(12, Number(numQuestions) || 6))

    // Determine level distribution based on numQuestions
    const levels = ['REMEMBER', 'UNDERSTAND', 'APPLY', 'ANALYZE', 'EVALUATE', 'CREATE']
    const levelInstructions = numQ <= 6
      ? 'Generate exactly 6 questions — one per Bloom\'s level.'
      : `Generate ${numQ} questions — at least one per Bloom's level, with extra questions distributed across APPLY, ANALYZE, and CREATE levels.`

    const prompt = `You are an expert CBC curriculum assessment designer for Kenyan schools.
${levelInstructions} Base them on this content:

Subject: ${subject} | Grade: ${grade}
Strand: ${strand || 'N/A'} | Sub-Strand: ${subStrand || topic || 'N/A'}
Key Concepts: ${conceptsStr}

Return ONLY a valid JSON array of ${numQ} objects:
[
  {
    "level": "REMEMBER",
    "levelNumber": 1,
    "cognitive_skill": "Recall facts and basic concepts",
    "question": "...",
    "type": "multiple_choice",
    "options": ["A. ...", "B. ...", "C. ...", "D. ..."],
    "correct_answer": 0,
    "explanation": "..."
  },
  {
    "level": "UNDERSTAND",
    "levelNumber": 2,
    "cognitive_skill": "Explain ideas or concepts",
    "question": "...",
    "type": "open_ended",
    "model_answer": "...",
    "explanation": "..."
  }
]

Rules:
- Use Kenya-specific examples and contexts
- Language appropriate for ${grade} learners
- Questions must be based ONLY on the provided content
- Multiple choice options must be plausible, not obviously wrong
- Model answers should be 2-4 sentences
- correct_answer is 0-indexed (0=A, 1=B, 2=C, 3=D)
- For questions beyond the initial 6, vary the cognitive_skill name (e.g. "Compare and contrast", "Design an experiment", "Critique a method") while keeping the same Bloom's level`


    const raw = await OpenAIService.generateText([
      { role: 'system', content: 'You are a CBC curriculum expert. Return ONLY valid JSON array, no markdown, no LaTeX, no TeX commands.' },
      { role: 'user', content: prompt },
    ], { maxTokens: Math.min(4000, 2000 + numQ * 200), temperature: 0.6 })

    const json = cleanAiJson(raw)
    if (!json) return NextResponse.json({ error: 'AI returned invalid format' }, { status: 500 })

    let questions: any[]
    try {
      questions = JSON.parse(json)
    } catch {
      return NextResponse.json({ error: 'Failed to parse quiz. Please try again.' }, { status: 500 })
    }

    // Strip LaTeX from all string fields only after parsing
    const { stripLatex } = await import('@/lib/clean-ai-text')
    for (const q of questions) {
      for (const key of Object.keys(q)) {
        if (typeof q[key] === 'string') q[key] = stripLatex(q[key])
      }
    }
    return NextResponse.json({ questions, subject, grade, strand, subStrand, topic })
})
