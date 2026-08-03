/**
 * POST /api/ai/exam-format-analyzer
 * Exam Format Analyzer — Upload past exam paper → AI analyses question patterns
 */
import { NextResponse } from 'next/server'
import { OpenAIService } from '@/lib/openai-service'
import { route } from '@/lib/api-middleware'

export const POST = route({ auth: ['TEACHER', 'SCHOOL_ADMIN', 'SUPER_ADMIN'] }, async (request, { user }) => {
    const { examText, subject, grade, examYear, examType = 'Exam' } = await request.json()
    if (!examText) return NextResponse.json({ error: 'examText required' }, { status: 400 })

    const prompt = `You are an expert ${examType} examiner analysing past paper patterns to help teachers prepare students.

Exam: ${examType} ${examYear || ''} | Subject: ${subject || 'General'} | Grade: ${grade || 'Secondary'}

EXAM CONTENT:
"""
${examText.slice(0, 4000)}
"""

Analyse this exam and return ONLY valid JSON:
{
  "overview": {
    "totalQuestions": <number>,
    "totalMarks": <number>,
    "estimatedDuration": "<time>",
    "sections": [{ "name": "Section A", "questions": 20, "marks": 40, "type": "MCQ" }]
  },
  "topicBreakdown": [
    { "topic": "topic name", "questions": <number>, "marks": <number>, "percentage": <number>, "frequency": "always|often|sometimes|rare" }
  ],
  "questionTypes": [
    { "type": "Multiple Choice", "count": <number>, "percentage": <number> }
  ],
  "bloomsDistribution": {
    "remember": <percentage>, "understand": <percentage>, "apply": <percentage>,
    "analyze": <percentage>, "evaluate": <percentage>, "create": <percentage>
  },
  "highFrequencyTopics": ["Most tested topic 1", "topic 2", "topic 3"],
  "rareTested": ["Rarely tested topic 1", "topic 2"],
  "difficultyAnalysis": {
    "easy": <percentage>, "medium": <percentage>, "hard": <percentage>
  },
  "teachingRecommendations": [
    { "priority": "high|medium|low", "action": "Specific teaching recommendation", "reason": "Why" }
  ],
  "predictedTopics": ["Topics likely to appear in next exam based on patterns"],
  "examTips": ["Tip 1 for students", "Tip 2", "Tip 3"]
}`

    const raw = await OpenAIService.generateLongContent([
      { role: 'system', content: 'You are an exam analyst. Return ONLY valid JSON.' },
      { role: 'user', content: prompt },
    ], { maxTokens: 2000, temperature: 0.3 })

    const start = raw.indexOf('{'); const end = raw.lastIndexOf('}')
    if (start === -1 || end <= start) return NextResponse.json({ error: 'Invalid format' }, { status: 500 })

    return NextResponse.json({ analysis: JSON.parse(raw.slice(start, end + 1)), subject, grade, examType, examYear })
})
