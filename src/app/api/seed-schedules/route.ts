import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ScheduleType, ScheduleStatus } from '@prisma/client'
import { route } from '@/lib/api-middleware'

export const POST = route({ auth: 'TEACHER' }, async (req, { user }) => {
  const teacher = await prisma.teacher.findUnique({
    where: { userId: user.id },
    include: { classes: true }
  })

  if (!teacher) {
    return NextResponse.json({ error: 'Teacher not found' }, { status: 404 })
  }

  const firstClass = teacher.classes[0]

  const sampleSchedules = [
    {
      schoolId: teacher.schoolId ?? "",
      teacherId: teacher.id,
      classId: firstClass?.id ?? null,
      title: 'Mathematics Class',
      description: 'Algebra fundamentals and problem solving',
      subject: 'Mathematics',
      grade: 'Grade 7',
      startTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
      endTime: new Date(Date.now() + 24 * 60 * 60 * 1000 + 60 * 60 * 1000),
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
      startTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      endTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 90 * 60 * 1000),
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
      startTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      endTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000),
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
      startTime: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
      endTime: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000 + 90 * 60 * 1000),
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
      startTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      endTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 120 * 60 * 1000),
      location: 'Room 101',
      type: 'EXAM' as ScheduleType,
      status: 'SCHEDULED' as ScheduleStatus,
      recurring: false
    }
  ]

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
})
