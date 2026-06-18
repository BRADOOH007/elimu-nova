import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const CBC_LEVELS_LOWER = [
  { level: 'BE', label: 'Below Expectations',      min: 0,  max: 39,  points: 1 },
  { level: 'AE', label: 'Approaching Expectations', min: 40, max: 59,  points: 2 },
  { level: 'ME', label: 'Meeting Expectations',     min: 60, max: 79,  points: 3 },
  { level: 'EE', label: 'Exceeding Expectations',   min: 80, max: 100, points: 4 },
]

function getCBCGrade(score: number, isUpper = false): string {
  if (!isUpper) {
    if (score >= 80) return 'EE'
    if (score >= 60) return 'ME'
    if (score >= 40) return 'AE'
    return 'BE'
  }
  // Grade 7-9 rubric
  if (score >= 90) return 'EE1'
  if (score >= 75) return 'EE2'
  if (score >= 58) return 'ME1'
  if (score >= 41) return 'ME2'
  if (score >= 31) return 'AE1'
  if (score >= 21) return 'AE2'
  if (score >= 11) return 'BE1'
  return 'BE2'
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const teacher = await prisma.teacher.findUnique({
      where: { userId: session.user.id },
      include: {
        classes: {
          include: {
            students: {
              include: {
                user: true,
                submissions: {
                  include: { assignment: { select: { id: true, title: true, subject: true, dueDate: true, totalMarks: true } } },
                  where: { grade: { not: null } },
                  orderBy: { submittedAt: 'desc' },
                },
              },
            },
          },
        },
        assignments: {
          orderBy: { createdAt: 'desc' },
          take: 30,
          include: {
            submissions: {
              include: { student: { include: { user: true } } },
            },
          },
        },
      },
    })
    if (!teacher) return NextResponse.json({ error: 'Teacher not found' }, { status: 404 })

    return NextResponse.json({
      classes:     teacher.classes.map((c: any) => ({ id: c.id, name: c.name, grade: c.grade, subject: c.subject, studentCount: c.students.length })),
      assignments: teacher.assignments.map((a: any) => ({
        id:          a.id,
        title:       a.title,
        subject:     a.subject,
        totalMarks:  a.totalMarks || 100,
        submissions: a.submissions.map((s: any) => ({
          id:          s.id,
          studentId:   s.studentId,
          studentName: `${s.student?.user?.firstName} ${s.student?.user?.lastName}`,
          grade:       s.grade,
          status:      s.status,
        })),
      })),
    })
  } catch (error) {
    console.error('[GET_MARKS]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST — submit/update marks for an assignment + run AI analysis
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { assignmentId, marks, gradeSystem = 'percentage', analyseWithAI = false } = await request.json()
    // marks: [{ studentId, score, feedback? }]

    const updates = await Promise.all(
      marks.map(async (m: any) => {
        const cbcGrade = gradeSystem === 'cbc_lower'
          ? getCBCGrade(m.score, false)
          : gradeSystem === 'cbc_upper'
          ? getCBCGrade(m.score, true)
          : null

        return (prisma as any).submission.updateMany({
          where: { assignmentId, studentId: m.studentId },
          data: {
            grade:    m.score,
            feedback: m.feedback || (cbcGrade ? `${cbcGrade}: ${m.feedback || ''}`.trim() : m.feedback),
            status:   'GRADED',
          },
        })
      })
    )

    let analysis = null
    if (analyseWithAI && marks.length > 0) {
      try {
        const assignment = await prisma.assignment.findUnique({
          where: { id: assignmentId },
          select: { title: true, subject: true },
        })

        const scores = marks.map((m: any) => m.score)
        const avg    = scores.reduce((a: number, b: number) => a + b, 0) / scores.length
        const max    = Math.max(...scores)
        const min    = Math.min(...scores)
        const below  = scores.filter((s: number) => s < 50).length
        const above  = scores.filter((s: number) => s >= 75).length

        const { OpenAI } = await import('openai')
        const openai = new OpenAI({
          apiKey: process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY,
          baseURL: process.env.OPENROUTER_API_KEY ? 'https://openrouter.ai/api/v1' : undefined,
        })

        const prompt = `You are a school academic analyst. Analyse these exam results and provide concise insights.

Assignment: ${assignment?.title} (${assignment?.subject})
Students: ${marks.length}
Average: ${avg.toFixed(1)}%
Highest: ${max}% | Lowest: ${min}%
Below 50%: ${below} students | Above 75%: ${above} students

Scores distribution: ${scores.sort((a: number, b: number) => a - b).join(', ')}

Return JSON: {
  "summary": "2-sentence summary",
  "strengths": ["strength1", "strength2"],
  "concerns": ["concern1", "concern2"],
  "recommendations": ["action1", "action2", "action3"],
  "performanceLabel": "Excellent|Good|Average|Needs Improvement"
}`

        const completion = await openai.chat.completions.create({
          model: 'openai/gpt-4o-mini',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 500,
          temperature: 0.3,
          response_format: { type: 'json_object' },
        })
        analysis = JSON.parse(completion.choices[0]?.message?.content || '{}')
        analysis.stats = { avg: avg.toFixed(1), max, min, below, above, total: marks.length }
      } catch (e) { console.error('AI analysis failed:', e) }
    }

    return NextResponse.json({ updated: updates.length, analysis })
  } catch (error) {
    console.error('[POST_MARKS]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
