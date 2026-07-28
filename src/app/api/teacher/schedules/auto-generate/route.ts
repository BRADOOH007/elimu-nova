import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { route } from '@/lib/api-middleware'

export const POST = route({ auth: 'TEACHER' }, async (req, { user }) => {
  try {
    const teacher = await prisma.teacher.findUnique({
      where: { userId: user.id }
    })
    if (!teacher) {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 })
    }

    const body = await req.json()
    const { schemeOfWorkId, startDate } = body

    if (!schemeOfWorkId || !startDate) {
      return NextResponse.json(
        { error: 'schemeOfWorkId and startDate are required' },
        { status: 400 }
      )
    }

    const scheme = await prisma.schemeOfWork.findUnique({
      where: { id: schemeOfWorkId },
      include: { topics: { orderBy: [{ weekNumber: 'asc' }, { lessonNumber: 'asc' }] } }
    })
    if (!scheme) {
      return NextResponse.json({ error: 'Scheme of Work not found' }, { status: 404 })
    }
    if (scheme.teacherId !== teacher.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const classMatch = await prisma.class.findFirst({
      where: { teacherId: teacher.id, subject: scheme.subject, grade: scheme.grade }
    })
    if (!classMatch) {
      return NextResponse.json(
        { error: 'No matching class found for this scheme\'s subject and grade' },
        { status: 400 }
      )
    }

    const baseDate = new Date(startDate)
    const baseDay = baseDate.getDay()
    const mondayOffset = baseDay === 0 ? 1 : baseDay === 1 ? 0 : -(baseDay - 1)
    const weekMonday = new Date(baseDate)
    weekMonday.setDate(baseDate.getDate() + mondayOffset)

    const topicsByWeek: Record<number, typeof scheme.topics> = {}
    for (const topic of scheme.topics) {
      if (!topicsByWeek[topic.weekNumber]) topicsByWeek[topic.weekNumber] = []
      topicsByWeek[topic.weekNumber].push(topic)
    }

    const created: Array<Record<string, unknown>> = []

    for (const [weekNum, topics] of Object.entries(topicsByWeek)) {
      for (const topic of topics) {
        const lessonIndex = topic.lessonNumber - 1
        const dayOfWeek = (lessonIndex % 5) + 1
        if (dayOfWeek > 5) continue

        const lessonDate = new Date(weekMonday)
        lessonDate.setDate(weekMonday.getDate() + (Number(weekNum) - 1) * 7 + (dayOfWeek - 1))

        const startHour = 8 + Math.floor((topic.lessonNumber - 1) * 60 / 60) % 8
        const startMin = ((topic.lessonNumber - 1) * 60) % 60
        const startStr = `${String(startHour).padStart(2, '0')}:${String(startMin).padStart(2, '0')}`

        const totalMin = (startHour * 60 + startMin) + (topic.duration || 60)
        const endHour = Math.floor(totalMin / 60) % 24
        const endMin = totalMin % 60
        const endStr = `${String(endHour).padStart(2, '0')}:${String(endMin).padStart(2, '0')}`

        const record = await (prisma as any).classSchedule.create({
          data: {
            classId: classMatch.id,
            schoolId: teacher.schoolId,
            teacherId: teacher.id,
            dayOfWeek,
            startTime: startStr,
            endTime: endStr,
            subject: scheme.subject,
            startDate: lessonDate,
            isActive: true,
            recurring: false,
          }
        })

        created.push({
          id: record.id,
          title: topic.title,
          dayOfWeek,
          startTime: startStr,
          endTime: endStr,
          date: lessonDate.toISOString().split('T')[0],
          weekNumber: Number(weekNum),
          lessonNumber: topic.lessonNumber,
        })
      }
    }

    return NextResponse.json({
      message: `Created ${created.length} schedule entries`,
      count: created.length,
      schedules: created
    }, { status: 201 })

  } catch (error) {
    console.error('[AUTO_GENERATE_SCHEDULE]', error)
    return NextResponse.json({ error: 'Failed to auto-generate schedule' }, { status: 500 })
  }
})
