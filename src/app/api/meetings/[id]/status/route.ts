import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logActivity } from '@/lib/activity-logger';
import { route } from '@/lib/api-middleware';

export const PUT = route({}, async (req, { user, params }) => {

    const body = await req.json();
    const { status } = body;

    if (!status) {
      return NextResponse.json({ error: 'Status is required' }, { status: 400 });
    }

    // Validate status is a valid MeetingStatus
    const validStatuses = ['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'POSTPONED'];
    
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ 
        error: 'Invalid status. Must be one of: ' + validStatuses.join(', ') 
      }, { status: 400 });
    }

    // Check if meeting exists
    const existingMeeting = await prisma.meeting.findUnique({
      where: { id: params.id },
      include: {
        creator: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      }
    });

    if (!existingMeeting) {
      return NextResponse.json({ error: 'Meeting not found' }, { status: 404 });
    }

    // Update meeting status
    const updatedMeeting = await prisma.meeting.update({
      where: { id: params.id },
      data: { status: status as any }, // Cast to MeetingStatus enum
      include: {
        creator: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    // Log activity
    await logActivity({
      schoolId: existingMeeting.schoolId,
      userId: user.id,
      type: 'OTHER',
      action: 'Meeting Status Updated',
      description: `Meeting "${existingMeeting.title}" status changed to ${status}`,
      metadata: {
        meetingId: existingMeeting.id,
        meetingTitle: existingMeeting.title,
        oldStatus: existingMeeting.status,
        newStatus: status,
        activityType: 'meeting'
      }
    });

    return NextResponse.json({
      message: 'Meeting status updated successfully',
      meeting: {
        id: updatedMeeting.id,
        title: updatedMeeting.title,
        status: updatedMeeting.status,
        updatedAt: updatedMeeting.updatedAt
      }
    });
})
