import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { OpenAIService } from '@/lib/openai-service'
import { route } from '@/lib/api-middleware'
import { cleanAiJson } from '@/lib/ai-generation-utils'

export const POST = route({ auth: ['STUDENT', 'SUPER_ADMIN'] }, async (request, { user }) => {
  const { strengths, interests, grade, skills, goals } = await request.json()

  // Gather student's real academic data
  const student = await prisma.student.findUnique({
    where: { userId: user.id },
    include: {
      studentProgress: { orderBy: { masteryScore: 'desc' }, take: 10 },
      submissions: {
        include: { assignment: true },
        where: { status: 'GRADED' },
        orderBy: { submittedAt: 'desc' },
        take: 20,
      },
      analytics: true,
    },
  })

  // Build subject performance from real data
  const subjectScores: Record<string, number[]> = {}
  student?.submissions?.forEach((s: any) => {
    const subject = s.assignment?.subject
    if (subject && s.grade != null) {
      if (!subjectScores[subject]) subjectScores[subject] = []
      subjectScores[subject].push(s.grade)
    }
  })

  const subjectAverages = Object.entries(subjectScores)
    .map(([subject, scores]) => ({
      subject,
      avg: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
    }))
    .sort((a, b) => b.avg - a.avg)

  const topMastery = student?.studentProgress
    ?.filter((p: any) => p.subject !== 'General' && p.masteryScore > 0)
    ?.slice(0, 5)
    ?.map((p: any) => `${p.subject} (${p.masteryScore}% mastery)`)
    ?.join(', ') || 'Not enough data yet'

  const prompt = `You are a career guidance counsellor for a student in ${grade || 'secondary school'}.
Based on their profile, provide personalised career pathway recommendations.

Student Profile:
- Grade: ${grade || 'Not specified'}
- Self-identified strengths: ${strengths || 'Not specified'}
- Interests: ${interests || 'Not specified'}
- Skills: ${skills || 'Not specified'}
- Goals: ${goals || 'Not specified'}
- Top academic subjects: ${subjectAverages.slice(0, 5).map(s => `${s.subject} (${s.avg}%)`).join(', ') || 'No data yet'}
- AI Tutor mastery: ${topMastery}
- Average grade: ${student?.analytics?.averageGrade ? Math.round(student.analytics.averageGrade) + '%' : 'No data yet'}

Return ONLY valid JSON (no markdown):
{
  "summary": "2-3 sentence personalised summary",
  "topCareers": [
    { "title": "Career Title", "field": "Field", "match": 95, "why": "One sentence", "subjects": ["Subject1"], "universities": ["University 1"], "path": "1-2 sentence path" }
  ],
  "subjectRecommendations": [
    { "subject": "Subject", "reason": "Why focus here", "priority": "high" }
  ],
  "actionSteps": ["Step 1", "Step 2", "Step 3"]
}
Provide exactly 4 top careers and 3 subject recommendations.`

  const raw = await OpenAIService.generateText(
    [{ role: 'user', content: prompt }],
    { maxTokens: 1200, temperature: 0.7, responseFormat: 'json_object' }
  )

  // Extract JSON (json_object mode + cleanAiJson repair for robustness)
  let result: any = {}
  try {
    const json = cleanAiJson(raw)
    if (json) result = JSON.parse(json)
  } catch (e) { console.warn('[Career] AI JSON parse failed:', e) }

  return NextResponse.json({
    ...result,
    studentProfile: {
      grade,
      strengths,
      interests,
      topSubjects:  subjectAverages.slice(0, 5),
      averageGrade: student?.analytics?.averageGrade,
    },
  })
})
