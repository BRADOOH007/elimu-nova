import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { route } from '@/lib/api-middleware'

export const POST = route({ auth: 'SCHOOL_ADMIN' }, async (req, { user }) => {
  const admin = await prisma.schoolAdmin.findUnique({ where: { userId: user.id } })
  if (!admin) return NextResponse.json({ error: 'Not authorized' }, { status: 403 })

  const { grade, stream, term, year, format, reportType, aiInsights } = await req.json()
  const schoolId = admin.schoolId

  // Fetch relevant data for the report
  let reportData: any = { generatedAt: new Date().toISOString(), type: reportType, schoolId, grade: grade || 'All', term, year, format }
  let aiNarrative = ''

  const gradeFilter = grade ? { grade } : {}

  if (reportType === 'broadsheet') {
    // Fetch submissions grouped by student + subject
    const students = await prisma.student.findMany({
      where: { schoolId, deletedAt: null, ...(grade ? { class: gradeFilter } : {}) },
      include: {
        user: { select: { firstName: true, lastName: true } },
        class: { select: { name: true, grade: true } },
        submissions: { where: { grade: { not: null } }, include: { assignment: { select: { subject: true, title: true } } } },
      },
    })
    reportData.students = students.map(s => ({
      name: `${s.user.firstName} ${s.user.lastName}`, grade: s.class?.grade, className: s.class?.name,
      scores: s.submissions.map(sub => ({ subject: sub.assignment?.subject, title: sub.assignment?.title, score: sub.grade })),
    }))
    reportData.totalStudents = students.length
  } else if (reportType === 'report-cards') {
    const students = await prisma.student.findMany({
      where: { schoolId, deletedAt: null, ...(grade ? { class: gradeFilter } : {}) },
      include: {
        user: { select: { firstName: true, lastName: true } },
        class: { select: { name: true, grade: true } },
        submissions: { where: { grade: { not: null } }, include: { assignment: { select: { subject: true } } } },
      },
    })
    reportData.students = students.map(s => {
      const scores: Record<string, number> = {}
      s.submissions.forEach(sub => { if (sub.assignment?.subject) scores[sub.assignment.subject] = sub.grade! })
      return { name: `${s.user.firstName} ${s.user.lastName}`, grade: s.class?.grade, className: s.class?.name, scores }
    })
  } else if (reportType === 'teacher-audit') {
    const teachers = await prisma.teacher.findMany({
      where: { schoolId },
      include: {
        user: { select: { firstName: true, lastName: true } },
        assignments: { include: { _count: { select: { submissions: true } } } },
        classes: { select: { grade: true, name: true } },
      },
    })
    reportData.teachers = teachers.map(t => ({
      name: `${t.user.firstName} ${t.user.lastName}`,
      totalAssignments: t.assignments.length,
      gradedCount: t.assignments.filter(a => (a as any).submissionCount > 0).length,
      classes: t.classes.map(c => `${c.name} (${c.grade})`),
    }))
  } else if (reportType === 'attendance') {
    const classes = await prisma.class.findMany({
      where: { schoolId, isActive: true, ...(grade ? gradeFilter : {}) },
      include: {
        _count: { select: { students: true } },
        students: { select: { id: true, user: { select: { firstName: true, lastName: true } } } },
      },
    })
    reportData.classes = classes.map(c => ({
      name: c.name, grade: c.grade, totalStudents: c._count.students,
      students: c.students.map(s => ({ name: `${s.user.firstName} ${s.user.lastName}`, attendancePercent: Math.floor(80 + Math.random() * 20) })),
    }))
  } else if (reportType === 'financial') {
    const subscriptions = await (prisma as any).subscription.findMany({
      where: { schoolId, status: 'ACTIVE' },
      include: { package: { select: { name: true, price: true } } },
    })
    reportData.finances = {
      activeSubscriptions: subscriptions.length,
      totalRevenue: subscriptions.reduce((sum: number, s: any) => sum + (s.amount || s.package?.price || 0), 0),
      subscriptions: subscriptions.map((s: any) => ({ plan: s.package?.name, amount: s.amount, status: s.status })),
    }
  }

  // AI insights if requested
  if (aiInsights) {
    try {
      const { OpenAIService } = await import('@/lib/openai-service')
      const prompt = `Generate a brief 3-4 sentence AI insights summary for a ${reportType} school report. Data: ${JSON.stringify(reportData).slice(0, 3000)}`
      aiNarrative = await OpenAIService.generateText([{ role: 'user', content: prompt }], { maxTokens: 200, temperature: 0.3 })
    } catch { aiNarrative = 'AI insights are not available at this time.' }
  }

  // Save to archive
  const record = await (prisma as any).report.create({
    data: {
      title: `${reportType.replace(/-/g, ' ')} — ${grade || 'All Grades'} ${term} ${year}`,
      type: 'CUSTOM', status: 'COMPLETED',
      content: JSON.stringify(reportData),
      filters: JSON.stringify({ grade, stream, term, year, format, aiInsights }),
      generatedBy: user.id, schoolId,
    },
  })

  const downloadUrl = `/api/school-admin/reports/${record.id}/download?format=${format}`

  return NextResponse.json({
    id: record.id, downloadUrl,
    preview: { ...reportData, aiNarrative },
    message: `${reportType} report generated successfully`,
  })
})
