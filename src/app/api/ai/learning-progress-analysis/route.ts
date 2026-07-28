/**
 * POST /api/ai/learning-progress-analysis
 * Deep AI analysis of student performance trends
 */
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { OpenAIService } from '@/lib/openai-service'
import { route } from '@/lib/api-middleware'

export const POST = route({}, async (request, { user }) => {
    const { studentId } = await request.json()

    // Fetch student data
    const studentUserId = studentId || user.id
    const student = await prisma.student.findFirst({
      where: user.role === 'STUDENT' ? { userId: user.id } : { id: studentId },
      include: {
        user: true,
        submissions: {
          include: { assignment: { include: { lessonPlan: true } } },
          where: { status: 'GRADED' },
          orderBy: { submittedAt: 'desc' },
          take: 30,
        },
        aiTutorSessions: { orderBy: { createdAt: 'desc' }, take: 20 },
        studySessions:   { orderBy: { startTime: 'desc' }, take: 30 },
        analytics:       true,
      },
    })
    if (!student) return NextResponse.json({ error: 'Student not found' }, { status: 404 })

    // Build performance data
    const subjectScores: Record<string, number[]> = {}
    student.submissions.forEach((s: any) => {
      const subject = s.assignment?.lessonPlan?.subject || s.assignment?.subject || 'General'
      if (s.grade != null) {
        if (!subjectScores[subject]) subjectScores[subject] = []
        subjectScores[subject].push(s.grade)
      }
    })

    const subjectAvgs = Object.entries(subjectScores).map(([subject, scores]) => ({
      subject,
      avg: Math.round(scores.reduce((a,b) => a+b, 0) / scores.length),
      count: scores.length,
      trend: scores.length >= 3
        ? (scores[0] > scores[scores.length-1] ? 'improving' : scores[0] < scores[scores.length-1] ? 'declining' : 'stable')
        : 'insufficient data'
    })).sort((a,b) => b.avg - a.avg)

    const totalStudyMins = student.studySessions.reduce((s: number, ss: any) => s + (ss.duration || 0), 0)
    const name = `${student.user.firstName} ${student.user.lastName}`

    const prompt = `You are an expert educational analyst for Kenyan CBC schools.

Student: ${name}
Average Grade: ${student.analytics?.averageGrade ? Math.round(student.analytics.averageGrade) + '%' : 'N/A'}
Total Study Time: ${Math.round(totalStudyMins/60)} hours
AI Tutor Sessions: ${student.aiTutorSessions.length}
Assignments Graded: ${student.submissions.length}

Subject Performance:
${subjectAvgs.map(s => `- ${s.subject}: ${s.avg}% (${s.count} assignments, trend: ${s.trend})`).join('\n') || 'No data yet'}

Provide a comprehensive learning progress analysis. Return ONLY valid JSON:
{
  "summary": "2-3 sentence overall assessment of the student's progress",
  "overallLevel": "EE|ME|AE|BE",
  "overallPercentage": <number>,
  "strengths": ["subject/skill: why strong", "..."],
  "weakAreas": ["subject/skill: what to improve", "..."],
  "subjectInsights": [
    { "subject": "...", "status": "strong|moderate|needs_support", "insight": "specific observation", "recommendation": "what to do" }
  ],
  "studyHabits": {
    "assessment": "good|fair|poor",
    "observation": "note about study patterns",
    "recommendation": "specific advice"
  },
  "priorityActions": [
    { "action": "Specific action to take", "urgency": "high|medium|low", "timeframe": "this week|this month" }
  ],
  "motivationalMessage": "Encouraging, personalised message for the student",
  "nextMilestone": "The next achievable goal for this student"
}`

    const raw = await OpenAIService.generateText([
      { role: 'system', content: 'You are a CBC educational analyst. Return ONLY valid JSON.' },
      { role: 'user', content: prompt },
    ], { maxTokens: 1200, temperature: 0.5 })

    const start = raw.indexOf('{'); const end = raw.lastIndexOf('}')
    if (start === -1 || end <= start) return NextResponse.json({ error: 'Invalid format' }, { status: 500 })

    const analysis = JSON.parse(raw.slice(start, end + 1))
    return NextResponse.json({ analysis, studentName: name, subjectAvgs })
})
