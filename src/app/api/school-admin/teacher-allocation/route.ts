import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = await (prisma as any).schoolAdmin.findUnique({
      where: { userId: session.user.id },
      include: { school: true },
    })
    if (!admin) return NextResponse.json({ error: 'Not a school admin' }, { status: 403 })

    const { applyRecommendations = false } = await request.json()

    // Fetch all teachers with their current load
    const teachers = await prisma.teacher.findMany({
      where: { schoolId: admin.schoolId },
      include: {
        user: true,
        classes: {
          where: { isActive: true },
          include: { students: true },
        },
        lessonPlans: { select: { id: true }, take: 100 },
        assignments: { select: { id: true }, take: 100 },
        studentProgress: { select: { id: true, masteryScore: true } },
      },
    })

    // Fetch unassigned classes
    const unassignedClasses = await (prisma as any).class.findMany({
      where: {
        schoolId: admin.schoolId,
        isActive: true,
        teacherId: { in: [] }, // workaround — get all and filter
      },
      include: { teacher: true },
    })

    // Build teacher profiles
    const teacherProfiles = teachers.map((t: any) => {
      const currentLoad = t.classes.length
      const totalStudents = t.classes.reduce((s: number, c: any) => s + c.students.length, 0)
      const avgMastery = t.studentProgress.length > 0
        ? Math.round(t.studentProgress.reduce((s: number, p: any) => s + p.masteryScore, 0) / t.studentProgress.length)
        : 0
      const subjects = [...new Set(t.classes.map((c: any) => c.subject))]

      return {
        id:            t.id,
        name:          `${t.user.firstName} ${t.user.lastName}`,
        email:         t.user.email,
        currentLoad,
        totalStudents,
        lessonPlans:   t.lessonPlans.length,
        assignments:   t.assignments.length,
        avgMastery,
        subjects,
        isOverloaded:  currentLoad > 5 || totalStudents > 150,
        isUnderutilised: currentLoad < 2,
      }
    })

    // AI-powered recommendations
    const { OpenAI } = await import('openai')
    const openai = new OpenAI({
      apiKey: process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY,
      baseURL: process.env.OPENROUTER_API_KEY ? 'https://openrouter.ai/api/v1' : undefined,
    })

    const prompt = `You are a school administration AI. Analyse these teacher workloads and provide smart allocation recommendations.

School: ${admin.school.name}

Teacher Profiles:
${JSON.stringify(teacherProfiles, null, 2)}

All Classes:
${JSON.stringify(unassignedClasses.map((c: any) => ({
  id: c.id,
  name: c.name,
  subject: c.subject,
  grade: c.grade,
  currentTeacherId: c.teacherId,
  currentTeacherName: c.teacher ? `${c.teacher.user?.firstName} ${c.teacher.user?.lastName}` : 'None',
})), null, 2)}

Analyse and return a JSON object with:
{
  "summary": "Brief summary of the current allocation status",
  "overallHealth": "good/warning/critical",
  "insights": [
    {
      "type": "overload/underutilised/subject_mismatch/balanced",
      "teacherId": "id",
      "teacherName": "name",
      "message": "specific insight message",
      "severity": "high/medium/low"
    }
  ],
  "recommendations": [
    {
      "type": "rebalance/assign/reassign",
      "fromTeacherId": "id or null",
      "toTeacherId": "id",
      "classId": "class_id",
      "reason": "specific reason",
      "priority": "high/medium/low"
    }
  ],
  "stats": {
    "avgClassesPerTeacher": 0,
    "avgStudentsPerTeacher": 0,
    "overloadedTeachers": 0,
    "underutilisedTeachers": 0
  }
}

Focus on: workload balance, subject expertise matching, student-teacher ratios.
Only return the JSON object.`

    const completion = await openai.chat.completions.create({
      model: 'openai/gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 1500,
      temperature: 0.3,
      response_format: { type: 'json_object' },
    })

    const result = JSON.parse(completion.choices[0]?.message?.content || '{}')

    // If apply is requested, execute safe rebalance recommendations
    let applied = 0
    if (applyRecommendations && result.recommendations) {
      for (const rec of result.recommendations) {
        if (rec.type === 'assign' && rec.classId && rec.toTeacherId) {
          try {
            await (prisma as any).class.update({
              where: { id: rec.classId },
              data: { teacherId: rec.toTeacherId },
            })
            // Also update students in the class
            await (prisma as any).student.updateMany({
              where: { classId: rec.classId },
              data: { teacherId: rec.toTeacherId },
            })
            applied++
          } catch (e) { console.error('Failed to apply recommendation:', e) }
        }
      }
    }

    return NextResponse.json({
      ...result,
      teacherProfiles,
      appliedRecommendations: applied,
    })
  } catch (error) {
    console.error('[TEACHER_ALLOCATION]', error)
    return NextResponse.json({ error: 'Failed to analyse teacher allocation' }, { status: 500 })
  }
}
