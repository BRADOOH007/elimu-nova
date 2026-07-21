/**
 * POST /api/ai/bloom-quiz
 * Bloom's Taxonomy Quiz Generator — CBC aligned
 * Generates 6 questions across all Bloom's levels from lesson/scheme context
 */
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { rateLimitAI, getIP, checkRateLimit } from '@/lib/rate-limit'
import { OpenAIService } from '@/lib/openai-service'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const rl = await checkRateLimit(session.user.id || getIP(request), rateLimitAI)
    if (!rl.allowed) return NextResponse.json({ error: `Rate limit. Retry in ${rl.resetInSec}s` }, { status: 429 })

    const { subject, grade, strand, subStrand, topic, concepts = [] } = await request.json()
    if (!subject || !grade) return NextResponse.json({ error: 'subject and grade required' }, { status: 400 })

    const conceptsStr = concepts.length > 0 ? concepts.join(', ') : topic || `${strand} — ${subStrand}`

    const prompt = `You are an expert CBC curriculum assessment designer for Kenyan schools.
Generate 6 questions — one per Bloom's Taxonomy level — based on this content:

Subject: ${subject} | Grade: ${grade}
Strand: ${strand || 'N/A'} | Sub-Strand: ${subStrand || topic || 'N/A'}
Key Concepts: ${conceptsStr}

Return ONLY a valid JSON array of 6 objects:
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
  },
  {
    "level": "APPLY",
    "levelNumber": 3,
    "cognitive_skill": "Use information in new situations",
    "question": "...",
    "type": "multiple_choice",
    "options": ["A. ...", "B. ...", "C. ...", "D. ..."],
    "correct_answer": 1,
    "explanation": "..."
  },
  {
    "level": "ANALYZE",
    "levelNumber": 4,
    "cognitive_skill": "Draw connections among ideas",
    "question": "...",
    "type": "open_ended",
    "model_answer": "...",
    "explanation": "..."
  },
  {
    "level": "EVALUATE",
    "levelNumber": 5,
    "cognitive_skill": "Justify a decision or course of action",
    "question": "...",
    "type": "open_ended",
    "model_answer": "...",
    "explanation": "..."
  },
  {
    "level": "CREATE",
    "levelNumber": 6,
    "cognitive_skill": "Produce new or original work",
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
- correct_answer is 0-indexed (0=A, 1=B, 2=C, 3=D)`

    const raw = await OpenAIService.generateText([
      { role: 'system', content: 'You are a CBC curriculum expert. Return ONLY valid JSON array, no markdown, no LaTeX, no TeX commands.' },
      { role: 'user', content: prompt },
    ], { maxTokens: 2000, temperature: 0.6 })

    const start = raw.indexOf('['); const end = raw.lastIndexOf(']')
    if (start === -1 || end <= start) return NextResponse.json({ error: 'AI returned invalid format' }, { status: 500 })

    // Strip any LaTeX from all string fields in the questions
    const { stripLatex } = await import('@/lib/clean-ai-text')
    const cleanJson = stripLatex(raw.slice(start, end + 1))
    const questions = JSON.parse(cleanJson)
    return NextResponse.json({ questions, subject, grade, strand, subStrand, topic })
  } catch (e: any) {
    console.error('[BLOOM_QUIZ]', e)
    return NextResponse.json({ error: e.message || 'Failed to generate quiz' }, { status: 500 })
  }
}
