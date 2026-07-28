import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { route, apiLogger } from '@/lib/api-middleware'

const log = apiLogger('teacher/attendance/summary')

export const dynamic = 'force-dynamic'

export const GET = route({ auth: 'TEACHER' }, async (req, { user }) => {
  try {
    const teacher = await prisma.teacher.findUnique({
      where: { userId: user.id },
      include: {
        classes: { include: { students: { include: { user: { select: { firstName: true, lastName: true } } } } } },
        students: { include: { user: { select: { firstName: true, lastName: true } } } },
      },
    })
    if (!teacher) return NextResponse.json({ error: 'Teacher not found' }, { status: 404 })

    const { searchParams } = new URL(req.url)
    const classId = searchParams.get('classId') || ''
    const termStart = searchParams.get('termStart')
    const termEnd = searchParams.get('termEnd')

    const whereClause: any = {
      teacherId: teacher.id,
      type: 'OTHER',
      title: { startsWith: 'ATTENDANCE:' },
    }
    if (classId) whereClause.classId = classId
    if (termStart || termEnd) {
      whereClause.startTime = {}
      if (termStart) whereClause.startTime.gte = new Date(termStart)
      if (termEnd) whereClause.startTime.lte = new Date(termEnd)
    }

    const records = await prisma.schedule.findMany({
      where: whereClause,
      orderBy: { startTime: 'asc' },
    })

    // Aggregate per student across all weeks
    const studentMap: Record<string, {
      id: string
      name: string
      present: number
      absent: number
      total: number
    }> = {}

    const students = classId
      ? teacher.classes.find(c => c.id === classId)?.students || []
      : teacher.students

    for (const s of students) {
      studentMap[s.id] = {
        id: s.id,
        name: `${s.user.firstName} ${s.user.lastName}`,
        present: 0,
        absent: 0,
        total: 0,
      }
    }

    for (const record of records) {
      const meta = record.metadata as Record<string, Record<string, boolean>> | null
      if (!meta) continue
      for (const [studentId, sessions] of Object.entries(meta)) {
        if (!studentMap[studentId]) continue
        for (const [, present] of Object.entries(sessions)) {
          studentMap[studentId].total++
          if (present) studentMap[studentId].present++
          else studentMap[studentId].absent++
        }
      }
    }

    const summary = Object.values(studentMap)
      .map(s => ({
        ...s,
        rate: s.total > 0 ? Math.round((s.present / s.total) * 100) : 0,
      }))
      .sort((a, b) => b.rate - a.rate || a.name.localeCompare(b.name))

    const totalSessions = summary.reduce((acc, s) => acc + s.total, 0)
    const avgRate = summary.length > 0
      ? Math.round(summary.reduce((acc, s) => acc + s.rate, 0) / summary.length)
      : 0

    const above90 = summary.filter(s => s.rate >= 90).length
    const below75 = summary.filter(s => s.rate < 75).length

    return NextResponse.json({
      summary,
      stats: {
        totalStudents: summary.length,
        totalSessions,
        averageRate: avgRate,
        above90,
        below75,
      },
      weeks: records.length,
    })
  } catch (error) {
    log.error('Error fetching attendance summary:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
})
