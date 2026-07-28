/**
 * POST /api/ai/auto-mark
 * AI Auto-Mark Assignment — grades student submission against rubric
 */
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { OpenAIService } from '@/lib/openai-service'
import { route } from '@/lib/api-middleware'

export const POST = route({}, async (request, { user }) => {
    const { submissionId, assignmentTitle, submissionText, rubric, totalMarks = 100 } = await request.json()
    if (!submissionText) return NextResponse.json({ error: 'submissionText required' }, { status: 400 })

    const rubricStr = rubric
      ? (Array.isArray(rubric)
          ? rubric.map((r: any) => `- ${r.criterion} (${r.weight || r.points || ''}%): ${r.description || ''}`).join('\n')
          : String(rubric))
      : `General assessment rubric:
- Content Understanding (40%): Accuracy and depth of knowledge
- Application (25%): Use of concepts in context
- Organisation (20%): Structure, clarity, logical flow
- Language (15%): Grammar, vocabulary, expression`

    const prompt = `You are an experienced Kenyan CBC teacher marking a student assignment.

Assignment: "${assignmentTitle || 'Assignment'}"
Total Marks: ${totalMarks}

RUBRIC:
${rubricStr}

STUDENT SUBMISSION:
"""
${submissionText.slice(0, 3000)}
"""

Analyse the submission and return ONLY a valid JSON object:
{
  "totalScore": <number 0-${totalMarks}>,
  "percentage": <number 0-100>,
  "grade": "EE|ME|AE|BE",
  "gradeFull": "Exceeding Expectations|Meeting Expectations|Approaching Expectations|Below Expectations",
  "overallFeedback": "2-3 sentence overall comment, encouraging and specific",
  "strengths": ["strength 1", "strength 2", "strength 3"],
  "improvements": ["area 1", "area 2"],
  "criterionScores": [
    { "criterion": "name", "score": <number>, "maxScore": <number>, "feedback": "specific feedback" }
  ],
  "teacherNote": "Private note for teacher only"
}

Grading scale: EE=80-100%, ME=60-79%, AE=40-59%, BE=0-39%
Be encouraging but honest. Use Kenyan educational context.`

    const raw = await OpenAIService.generateText([
      { role: 'system', content: 'You are a CBC teacher. Return ONLY valid JSON.' },
      { role: 'user', content: prompt },
    ], { maxTokens: 1000, temperature: 0.3 })

    const start = raw.indexOf('{'); const end = raw.lastIndexOf('}')
    if (start === -1 || end <= start) return NextResponse.json({ error: 'AI returned invalid format' }, { status: 500 })

    const result = JSON.parse(raw.slice(start, end + 1))

    // If submissionId provided, update the DB record
    if (submissionId) {
      try {
        await prisma.submission.update({
          where: { id: submissionId },
          data: {
            grade:    result.totalScore,
            feedback: `${result.overallFeedback}\n\nStrengths: ${result.strengths?.join('; ')}\nImprovements: ${result.improvements?.join('; ')}`,
            status:   'GRADED',
          },
        })
      } catch { /* non-fatal */ }
    }

    return NextResponse.json({ result, submissionId })
})
