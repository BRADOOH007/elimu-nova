/**
 * POST /api/ai/auto-mark
 * AI Auto-Mark Assignment — grades student submission against rubric
 */
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { OpenAIService } from '@/lib/openai-service'
import { route } from '@/lib/api-middleware'
import { cleanAiJson } from '@/lib/ai-generation-utils'

export const POST = route({ auth: ['TEACHER', 'SCHOOL_ADMIN', 'SUPER_ADMIN'], skipSubscriptionCheck: true }, async (request, { user }) => {
    const { submissionId, assignmentTitle, submissionText, rubric, totalMarks = 100, subject, grade, curriculum, country } = await request.json()
    if (!submissionText) return NextResponse.json({ error: 'submissionText required' }, { status: 400 })

    const { buildCurriculumAssessmentContext } = await import('@/lib/curriculum-prompt')
    const curCtx = curriculum && curriculum !== 'cbc'
      ? buildCurriculumAssessmentContext({ curriculum, country, grade: grade || '', subject: subject || '' })
      : null

    const gradeLabels = curriculum && curriculum !== 'cbc'
      ? { scale: 'A=90-100%, B=80-89%, C=70-79%, D=60-69%, F=below 60%', grade: '"A"|"B"|"C"|"D"|"F"', full: '"Excellent"|"Good"|"Satisfactory"|"Needs Improvement"|"Unsatisfactory"' }
      : { scale: 'EE=80-100%, ME=60-79%, AE=40-59%, BE=0-39%', grade: '"EE"|"ME"|"AE"|"BE"', full: '"Exceeding Expectations"|"Meeting Expectations"|"Approaching Expectations"|"Below Expectations"' }

    const rubricStr = rubric
      ? (Array.isArray(rubric)
          ? rubric.map((r: any) => `- ${r.criterion} (${r.weight || r.points || ''}%): ${r.description || ''}`).join('\n')
          : String(rubric))
      : `General assessment rubric:
- Content Understanding (40%): Accuracy and depth of knowledge
- Application (25%): Use of concepts in context
- Organisation (20%): Structure, clarity, logical flow
- Language (15%): Grammar, vocabulary, expression`

    const prompt = `You are an experienced teacher${subject ? ` specializing in ${subject}` : ''}${grade ? ` teaching ${grade} students` : ''}.
${curCtx ? `\nCurriculum Context: ${curCtx}` : ''}

Assignment: "${assignmentTitle || 'Assignment'}"
Subject: ${subject || 'N/A'} | Grade: ${grade || 'N/A'}
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
  "grade": ${gradeLabels.grade},
  "gradeFull": ${gradeLabels.full},
  "overallFeedback": "2-3 sentence overall comment, encouraging and specific",
  "strengths": ["strength 1", "strength 2", "strength 3"],
  "improvements": ["area 1", "area 2"],
  "criterionScores": [
    { "criterion": "name", "score": <number>, "maxScore": <number>, "feedback": "specific feedback" }
  ],
  "teacherNote": "Private note for teacher only"
}

Grading scale: ${gradeLabels.scale}
Be encouraging but honest. Use examples and references appropriate for the student's grade level and region.`

    try {
    const raw = await OpenAIService.generateText([
      { role: 'system', content: 'You are a teacher and examiner. Return ONLY valid JSON.' },
      { role: 'user', content: prompt },
    ], { maxTokens: 1000, temperature: 0.3 })

    const json = cleanAiJson(raw)
    if (!json) return NextResponse.json({ error: 'AI returned invalid format' }, { status: 500 })
    const result = JSON.parse(json)

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
    } catch (e: any) {
      console.error('[AutoMark] Failed:', e)
      return NextResponse.json({ error: 'Failed to auto-mark. Please try again.' }, { status: 500 })
    }
})
