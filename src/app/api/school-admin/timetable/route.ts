import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { route } from '@/lib/api-middleware'

// GET — fetch existing timetable schedules
export const GET = route({ auth: 'SCHOOL_ADMIN' }, async (req, { user }) => {
  const admin = await (prisma as any).schoolAdmin.findUnique({
    where: { userId: user.id },
  })
  if (!admin) return NextResponse.json({ error: 'Not a school admin' }, { status: 403 })

  const schedules = await prisma.schedule.findMany({
    where: { schoolId: admin.schoolId },
    include: {
      teacher: { include: { user: true } },
      class: true,
    },
    orderBy: [{ startTime: 'asc' }],
  })

  return NextResponse.json({ schedules })
})

// POST — AI auto-generate timetable
export const POST = route({ auth: 'SCHOOL_ADMIN' }, async (req, { user }) => {
  const admin = await (prisma as any).schoolAdmin.findUnique({
    where: { userId: user.id },
    include: { school: true },
  })
  if (!admin) return NextResponse.json({ error: 'Not a school admin' }, { status: 403 })

    const { weekStartDate, periodsPerDay = 8, startHour = 8, clearExisting = false } = await req.json()

    // Fetch teachers and classes
    const teachers = await prisma.teacher.findMany({
      where: { schoolId: admin.schoolId },
      include: { user: true, classes: true },
    })

    const classes = await (prisma as any).class.findMany({
      where: { schoolId: admin.schoolId, isActive: true },
      include: { teacher: { include: { user: true } } },
    })

    if (classes.length === 0) {
      return NextResponse.json({ error: 'No active classes found. Create classes first.' }, { status: 400 })
    }

    // Build context for AI
    const teacherInfo = teachers.map((t: any) => ({
      id: t.id,
      name: `${t.user.firstName} ${t.user.lastName}`,
      classes: t.classes.map((c: any) => `${c.subject} (${c.grade})`),
    }))

    const classInfo = classes.map((c: any) => ({
      id: c.id,
      name: c.name,
      subject: c.subject,
      grade: c.grade,
      teacherId: c.teacherId,
      teacherName: c.teacher ? `${c.teacher.user.firstName} ${c.teacher.user.lastName}` : 'Unassigned',
    }))

    const { OpenAIService } = await import('@/lib/openai-service')

    const prompt = `You are a school timetabling system. Generate a conflict-free weekly timetable.

School: ${admin.school.name}
Week start: ${weekStartDate || 'Next Monday'}
School day: ${periodsPerDay} periods starting at ${startHour}:00, each 45 minutes
Working days: Monday to Friday

Teachers:
${JSON.stringify(teacherInfo, null, 2)}

Classes:
${JSON.stringify(classInfo, null, 2)}

Rules:
1. Each teacher can only teach ONE class at a time
2. Each class max 1-2 lessons per day
3. Core subjects (Math, English, Science) in morning slots (periods 1-4)
4. Art, PE, Music in afternoon slots (periods 5-8)

Return ONLY a JSON array — no markdown, no explanation:
[{ "classId": "id", "teacherId": "id", "title": "Subject - Class", "subject": "subject", "grade": "grade", "dayOfWeek": 1, "period": 1, "startTimeHour": 8, "startTimeMinute": 0, "durationMinutes": 45, "location": "Classroom" }]
dayOfWeek: 1=Monday…5=Friday. period: 1-${periodsPerDay}.`

    const aiRaw = await OpenAIService.generateLongContent(
      [{ role: 'user', content: prompt }],
      { maxTokens: 3000, temperature: 0.3 }
    )
    const arrStart = aiRaw.indexOf('['); const arrEnd = aiRaw.lastIndexOf(']')
    const entries: any[] = (arrStart !== -1 && arrEnd > arrStart)
      ? JSON.parse(aiRaw.slice(arrStart, arrEnd + 1))
      : []

    // Clear existing if requested
    if (clearExisting) {
      await prisma.schedule.deleteMany({ where: { schoolId: admin.schoolId } })
    }

    // Calculate actual dates for the week
    const weekStart = weekStartDate ? new Date(weekStartDate) : getNextMonday()

    const created: any[] = []
    for (const entry of entries) {
      const classRecord = classes.find((c: any) => c.id === entry.classId)
      const teacher = teachers.find((t: any) => t.id === entry.teacherId)
      if (!classRecord || !teacher) continue

      const dayDate = new Date(weekStart)
      dayDate.setDate(weekStart.getDate() + (entry.dayOfWeek - 1))
      dayDate.setHours(entry.startTimeHour || startHour, entry.startTimeMinute || 0, 0, 0)

      const endDate = new Date(dayDate)
      endDate.setMinutes(endDate.getMinutes() + (entry.durationMinutes || 45))

      try {
        const schedule = await prisma.schedule.create({
          data: {
            schoolId:    admin.schoolId,
            teacherId:   entry.teacherId,
            classId:     entry.classId,
            title:       entry.title || `${entry.subject} - ${classRecord.name}`,
            subject:     entry.subject || classRecord.subject,
            grade:       entry.grade || classRecord.grade,
            startTime:   dayDate,
            endTime:     endDate,
            location:    entry.location || 'Classroom',
            type:        'CLASS',
            status:      'SCHEDULED',
            recurring:   true,
            recurringPattern: 'weekly',
          },
        })
        created.push(schedule)
      } catch (e) {
        console.error('Failed to create schedule entry:', e)
      }
    }

    return NextResponse.json({
      message: `Timetable generated: ${created.length} lessons scheduled across the week`,
      count: created.length,
      schedules: created,
    })
})

// DELETE — clear entire timetable
export const DELETE = route({ auth: 'SCHOOL_ADMIN' }, async (req, { user }) => {
  const admin = await (prisma as any).schoolAdmin.findUnique({ where: { userId: user.id } })
  if (!admin) return NextResponse.json({ error: 'Not a school admin' }, { status: 403 })

  await prisma.schedule.deleteMany({ where: { schoolId: admin.schoolId } })
  return NextResponse.json({ message: 'Timetable cleared' })
})

function getNextMonday(): Date {
  const d = new Date()
  const day = d.getDay()
  const diff = day === 0 ? 1 : 8 - day
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d
}
