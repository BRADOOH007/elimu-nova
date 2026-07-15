import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ScheduleType, ScheduleStatus } from '@prisma/client'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get teacher's school ID
    const teacher = await prisma.teacher.findUnique({
      where: { userId: session.user.id },
      include: { classes: true }
    })

    if (!teacher) {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 })
    }

    // Get first class for sample schedules
    const firstClass = teacher.classes[0]

    // Create sample schedules
    const sampleSchedules = [
      {
        schoolId: teacher.schoolId ?? "",
        teacherId: teacher.id,
        classId: firstClass?.id ?? null,
        title: 'Mathematics Class',
        description: 'Algebra fundamentals and problem solving',
        subject: 'Mathematics',
        grade: 'Grade 7',
        startTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
        endTime: new Date(Date.now() + 24 * 60 * 60 * 1000 + 60 * 60 * 1000), // Tomorrow + 1 hour
        location: 'Room 101',
        type: 'CLASS' as ScheduleType,
        status: 'SCHEDULED' as ScheduleStatus,
        recurring: false
      },
      {
        schoolId: teacher.schoolId ?? "",
        teacherId: teacher.id,
        classId: firstClass?.id ?? null,
        title: 'Science Lab',
        description: 'Photosynthesis experiment and observation',
        subject: 'Biology',
        grade: 'Grade 9',
        startTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // Day after tomorrow
        endTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 90 * 60 * 1000), // Day after tomorrow + 1.5 hours
        location: 'Lab 205',
        type: 'CLASS' as ScheduleType,
        status: 'SCHEDULED' as ScheduleStatus,
        recurring: false
      },
      {
        schoolId: teacher.schoolId ?? "",
        teacherId: teacher.id,
        classId: null,
        title: 'Parent Meeting',
        description: 'Discuss student progress and upcoming assessments',
        subject: 'General',
        grade: 'All',
        startTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
        endTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000), // 3 days from now + 1 hour
        location: 'Office 301',
        type: 'MEETING' as ScheduleType,
        status: 'SCHEDULED' as ScheduleStatus,
        recurring: false
      },
      {
        schoolId: teacher.schoolId ?? "",
        teacherId: teacher.id,
        classId: null,
        title: 'Office Hours',
        description: 'Student consultation and homework help',
        subject: 'General',
        grade: 'All',
        startTime: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000), // 4 days from now
        endTime: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000 + 90 * 60 * 1000), // 4 days from now + 1.5 hours
        location: 'Office 301',
        type: 'OFFICE_HOURS' as ScheduleType,
        status: 'SCHEDULED' as ScheduleStatus,
        recurring: true,
        recurringPattern: 'weekly'
      },
      {
        schoolId: teacher.schoolId ?? "",
        teacherId: teacher.id,
        classId: firstClass?.id ?? null,
        title: 'Mathematics Exam',
        description: 'End of chapter assessment on algebra',
        subject: 'Mathematics',
        grade: 'Grade 7',
        startTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
        endTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 120 * 60 * 1000), // 1 week from now + 2 hours
        location: 'Room 101',
        type: 'EXAM' as ScheduleType,
        status: 'SCHEDULED' as ScheduleStatus,
        recurring: false
      }
    ]

    // Create schedules
    const createdSchedules = await Promise.all(
      sampleSchedules.map(schedule => 
        prisma.schedule.create({ data: schedule })
      )
    )

    return NextResponse.json({
      message: 'Sample schedules created successfully',
      count: createdSchedules.length,
      schedules: createdSchedules.map(schedule => ({
        id: schedule.id,
        title: schedule.title,
        type: schedule.type,
        startTime: schedule.startTime.toISOString()
      }))
    })

  } catch (error) {
    console.error('Error creating sample schedules:', error)
    return NextResponse.json(
      { error: 'Failed to create sample schedules' },
      { status: 500 }
    )
  }
}
