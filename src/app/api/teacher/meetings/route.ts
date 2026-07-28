import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { route } from '@/lib/api-middleware'
import { z } from 'zod'

const createMeetingSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  date: z.string().min(1, 'Date is required'),
  time: z.string().min(1, 'Time is required'),
  duration: z.number().optional(),
  description: z.string().optional(),
  location: z.string().optional(),
})

export const GET = route({ auth: 'TEACHER' }, async (req, { user }) => {
  try {
    console.log('📅 Fetching teacher meetings...')

    const teacher = await prisma.teacher.findUnique({
      where: { userId: user.id },
      include: { school: true }
    });

    if (!teacher) {
      return NextResponse.json({ error: 'Teacher profile not found' }, { status: 404 });
    }

    // Get query parameters
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const includePast = searchParams.get('includePast') === 'true';

    // Get meetings for the teacher's school
    const now = new Date();
    const where: any = {
      schoolId: teacher.schoolId
    };

    if (!includePast) {
      where.date = {
        gte: now // Only future meetings
      };
      where.status = {
        in: ['SCHEDULED', 'IN_PROGRESS'] // Only active meetings, exclude COMPLETED and CANCELLED
      };
    }

    const meetings = await prisma.meeting.findMany({
      where,
      include: {
        creator: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        }
      },
      orderBy: {
        date: 'asc' // Order by date, earliest first
      },
      take: limit
    });

    // Calculate meeting progress and additional info
    const formattedMeetings = meetings.map(meeting => {
      const meetingDateTime = new Date(`${meeting.date.toISOString().split('T')[0]}T${meeting.time}`);
      const now = new Date();
      const timeDiff = meetingDateTime.getTime() - now.getTime();
      const daysUntil = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
      const hoursUntil = Math.ceil(timeDiff / (1000 * 60 * 60));
      const minutesUntil = Math.ceil(timeDiff / (1000 * 60));

      // Calculate progress based on status and time
      let progress = 0;
      let progressText = '';
      
      if (meeting.status === 'SCHEDULED') {
        // Calculate progress based on how close the meeting is
        const totalMinutesUntil = Math.max(0, minutesUntil);
        
        if (totalMinutesUntil > 10080) { // More than 7 days (7 * 24 * 60)
          progress = Math.min(15, Math.max(5, 15 - Math.floor(totalMinutesUntil / 10080) * 2));
          progressText = `${daysUntil} days away`;
        } else if (totalMinutesUntil > 1440) { // More than 1 day (24 * 60)
          progress = Math.min(40, Math.max(20, 40 - Math.floor(totalMinutesUntil / 1440) * 5));
          progressText = `${daysUntil} days away`;
        } else if (totalMinutesUntil > 60) { // More than 1 hour
          progress = Math.min(70, Math.max(50, 70 - Math.floor(totalMinutesUntil / 60) * 2));
          progressText = `${hoursUntil} hours away`;
        } else if (totalMinutesUntil > 0) { // Less than 1 hour
          progress = Math.min(95, Math.max(80, 95 - totalMinutesUntil * 0.5));
          progressText = `${minutesUntil} minutes away`;
        } else {
          progress = 95;
          progressText = 'Starting soon';
        }
      } else if (meeting.status === 'IN_PROGRESS') {
        progress = 100;
        progressText = 'In Progress';
      } else if (meeting.status === 'COMPLETED') {
        progress = 100;
        progressText = 'Completed';
      } else if (meeting.status === 'CANCELLED') {
        progress = 0;
        progressText = 'Cancelled';
      } else if (meeting.status === 'POSTPONED') {
        progress = 0;
        progressText = 'Postponed';
      }

      return {
        id: meeting.id,
        title: meeting.title,
        description: meeting.description,
        date: meeting.date,
        time: meeting.time,
        duration: meeting.duration,
        location: meeting.location,
        status: meeting.status,
        attendees: meeting.attendees,
        creator: meeting.creator,
        createdAt: meeting.createdAt,
        updatedAt: meeting.updatedAt,
        // Additional progress info
        progress,
        progressText,
        daysUntil,
        hoursUntil,
        minutesUntil,
        isUpcoming: timeDiff > 0,
        isToday: daysUntil === 0,
        isTomorrow: daysUntil === 1,
        isThisWeek: daysUntil >= 0 && daysUntil <= 7
      };
    });

    // Separate upcoming and past meetings
    const upcomingMeetings = formattedMeetings.filter(meeting => meeting.isUpcoming);
    const pastMeetings = formattedMeetings.filter(meeting => !meeting.isUpcoming);

    return NextResponse.json({
      meetings: includePast ? formattedMeetings : upcomingMeetings,
      upcomingMeetings,
      pastMeetings,
      total: meetings.length,
      upcomingCount: upcomingMeetings.length,
      pastCount: pastMeetings.length
    });

  } catch (error) {
    console.error('Error fetching teacher meetings:', error);
    return NextResponse.json({ error: 'Failed to fetch meetings' }, { status: 500 });
  }
});

export const POST = route({ auth: 'TEACHER', schema: createMeetingSchema }, async (req, { user, body }) => {
  const data = body as z.infer<typeof createMeetingSchema>

  const teacher = await prisma.teacher.findUnique({
    where: { userId: user.id },
  });

  if (!teacher) {
    return NextResponse.json({ error: 'Teacher profile not found' }, { status: 404 });
  }

  const meetingDate = new Date(`${data.date}T${data.time}:00`);

  const meeting = await prisma.meeting.create({
    data: {
      title: data.title,
      description: data.description || '',
      date: meetingDate,
      time: data.time,
      duration: data.duration || 60,
      location: data.location,
      status: 'SCHEDULED',
      schoolId: teacher.schoolId,
      createdBy: user.id,
      attendees: [],
    },
  });

  return NextResponse.json({
    meeting: {
      id: meeting.id,
      title: meeting.title,
      date: meeting.date,
      time: meeting.time,
      duration: meeting.duration,
      location: meeting.location,
      status: meeting.status,
    },
  }, { status: 200 });
});
