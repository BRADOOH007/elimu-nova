import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { logActivity } from '@/lib/activity-logger'
import { route } from '@/lib/api-middleware'

export const GET = route({ auth: 'SCHOOL_ADMIN' }, async (req, { user }) => {
  const schoolAdmin = await prisma.schoolAdmin.findUnique({
    where: { userId: user.id },
    include: { school: true }
  })

    if (!schoolAdmin) {
      return NextResponse.json({ error: 'School admin not found' }, { status: 404 })
    }

    const schoolId = schoolAdmin.schoolId

    // Get query parameters
    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || 'all'

    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {
      schoolId
    }

    if (search) {
      where.OR = [
        {
          title: {
            contains: search,
            mode: 'insensitive'
          }
        },
        {
          description: {
            contains: search,
            mode: 'insensitive'
          }
        },
        {
          location: {
            contains: search,
            mode: 'insensitive'
          }
        }
      ]
    }

    if (status !== 'all') {
      where.status = status
    }

    // Get meetings with pagination
    const [meetings, total] = await Promise.all([
      prisma.meeting.findMany({
        where,
        skip,
        take: limit,
        orderBy: { date: 'asc' },
        include: {
          creator: {
            select: {
              firstName: true,
              lastName: true,
              email: true
            }
          }
        }
      }),
      prisma.meeting.count({ where })
    ])

    // Format meetings data
    const formattedMeetings = meetings.map(meeting => ({
      id: meeting.id,
      title: meeting.title,
      description: meeting.description,
      date: meeting.date.toISOString().split('T')[0],
      time: meeting.time,
      duration: meeting.duration,
      location: meeting.location,
      meetingType: (meeting as any).meetingType || 'IN_PERSON',
      videoLink: (meeting as any).videoLink || (meeting as any).zoomJoinUrl || null,
      status: meeting.status,
      attendees: meeting.attendees,
      createdBy: { name: `${meeting.creator.firstName} ${meeting.creator.lastName}`, email: meeting.creator.email },
      createdAt: meeting.createdAt,
      updatedAt: meeting.updatedAt
    }))

    return NextResponse.json({
      meetings: formattedMeetings,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
})

export const POST = route({ auth: 'SCHOOL_ADMIN' }, async (req, { user }) => {
  const schoolAdmin = await prisma.schoolAdmin.findUnique({
    where: { userId: user.id }
  })

    if (!schoolAdmin) {
      return NextResponse.json({ error: 'School admin not found' }, { status: 404 })
    }

    const schoolId = schoolAdmin.schoolId
    const body = await req.json()
    const { title, description, date, time, duration, location, attendees, meetingType, videoLink, targetRoles, targetGrades } = body

    if (!title || !date || !time) {
      return NextResponse.json({ error: 'Title, date, and time are required' }, { status: 400 })
    }

    const meetingData: any = {
      schoolId,
      createdBy: user.id,
      title,
      description: description || null,
      date: new Date(date),
      time,
      duration: duration || 60,
      location: location || null,
      attendees: attendees || null,
      targetRoles: Array.isArray(targetRoles) ? targetRoles : [],
      targetGrades: Array.isArray(targetGrades) ? targetGrades : [],
    }
    if (meetingType) meetingData.meetingType = meetingType
    if (videoLink) meetingData.videoLink = videoLink
    if (meetingType === 'VIRTUAL') { meetingData.zoomProvider = 'manual'; meetingData.zoomJoinUrl = videoLink || null }

    const meeting = await prisma.meeting.create({ data: meetingData,
      include: { creator: { select: { firstName: true, lastName: true, email: true } } }
    })

    // Sync to teacher schedules if targeted at teachers
    if (!targetRoles || targetRoles.length === 0 || targetRoles.includes('TEACHER')) {
      const teacherIds = await resolveTargetTeachers(schoolId, targetGrades)
      for (const tid of teacherIds) {
        await (prisma as any).schedule.create({
          data: { schoolId, teacherId: tid, title: `MEETING: ${title}`, description,
            startTime: new Date(`${date}T${time}`), endTime: new Date(`${date}T${time}`),
            type: 'MEETING', location: location || videoLink || null, metadata: { meetingId: meeting.id } },
        }).catch(() => {})
      }
    }

    // Sync to student/parent notifications
    if (!targetRoles || targetRoles.length === 0 || targetRoles.includes('STUDENT') || targetRoles.includes('PARENT')) {
      const studentUserIds = await resolveTargetStudents(schoolId, targetGrades)
      const parentUserIds = targetRoles?.includes('PARENT') ? await resolveTargetParents(schoolId, targetGrades) : []
      const allRecipientIds = [...new Set([...studentUserIds, ...parentUserIds])]
      for (const userId of allRecipientIds) {
        await (prisma as any).notification.create({
          data: { title: `Meeting: ${title}`, message: `${meetingType === 'VIRTUAL' ? 'Virtual' : 'In-person'} meeting on ${date} at ${time}`, type: 'meeting', userId, schoolId, senderId: user.id },
        }).catch(() => {})
      }
    }

    // Log activity
    await logActivity({
      schoolId,
      userId: user.id,
      type: 'MEETING_SCHEDULED',
      action: 'Meeting Scheduled',
      description: `Scheduled meeting: ${title}`,
      metadata: {
        meetingId: meeting.id,
        date: meeting.date,
        time: meeting.time,
        location: meeting.location
      }
    })

    const formattedMeeting = {
      id: meeting.id,
      title: meeting.title,
      description: meeting.description,
      date: meeting.date.toISOString().split('T')[0],
      time: meeting.time,
      duration: meeting.duration,
      location: meeting.location,
      status: meeting.status,
      attendees: meeting.attendees,
      createdBy: {
        name: `${meeting.creator.firstName} ${meeting.creator.lastName}`,
        email: meeting.creator.email
      },
      createdAt: meeting.createdAt,
      updatedAt: meeting.updatedAt
    }

    return NextResponse.json({ 
      message: 'Meeting scheduled successfully',
      meeting: formattedMeeting
    }, { status: 201 })
})

async function resolveTargetTeachers(schoolId: string, targetGrades: string[]): Promise<string[]> {
  const where: any = { schoolId }
  if (targetGrades?.length > 0) where.gradeLevels = { hasSome: targetGrades }
  return (await prisma.teacher.findMany({ where, select: { id: true } })).map(t => t.id)
}

async function resolveTargetStudents(schoolId: string, targetGrades: string[]): Promise<string[]> {
  const where: any = { schoolId }
  if (targetGrades?.length > 0) where.class = { grade: { in: targetGrades } }
  return (await prisma.student.findMany({ where, select: { userId: true } })).map(s => s.userId)
}

async function resolveTargetParents(schoolId: string, targetGrades: string[]): Promise<string[]> {
  if (targetGrades?.length > 0) {
    const students = await prisma.student.findMany({
      where: { schoolId, class: { grade: { in: targetGrades } } },
      select: { userId: true },
    })
    const parentStudents = await prisma.parentStudent.findMany({
      where: { studentId: { in: students.map(s => s.userId) } },
      include: { parent: { include: { user: { select: { id: true } } } } },
    })
    return [...new Set(parentStudents.map(ps => ps.parent.user.id))]
  }
  const parents = await prisma.parent.findMany({ where: { schoolId }, include: { user: { select: { id: true } } } })
  return parents.map(p => p.user.id)
}
