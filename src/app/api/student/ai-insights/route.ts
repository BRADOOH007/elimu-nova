import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { OpenAIService } from '@/lib/openai-service'
import { route } from '@/lib/api-middleware'

export const GET = route({ auth: 'STUDENT' }, async (req, { user }) => {
  const student = await prisma.student.findFirst({
    where: { userId: user.id },
    include: {
      analytics:       true,
      studySessions:   { orderBy: { createdAt: 'desc' }, take: 10 },
      aiTutorSessions: { orderBy: { createdAt: 'desc' }, take: 5 },
    },
  })

  if (!student) return NextResponse.json({ error: 'Student not found' }, { status: 404 })

  const a = student.analytics
  const prompt = `You are an educational analyst. Analyse this student's learning data and provide personalised insights.

Total study time: ${a?.totalStudyTime || 0} minutes
Average grade: ${a?.averageGrade ? Math.round(a.averageGrade) + '%' : 'N/A'}
Completed assignments: ${a?.completedAssignments || 0}
Pending assignments: ${a?.pendingAssignments || 0}
Overdue assignments: ${a?.overdueAssignments || 0}
Study streak: ${a?.streakDays || 0} days
AI tutor sessions: ${student.aiTutorSessions.length}
Study sessions (last 10): ${student.studySessions.length}

Return ONLY valid JSON:
{
  "learningStyle": "visual|kinesthetic|auditory",
  "currentLevel": "beginner|intermediate|advanced",
  "strengths": ["strength 1", "strength 2"],
  "areasForImprovement": ["area 1", "area 2"],
  "recommendedFocus": ["focus 1", "focus 2"],
  "nextSteps": ["step 1", "step 2"],
  "studyPatterns": {
    "totalStudyTime": ${a?.totalStudyTime || 0},
    "averageSessionTime": ${student.studySessions.length > 0 ? Math.round((a?.totalStudyTime || 0) / student.studySessions.length) : 0},
    "mostActiveSubject": "General",
    "preferredStudyTime": "afternoon",
    "consistencyScore": ${Math.min(100, (a?.streakDays || 0) * 10)}
  },
  "performanceTrends": {
    "trend": "${(a?.averageGrade || 0) >= 70 ? 'improving' : 'needs_attention'}",
    "direction": "${(a?.averageGrade || 0) >= 70 ? 'upward' : 'downward'}",
    "completionRate": ${a?.completedAssignments && (a.completedAssignments + (a.pendingAssignments || 0)) > 0 ? Math.round((a.completedAssignments / (a.completedAssignments + (a.pendingAssignments || 0))) * 100) : 0}
  },
  "personalizedRecommendations": ["rec 1", "rec 2", "rec 3"]
}`

  const raw = await OpenAIService.generateText(
    [{ role: 'user', content: prompt }],
    { maxTokens: 600, temperature: 0.5 }
  )

  const start = raw.indexOf('{'); const end = raw.lastIndexOf('}')
  if (start !== -1 && end > start) {
    return NextResponse.json(JSON.parse(raw.slice(start, end + 1)))
  }

  // Fallback static insights
  return NextResponse.json({
    learningStyle:   'visual',
    currentLevel:    'intermediate',
    strengths:       ['Consistent effort', 'Good AI tutor usage'],
    areasForImprovement: ['Complete pending assignments', 'Increase daily study time'],
    recommendedFocus:    ['Regular study sessions', 'Review weak topics'],
    nextSteps:           ['Set a daily study goal', 'Use AI tutor for difficult topics'],
    studyPatterns: {
      totalStudyTime: a?.totalStudyTime || 0,
      averageSessionTime: 0,
      mostActiveSubject: 'General',
      preferredStudyTime: 'afternoon',
      consistencyScore: Math.min(100, (a?.streakDays || 0) * 10),
    },
    performanceTrends: {
      trend: 'stable', direction: 'stable', completionRate: 0,
    },
    personalizedRecommendations: [
      'Set daily study goals',
      'Focus on challenging topics with AI tutor',
      'Review completed lessons regularly',
    ],
  })
})
