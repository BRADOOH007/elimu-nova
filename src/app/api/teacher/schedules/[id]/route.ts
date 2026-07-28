import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { route } from '@/lib/api-middleware'

export const GET = route({ auth: 'TEACHER' }, async (req, { user, params }) => {
  try {
    const { id } = params

    // Get teacher's school ID
    const teacher = await prisma.teacher.findUnique({
      where: { userId: user.id }
    })

    if (!teacher) {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 })
    }

    let schedule
    try {
      schedule = await prisma.schedule.findFirst({
        where: {
          id,
          teacherId: teacher.id
        },
        include: {
          class: {
            select: {
              id: true,
              name: true,
              subject: true,
              grade: true
            }
          }
        }
      })
    } catch (error) {
      console.error('Error accessing Schedule model:', error)
      return NextResponse.json(
        { error: 'Schedule model not available yet. Please restart the development server.' },
        { status: 503 }
      )
    }

    if (!schedule) {
      return NextResponse.json({ error: 'Schedule not found' }, { status: 404 })
    }

    return NextResponse.json({
      schedule: {
        id: schedule.id,
        title: schedule.title,
        description: schedule.description,
        subject: schedule.subject,
        grade: schedule.grade,
        startTime: schedule.startTime.toISOString(),
        endTime: schedule.endTime.toISOString(),
        location: schedule.location,
        type: schedule.type,
        status: schedule.status,
        recurring: schedule.recurring,
        recurringPattern: schedule.recurringPattern,
        metadata: schedule.metadata,
        class: schedule.class,
        createdAt: schedule.createdAt.toISOString(),
        updatedAt: schedule.updatedAt.toISOString()
      }
    })

  } catch (error) {
    console.error('Error fetching schedule:', error)
    return NextResponse.json(
      { error: 'Failed to fetch schedule' },
      { status: 500 }
    )
  }
})

export const PUT = route({ auth: 'TEACHER' }, async (req, { user, params }) => {
  try {
    const { id } = params

    // Get teacher's school ID
    const teacher = await prisma.teacher.findUnique({
      where: { userId: user.id }
    })

    if (!teacher) {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 })
    }

    const body = await req.json()
    const { 
      title, 
      description, 
      subject, 
      grade, 
      startTime, 
      endTime, 
      location, 
      type, 
      classId, 
      status,
      recurring, 
      recurringPattern, 
      metadata 
    } = body

    // Check if schedule exists and belongs to teacher
    let existingSchedule
    try {
      existingSchedule = await prisma.schedule.findFirst({
        where: {
          id,
          teacherId: teacher.id
        }
      })
    } catch (error) {
      console.error('Error accessing Schedule model:', error)
      return NextResponse.json(
        { error: 'Schedule model not available yet. Please restart the development server.' },
        { status: 503 }
      )
    }

    if (!existingSchedule) {
      return NextResponse.json({ error: 'Schedule not found' }, { status: 404 })
    }

    // Validate time if provided
    if (startTime && endTime) {
      const start = new Date(startTime)
      const end = new Date(endTime)
      
      if (start >= end) {
        return NextResponse.json(
          { error: 'End time must be after start time' },
          { status: 400 }
        )
      }
    }

    // Update schedule
    let updatedSchedule
    try {
      updatedSchedule = await prisma.schedule.update({
        where: { id },
        data: {
          ...(title && { title }),
          ...(description !== undefined && { description }),
          ...(subject !== undefined && { subject }),
          ...(grade !== undefined && { grade }),
          ...(startTime && { startTime: new Date(startTime) }),
          ...(endTime && { endTime: new Date(endTime) }),
          ...(location !== undefined && { location }),
          ...(type && { type }),
          ...(classId !== undefined && { classId: classId || null }),
          ...(status && { status }),
          ...(recurring !== undefined && { recurring }),
          ...(recurringPattern !== undefined && { recurringPattern }),
          ...(metadata !== undefined && { metadata })
        },
        include: {
          class: {
            select: {
              id: true,
              name: true,
              subject: true,
              grade: true
            }
          }
        }
      })
    } catch (error) {
      console.error('Error updating schedule:', error)
      return NextResponse.json(
        { error: 'Schedule model not available yet. Please restart the development server.' },
        { status: 503 }
      )
    }

    return NextResponse.json({
      message: 'Schedule updated successfully',
      schedule: {
        id: updatedSchedule.id,
        title: updatedSchedule.title,
        description: updatedSchedule.description,
        subject: updatedSchedule.subject,
        grade: updatedSchedule.grade,
        startTime: updatedSchedule.startTime.toISOString(),
        endTime: updatedSchedule.endTime.toISOString(),
        location: updatedSchedule.location,
        type: updatedSchedule.type,
        status: updatedSchedule.status,
        recurring: updatedSchedule.recurring,
        recurringPattern: updatedSchedule.recurringPattern,
        metadata: updatedSchedule.metadata,
        class: updatedSchedule.class,
        createdAt: updatedSchedule.createdAt.toISOString(),
        updatedAt: updatedSchedule.updatedAt.toISOString()
      }
    })

  } catch (error) {
    console.error('Error updating schedule:', error)
    return NextResponse.json(
      { error: 'Failed to update schedule' },
      { status: 500 }
    )
  }
})

export const DELETE = route({ auth: 'TEACHER' }, async (req, { user, params }) => {
  try {
    const { id } = params

    // Get teacher's school ID
    const teacher = await prisma.teacher.findUnique({
      where: { userId: user.id }
    })

    if (!teacher) {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 })
    }

    // Check if schedule exists and belongs to teacher
    let existingSchedule
    try {
      existingSchedule = await prisma.schedule.findFirst({
        where: {
          id,
          teacherId: teacher.id
        }
      })
    } catch (error) {
      console.error('Error accessing Schedule model:', error)
      return NextResponse.json(
        { error: 'Schedule model not available yet. Please restart the development server.' },
        { status: 503 }
      )
    }

    if (!existingSchedule) {
      return NextResponse.json({ error: 'Schedule not found' }, { status: 404 })
    }

    // Delete schedule
    try {
      await prisma.schedule.delete({
        where: { id }
      })
    } catch (error) {
      console.error('Error deleting schedule:', error)
      return NextResponse.json(
        { error: 'Schedule model not available yet. Please restart the development server.' },
        { status: 503 }
      )
    }

    return NextResponse.json({ message: 'Schedule deleted successfully' })

  } catch (error) {
    console.error('Error deleting schedule:', error)
    return NextResponse.json(
      { error: 'Failed to delete schedule' },
      { status: 500 }
    )
  }
})
