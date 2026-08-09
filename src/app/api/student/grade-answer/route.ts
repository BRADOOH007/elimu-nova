import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { route } from '@/lib/api-middleware'

export const POST = route({ auth: 'STUDENT' }, async (req, { user }) => {
  const { questionText, studentAnswer, modelAnswer, questionType, subject, topic } = await req.json()
  if (!questionText || !studentAnswer) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

  // For MCQ/true-false: simple comparison
  if (questionType === 'mcq' || questionType === 'true_false') {
    const correct = String(studentAnswer).trim().toLowerCase() === String(modelAnswer).trim().toLowerCase()
    return NextResponse.json({ isCorrect: correct, score: correct ? 100 : 0, feedback: correct ? 'Correct!' : `Incorrect. The answer is: ${modelAnswer}`, hint: null })
  }

  // For short-answer/essay: use AI evaluation
  try {
    const { OpenAIService } = await import('@/lib/openai-service')
    const prompt = `Evaluate this student answer. Return ONLY valid JSON:
{
  "isCorrect": true,
  "score": 85,
  "feedback": "Good explanation but missing key details...",
  "hint": "Consider mentioning..."
}

Question: ${questionText}
Subject: ${subject || 'General'}
Topic: ${topic || 'General'}
Model answer: ${modelAnswer || 'No model answer provided'}
Student answer: ${studentAnswer}

Score from 0-100. Be encouraging but accurate. Give specific feedback and a hint for improvement.`

    const raw = await OpenAIService.generateText([{ role: 'user', content: prompt }], { maxTokens: 300, temperature: 0.3 })
    const json = raw.match(/\{[\s\S]*\}/)?.[0]
    if (json) {
      const result = JSON.parse(json)
      // Track correct/incorrect for analytics
      if (result.isCorrect) {
        await (prisma as any).practiceAttempt.create({
          data: { userId: user.id, subject: subject || 'General', isCorrect: true, answer: studentAnswer, createdAt: new Date() }
        })
      }
      return NextResponse.json(result)
    }
  } catch (e) { console.warn('AI grading failed, using fuzzy fallback:', e) }

  // Fuzzy fallback
  const s1 = String(studentAnswer).toLowerCase().trim()
  const s2 = String(modelAnswer).toLowerCase().trim()
  const words = s2.split(/\s+/).filter(w => w.length > 3)
  const matched = words.filter(w => s1.includes(w)).length
  const score = Math.round((matched / Math.max(words.length, 1)) * 100)
  const isCorrect = score >= 60

  return NextResponse.json({
    isCorrect,
    score: Math.min(score, 100),
    feedback: isCorrect ? 'Good answer!' : `Review these key concepts: ${modelAnswer}`,
    hint: isCorrect ? null : `Focus on: ${words.slice(0, 3).join(', ')}`,
  })
})
