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
      status: meeting.status,
      attendees: meeting.attendees,
      createdBy: {
        name: `${meeting.creator.firstName} ${meeting.creator.lastName}`,
        email: meeting.creator.email
      },
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
    const { title, description, date, time, duration, location, attendees } = body

    // Validate required fields
    if (!title || !date || !time) {
      return NextResponse.json({ 
        error: 'Title, date, and time are required' 
      }, { status: 400 })
    }

    // Create meeting
    const meeting = await prisma.meeting.create({
      data: {
        schoolId,
        createdBy: user.id,
        title,
        description: description || null,
        date: new Date(date),
        time,
        duration: duration || 60,
        location: location || null,
        attendees: attendees || null
      },
      include: {
        creator: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    })

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
