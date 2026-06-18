import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET — fetch attendance records for a class/week
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const teacher = await prisma.teacher.findUnique({
      where: { userId: session.user.id },
      include: {
        classes: { include: { students: { include: { user: true } } } },
        students: { include: { user: true, class: true } },
      },
    })
    if (!teacher) return NextResponse.json({ error: 'Teacher not found' }, { status: 404 })

    const { searchParams } = new URL(request.url)
    const classId  = searchParams.get('classId')
    const weekDate = searchParams.get('weekDate') // ISO string for Monday of the week

    // Fetch attendance from schedule metadata (we store it as JSON in schedule metadata)
    // Uses type: 'OTHER' with title prefix 'ATTENDANCE:' since ATTENDANCE isn't a ScheduleType
    const whereClause: any = { teacherId: teacher.id, type: 'OTHER', title: { startsWith: 'ATTENDANCE:' } }
    if (classId) whereClause.classId = classId
    if (weekDate) {
      const weekStart = new Date(weekDate)
      const weekEnd   = new Date(weekDate)
      weekEnd.setDate(weekEnd.getDate() + 7)
      whereClause.startTime = { gte: weekStart, lt: weekEnd }
    }

    const attendanceRecords = await prisma.schedule.findMany({
      where: whereClause,
      include: { class: true },
      orderBy: { startTime: 'desc' },
    })

    // Return students list + existing records
    const students = classId
      ? teacher.classes.find(c => c.id === classId)?.students || []
      : teacher.students

    return NextResponse.json({
      students: students.map((s: any) => ({
        id:   s.id,
        name: `${s.user.firstName} ${s.user.lastName}`,
        class: s.class?.name || '',
      })),
      records: attendanceRecords.map(r => ({
        id:        r.id,
        weekDate:  r.startTime,
        classId:   r.classId,
        metadata:  r.metadata,
      })),
      classes: teacher.classes.map((c: any) => ({ id: c.id, name: c.name, grade: c.grade })),
    })
  } catch (error) {
    console.error('[GET_ATTENDANCE]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST — save/update attendance for a week
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const teacher = await prisma.teacher.findUnique({ where: { userId: session.user.id } })
    if (!teacher) return NextResponse.json({ error: 'Teacher not found' }, { status: 404 })

    const { classId, weekDate, attendance } = await request.json()
    // attendance: { [studentId]: { mon_am: bool, mon_pm: bool, ... } }

    const weekStart = new Date(weekDate)
    const weekEnd   = new Date(weekDate)
    weekEnd.setDate(weekEnd.getDate() + 1)

    // Upsert using schedule table with OTHER type + ATTENDANCE: title prefix
    const existing = await prisma.schedule.findFirst({
      where: { teacherId: teacher.id, classId, type: 'OTHER', title: { startsWith: 'ATTENDANCE:' }, startTime: { gte: weekStart, lt: weekEnd } },
    })

    const record = existing
      ? await prisma.schedule.update({
          where: { id: existing.id },
          data: { metadata: attendance },
        })
      : await prisma.schedule.create({
          data: {
            schoolId:    teacher.schoolId || '',
            teacherId:   teacher.id,
            classId,
            title:       `ATTENDANCE: Week of ${new Date(weekDate).toLocaleDateString()}`,
            startTime:   weekStart,
            endTime:     weekEnd,
            type:        'OTHER',
            status:      'SCHEDULED',
            metadata:    attendance,
          },
        })

    return NextResponse.json({ record })
  } catch (error) {
    console.error('[POST_ATTENDANCE]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
