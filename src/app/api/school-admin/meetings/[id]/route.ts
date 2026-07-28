import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { logActivity } from '@/lib/activity-logger'
import { route } from '@/lib/api-middleware'

export const GET = route({ auth: 'SCHOOL_ADMIN' }, async (req, { user, params }) => {
  const { id } = await params
  const schoolAdmin = await prisma.schoolAdmin.findUnique({
    where: { userId: user.id }
  })

    if (!schoolAdmin) {
      return NextResponse.json({ error: 'School admin not found' }, { status: 404 })
    }

    // Get meeting
    const meeting = await prisma.meeting.findFirst({
      where: {
        id,
        schoolId: schoolAdmin.schoolId
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

    if (!meeting) {
      return NextResponse.json({ error: 'Meeting not found' }, { status: 404 })
    }

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

    return NextResponse.json({ meeting: formattedMeeting })
})

export const PUT = route({ auth: 'SCHOOL_ADMIN' }, async (req, { user, params }) => {
  const { id } = await params
    const body = await req.json()
    const { title, description, date, time, duration, location, status, attendees } = body

    // Get school admin's school ID
    const schoolAdmin = await prisma.schoolAdmin.findUnique({
      where: { userId: user.id }
    })

    if (!schoolAdmin) {
      return NextResponse.json({ error: 'School admin not found' }, { status: 404 })
    }

    // Check if meeting exists
    const existingMeeting = await prisma.meeting.findFirst({
      where: {
        id,
        schoolId: schoolAdmin.schoolId
      }
    })

    if (!existingMeeting) {
      return NextResponse.json({ error: 'Meeting not found' }, { status: 404 })
    }

    // Validate status if provided
    if (status) {
      const validStatuses = ['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'POSTPONED'];
      
      if (!validStatuses.includes(status)) {
        return NextResponse.json({ 
          error: 'Invalid status. Must be one of: ' + validStatuses.join(', ') 
        }, { status: 400 });
      }
    }

    // Update meeting
    const updatedMeeting = await prisma.meeting.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(date && { date: new Date(date) }),
        ...(time && { time }),
        ...(duration && { duration }),
        ...(location !== undefined && { location }),
        ...(status && { status: status as any }), // Cast to MeetingStatus enum
        ...(attendees !== undefined && { attendees })
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

    // Log activity if status changed
    if (status && status !== existingMeeting.status) {
      await logActivity({
        schoolId: schoolAdmin.schoolId,
        userId: user.id,
        type: 'MEETING_SCHEDULED',
        action: 'Meeting Status Updated',
        description: `Meeting status changed to: ${status}`,
        metadata: {
          meetingId: updatedMeeting.id,
          oldStatus: existingMeeting.status,
          newStatus: status,
          title: updatedMeeting.title
        }
      })
    }

    const formattedMeeting = {
      id: updatedMeeting.id,
      title: updatedMeeting.title,
      description: updatedMeeting.description,
      date: updatedMeeting.date.toISOString().split('T')[0],
      time: updatedMeeting.time,
      duration: updatedMeeting.duration,
      location: updatedMeeting.location,
      status: updatedMeeting.status,
      attendees: updatedMeeting.attendees,
      createdBy: {
        name: `${updatedMeeting.creator.firstName} ${updatedMeeting.creator.lastName}`,
        email: updatedMeeting.creator.email
      },
      createdAt: updatedMeeting.createdAt,
      updatedAt: updatedMeeting.updatedAt
    }

    return NextResponse.json({ 
      message: 'Meeting updated successfully',
      meeting: formattedMeeting
    })
})

export const DELETE = route({ auth: 'SCHOOL_ADMIN' }, async (req, { user, params }) => {
  const { id } = await params
  const schoolAdmin = await prisma.schoolAdmin.findUnique({
    where: { userId: user.id }
  })

    if (!schoolAdmin) {
      return NextResponse.json({ error: 'School admin not found' }, { status: 404 })
    }

    // Check if meeting exists
    const existingMeeting = await prisma.meeting.findFirst({
      where: {
        id,
        schoolId: schoolAdmin.schoolId
      }
    })

    if (!existingMeeting) {
      return NextResponse.json({ error: 'Meeting not found' }, { status: 404 })
    }

    // Delete meeting
    await prisma.meeting.delete({
      where: { id }
    })

    // Log activity
    await logActivity({
      schoolId: schoolAdmin.schoolId,
      userId: user.id,
      type: 'MEETING_SCHEDULED',
      action: 'Meeting Deleted',
      description: `Deleted meeting: ${existingMeeting.title}`,
      metadata: {
        meetingId: existingMeeting.id,
        title: existingMeeting.title,
        date: existingMeeting.date
      }
    })

    return NextResponse.json({ message: 'Meeting deleted successfully' })
})
