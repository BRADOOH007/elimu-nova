import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { route } from '@/lib/api-middleware'
import { CBCReportCardGenerator } from '@/lib/cbc-report-card'

export const POST = route({ auth: ['TEACHER', 'SCHOOL_ADMIN', 'SUPER_ADMIN'] }, async (req) => {
  try {
    const { studentId, term, year } = await req.json()
    if (!studentId || !term || !year) {
      return NextResponse.json({ error: 'studentId, term, and year are required' }, { status: 400 })
    }

    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        user: true,
        school: true,
        class: true,
        teacher: { include: { user: true } },
        submissions: {
          where: { grade: { not: null } },
          include: { assignment: { select: { subject: true, title: true } } },
        },
      },
    })

    if (!student) return NextResponse.json({ error: 'Student not found' }, { status: 404 })

    const subjectMap: Record<string, number[]> = {}
    for (const sub of student.submissions) {
      const subject = sub.assignment.subject || 'General'
      if (!subjectMap[subject]) subjectMap[subject] = []
      if (sub.grade != null) subjectMap[subject].push(sub.grade)
    }

    const subjectGrades = Object.entries(subjectMap).map(([subject, scores]) => ({
      subject,
      score: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
    }))

    const threeMonthsAgo = new Date()
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)
    const attendance = await prisma.studentProgress.count({
      where: { studentId, createdAt: { gte: threeMonthsAgo } },
    })

    const reportData = {
      student: {
        name: `${student.user.firstName} ${student.user.lastName}`,
        grade: student.class?.grade || '—',
        class: student.class?.name || '—',
        term: String(term),
        year: Number(year),
        schoolName: student.school?.name || '—',
        teacherName: student.teacher ? `${student.teacher.user.firstName} ${student.teacher.user.lastName}` : '—',
        admissionNo: student.user.username || undefined,
      },
      subjects: subjectGrades.map(sg => {
        const gradeLabel = sg.score >= 80 ? 'A' : sg.score >= 65 ? 'B' : sg.score >= 50 ? 'C' : sg.score >= 30 ? 'D' : 'E'
        return {
          subject: sg.subject,
          score: sg.score,
          grade: gradeLabel,
          competency: gradeLabel === 'E' ? 'Needs Support' : gradeLabel === 'D' ? 'Developing' : gradeLabel === 'C' ? 'Approaching' : gradeLabel === 'B' ? 'Meeting' : 'Exceeding',
          comment: `${sg.subject}: ${sg.score}% — ${gradeLabel}`,
        }
      }),
      coreCompetencies: [
        { name: 'Communication and Collaboration', rating: 'Meeting', notes: 'Actively participates in group activities.' },
        { name: 'Critical Thinking and Problem Solving', rating: 'Approaching', notes: 'Developing analytical skills.' },
        { name: 'Creativity and Imagination', rating: 'Meeting', notes: 'Shows creativity in assignments.' },
        { name: 'Citizenship', rating: 'Exceeding', notes: 'Exemplary conduct and leadership.' },
        { name: 'Digital Literacy', rating: 'Meeting', notes: 'Comfortable with learning tools.' },
        { name: 'Learning to Learn', rating: 'Approaching', notes: 'Building independent study habits.' },
      ],
      teacherComment: `${student.user.firstName} has shown ${subjectGrades.some(s => s.score >= 65) ? 'good' : 'developing'} progress this term. Continue working hard and seeking help when needed.`,
      daysPresent: attendance,
      daysAbsent: Math.max(0, Math.round(attendance * 0.1)),
      totalDays: attendance || 1,
    }

    const generator = new CBCReportCardGenerator()
    const pdf = generator.generate(reportData)
    const pdfBuffer = Buffer.from(pdf.output('arraybuffer'))

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="report_card_${student.user.firstName}_${student.user.lastName}_term${term}_${year}.pdf"`,
      },
    })
  } catch (error) {
    console.error('[ReportCard] Error:', error)
    return NextResponse.json({ error: 'Failed to generate report card' }, { status: 500 })
  }
})
