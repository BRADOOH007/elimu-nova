import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET — fetch existing timetable schedules
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = await (prisma as any).schoolAdmin.findUnique({
      where: { userId: session.user.id },
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
  } catch (error) {
    console.error('[GET_TIMETABLE]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST — AI auto-generate timetable
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = await (prisma as any).schoolAdmin.findUnique({
      where: { userId: session.user.id },
      include: { school: true },
    })
    if (!admin) return NextResponse.json({ error: 'Not a school admin' }, { status: 403 })

    const { weekStartDate, periodsPerDay = 8, startHour = 8, clearExisting = false } = await request.json()

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

    const { OpenAI } = await import('openai')
    const openai = new OpenAI({
      apiKey: process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY,
      baseURL: process.env.OPENROUTER_API_KEY ? 'https://openrouter.ai/api/v1' : undefined,
    })

    const prompt = `You are a school timetabling system. Generate a conflict-free weekly timetable.

School: ${admin.school.name}
Week start: ${weekStartDate || 'Next Monday'}
School day: ${periodsPerDay} periods starting at ${startHour}:00, each period 45 minutes
Working days: Monday to Friday

Teachers:
${JSON.stringify(teacherInfo, null, 2)}

Classes:
${JSON.stringify(classInfo, null, 2)}

Rules:
1. Each teacher can only teach ONE class at a time
2. Each class should have 1-2 lessons per day maximum
3. Spread classes evenly across the week
4. Core subjects (Math, English, Science) should be in morning slots (periods 1-4)
5. Art, PE, Music in afternoon slots (periods 5-8)
6. Allow at least 1 free period per teacher per day

Return a JSON array of schedule entries:
[
  {
    "classId": "class_id_here",
    "teacherId": "teacher_id_here",
    "title": "Subject - Class Name",
    "subject": "subject name",
    "grade": "grade level",
    "dayOfWeek": 1,
    "period": 1,
    "startTimeHour": 8,
    "startTimeMinute": 0,
    "durationMinutes": 45,
    "location": "Classroom"
  }
]

dayOfWeek: 1=Monday, 2=Tuesday, 3=Wednesday, 4=Thursday, 5=Friday
period: 1-${periodsPerDay}
Only return the JSON array, nothing else.`

    const completion = await openai.chat.completions.create({
      model: 'openai/gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 3000,
      temperature: 0.3,
    })

    const raw = completion.choices[0]?.message?.content?.trim() || '[]'
    const cleanRaw = raw.startsWith('[') ? raw : raw.substring(raw.indexOf('['))
    const entries: any[] = JSON.parse(cleanRaw)

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
  } catch (error) {
    console.error('[POST_TIMETABLE]', error)
    return NextResponse.json({ error: 'Failed to generate timetable' }, { status: 500 })
  }
}

// DELETE — clear entire timetable
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = await (prisma as any).schoolAdmin.findUnique({ where: { userId: session.user.id } })
    if (!admin) return NextResponse.json({ error: 'Not a school admin' }, { status: 403 })

    await prisma.schedule.deleteMany({ where: { schoolId: admin.schoolId } })
    return NextResponse.json({ message: 'Timetable cleared' })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function getNextMonday(): Date {
  const d = new Date()
  const day = d.getDay()
  const diff = day === 0 ? 1 : 8 - day
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d
}
