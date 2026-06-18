import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { strengths, interests, grade } = await request.json()

    // Gather student's real academic data
    const student = await prisma.student.findUnique({
      where: { userId: session.user.id },
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

    const subjectAverages = Object.entries(subjectScores).map(([subject, scores]) => ({
      subject,
      avg: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
    })).sort((a, b) => b.avg - a.avg)

    // Top mastery areas from AI tutor sessions
    const topMastery = student?.studentProgress
      ?.filter((p: any) => p.subject !== 'General' && p.masteryScore > 0)
      ?.slice(0, 5)
      ?.map((p: any) => `${p.subject} (${p.masteryScore}% mastery)`)
      ?.join(', ') || 'Not enough data yet'

    const { OpenAI } = await import('openai')
    const openai = new OpenAI({
      apiKey: process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY,
      baseURL: process.env.OPENROUTER_API_KEY ? 'https://openrouter.ai/api/v1' : undefined,
    })

    const prompt = `You are a career guidance counsellor for a student in ${grade || 'secondary school'}.

Based on their profile, provide personalised career pathway recommendations.

Student Profile:
- Grade: ${grade || 'Not specified'}
- Self-identified strengths: ${strengths || 'Not specified'}
- Interests: ${interests || 'Not specified'}
- Top academic subjects: ${subjectAverages.slice(0, 5).map(s => `${s.subject} (${s.avg}%)`).join(', ') || 'No data yet'}
- AI Tutor mastery areas: ${topMastery}
- Average grade: ${student?.analytics?.averageGrade ? Math.round(student.analytics.averageGrade) + '%' : 'No data yet'}

Respond with a JSON object in exactly this format:
{
  "summary": "2-3 sentence personalised summary of their profile and potential",
  "topCareers": [
    {
      "title": "Career Title",
      "field": "Field/Industry",
      "match": 95,
      "why": "One sentence explaining why this suits them",
      "subjects": ["Subject1", "Subject2"],
      "universities": ["Example University 1", "Example University 2"],
      "path": "Brief 1-2 sentence description of the educational path"
    }
  ],
  "subjectRecommendations": [
    { "subject": "Subject Name", "reason": "Why they should focus on this", "priority": "high/medium/low" }
  ],
  "actionSteps": ["Specific action step 1", "Specific action step 2", "Specific action step 3"]
}

Provide exactly 4 top careers and 3 subject recommendations. Be specific, encouraging and realistic.`

    const completion = await openai.chat.completions.create({
      model: 'openai/gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 1200,
      temperature: 0.7,
      response_format: { type: 'json_object' },
    })

    const raw = completion.choices[0]?.message?.content || '{}'
    const result = JSON.parse(raw)

    return NextResponse.json({
      ...result,
      studentProfile: {
        grade,
        strengths,
        interests,
        topSubjects: subjectAverages.slice(0, 5),
        averageGrade: student?.analytics?.averageGrade,
      },
    })
  } catch (error) {
    console.error('[CAREER_API]', error)
    return NextResponse.json({ error: 'Failed to generate career guidance' }, { status: 500 })
  }
}
