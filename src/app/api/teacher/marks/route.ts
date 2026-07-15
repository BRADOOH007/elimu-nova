import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { OpenAIService } from '@/lib/openai-service'

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
                  include: { assignment: { select: { id: true, title: true, subject: true, dueDate: true } } },
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

    const t = teacher as any
    return NextResponse.json({
      classes:     t.classes.map((c: any) => ({ id: c.id, name: c.name, grade: c.grade, subject: c.subject, studentCount: c.students.length })),
      assignments: t.assignments.map((a: any) => ({
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

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { assignmentId, marks, gradeSystem = 'percentage', analyseWithAI = false } = await request.json()

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

        const prompt = `You are a school academic analyst. Analyse these exam results and provide concise insights. Return ONLY valid JSON.

Assignment: ${assignment?.title} (${assignment?.subject})
Students: ${marks.length} | Average: ${avg.toFixed(1)}% | Highest: ${max}% | Lowest: ${min}%
Below 50%: ${below} | Above 75%: ${above}
Scores: ${scores.sort((a: number, b: number) => a - b).join(', ')}

Return: { "summary": "2-sentence summary", "strengths": ["s1","s2"], "concerns": ["c1","c2"], "recommendations": ["r1","r2","r3"], "performanceLabel": "Excellent|Good|Average|Needs Improvement" }`

        const raw = await OpenAIService.generateText(
          [{ role: 'user', content: prompt }],
          { maxTokens: 500, temperature: 0.3 }
        )
        const start = raw.indexOf('{'); const end = raw.lastIndexOf('}')
        if (start !== -1 && end > start) {
          analysis = JSON.parse(raw.slice(start, end + 1))
          analysis.stats = { avg: avg.toFixed(1), max, min, below, above, total: marks.length }
        }
      } catch (e) {
        console.error('[POST_MARKS_AI] AI analysis failed:', (e as any)?.message || e)
        if ((e as any)?.message?.includes?.('image')) {
          console.warn('[POST_MARKS_AI] Image-related error in AI call — non-vision model may have received content with image references')
        }
      }
    }

    return NextResponse.json({ updated: updates.length, analysis })
  } catch (error) {
    console.error('[POST_MARKS]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
