/**
 * POST /api/ai/teaching-insights
 * Comprehensive Teaching Insights — AI class-wide analysis for teacher
 */
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { OpenAIService } from '@/lib/openai-service'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || !['TEACHER','SCHOOL_ADMIN','SUPER_ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { classId } = await request.json()

    const teacher = await prisma.teacher.findFirst({
      where: { userId: session.user.id },
      include: {
        students: {
          where: classId ? { classId } : {},
          include: {
            user: true,
            analytics: true,
            submissions: {
              where: { status: 'GRADED' },
              include: { assignment: { include: { lessonPlan: true } } },
              orderBy: { submittedAt: 'desc' },
              take: 5,
            },
          },
          take: 50,
        },
        classes: classId ? { where: { id: classId } } : {},
      },
    })
    if (!teacher) return NextResponse.json({ error: 'Teacher not found' }, { status: 404 })

    const students = teacher.students
    if (students.length === 0) return NextResponse.json({ error: 'No students found' }, { status: 404 })

    // Build class-level stats
    const grades = students
      .map((s: any) => s.analytics?.averageGrade)
      .filter((g: any) => g != null) as number[]

    const classAvg = grades.length > 0 ? Math.round(grades.reduce((a,b) => a+b,0)/grades.length) : null
    const atRisk    = students.filter((s: any) => (s.analytics?.averageGrade || 0) < 50).length
    const excelling = students.filter((s: any) => (s.analytics?.averageGrade || 0) >= 80).length

    // Subject breakdown
    const subjectScores: Record<string, number[]> = {}
    students.forEach((s: any) => {
      s.submissions.forEach((sub: any) => {
        const subj = sub.assignment?.lessonPlan?.subject || 'General'
        if (sub.grade != null) {
          if (!subjectScores[subj]) subjectScores[subj] = []
          subjectScores[subj].push(sub.grade)
        }
      })
    })

    const subjectAvgs = Object.entries(subjectScores).map(([subj, scores]) => ({
      subject: subj,
      avg: Math.round(scores.reduce((a,b) => a+b,0)/scores.length),
    })).sort((a,b) => a.avg - b.avg)

    const studentProfiles = students.slice(0,20).map((s: any) => ({
      name: `${s.user.firstName} ${s.user.lastName}`,
      avg: s.analytics?.averageGrade ? Math.round(s.analytics.averageGrade) : null,
      status: (s.analytics?.averageGrade || 0) < 50 ? 'at-risk' : (s.analytics?.averageGrade || 0) >= 80 ? 'excelling' : 'on-track',
    }))

    const className = teacher.classes[0]?.name || 'Class'

    const prompt = `You are a school academic analyst. Provide comprehensive teaching insights for a Kenyan CBC teacher.

Class: ${className} | Students: ${students.length}
Class Average: ${classAvg !== null ? classAvg+'%' : 'No data'}
At Risk (below 50%): ${atRisk} students
Excelling (above 80%): ${excelling} students

Subject Performance:
${subjectAvgs.map(s => `- ${s.subject}: ${s.avg}%`).join('\n') || 'No data'}

Student Overview:
${studentProfiles.map(s => `- ${s.name}: ${s.avg !== null ? s.avg+'%' : 'no data'} (${s.status})`).join('\n')}

Provide actionable teaching insights. Return ONLY valid JSON:
{
  "summary": "2-3 sentence class health summary",
  "classHealth": "excellent|good|fair|needs_attention",
  "atRiskStudents": [
    { "name": "student name", "concern": "specific concern", "intervention": "what teacher should do" }
  ],
  "excellingStudents": [
    { "name": "student name", "strength": "what they excel at", "suggestion": "extension activity" }
  ],
  "subjectInsights": [
    { "subject": "...", "status": "strong|average|weak", "classPattern": "observation", "teachingTip": "actionable advice" }
  ],
  "teachingStrategies": [
    { "strategy": "Specific strategy", "rationale": "Why this will help this class", "implementation": "How to do it" }
  ],
  "urgentActions": ["Action 1 for this week", "Action 2"],
  "positives": ["What is working well 1", "What is working well 2"],
  "parentCommunication": "What to communicate to parents at next meeting"
}`

    const raw = await OpenAIService.generateText([
      { role: 'system', content: 'You are a CBC academic analyst. Return ONLY valid JSON.' },
      { role: 'user', content: prompt },
    ], { maxTokens: 1500, temperature: 0.5 })

    const start = raw.indexOf('{'); const end = raw.lastIndexOf('}')
    if (start === -1 || end <= start) return NextResponse.json({ error: 'Invalid format' }, { status: 500 })

    const insights = JSON.parse(raw.slice(start, end + 1))
    return NextResponse.json({ insights, classStats: { total: students.length, classAvg, atRisk, excelling, subjectAvgs } })
  } catch (e: any) {
    console.error('[TEACHING_INSIGHTS]', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
