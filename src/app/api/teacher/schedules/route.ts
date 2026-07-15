import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
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
      where: { userId: session.user.id }
    })

    if (!teacher) {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const type = searchParams.get('type') || ''
    const status = searchParams.get('status') || ''
    const date = searchParams.get('date') || ''
    const sortBy = searchParams.get('sortBy') || 'startTime'
    const sortOrder = searchParams.get('sortOrder') || 'asc'

    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {
      teacherId: teacher.id
    }

    if (type && type !== 'all') {
      where.type = type
    }

    if (status && status !== 'all') {
      where.status = status
    }

    if (date) {
      const startOfDay = new Date(date)
      const endOfDay = new Date(date)
      endOfDay.setDate(endOfDay.getDate() + 1)
      
      where.startTime = {
        gte: startOfDay,
        lt: endOfDay
      }
    }

    // Get schedules with pagination
    let schedules = []
    let total = 0
    
    try {
      const [schedulesResult, totalResult] = await Promise.all([
        prisma.schedule.findMany({
          where,
          skip,
          take: limit,
          orderBy: {
            [sortBy]: sortOrder
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
        }),
        prisma.schedule.count({ where })
      ])
      
      schedules = schedulesResult
      total = totalResult
    } catch (error) {
      console.error('Error accessing Schedule model:', error)
      // Return empty result if Schedule model is not available
      return NextResponse.json({
        schedules: [],
        pagination: {
          page,
          limit,
          total: 0,
          pages: 0
        },
        message: 'Schedule model not available yet. Please restart the development server.'
      })
    }

    const formattedSchedules = schedules.map(schedule => ({
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
    }))

    return NextResponse.json({
      schedules: formattedSchedules,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error('Error fetching schedules:', error)
    return NextResponse.json(
      { error: 'Failed to fetch schedules' },
      { status: 500 }
    )
  }
}

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
      where: { userId: session.user.id }
    })

    if (!teacher) {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 })
    }

    const body = await request.json()
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
      recurring, 
      recurringPattern, 
      metadata 
    } = body

    // Validate required fields
    if (!title || !startTime || !endTime || !type) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate time
    const start = new Date(startTime)
    const end = new Date(endTime)
    
    if (start >= end) {
      return NextResponse.json(
        { error: 'End time must be after start time' },
        { status: 400 }
      )
    }

    // Create schedule
    let schedule
    try {
      schedule = await prisma.schedule.create({
        data: {
          schoolId: teacher.schoolId,
          teacherId: teacher.id,
          classId: classId || null,
          title,
          description: description || null,
          subject: subject || null,
          grade: grade || null,
          startTime: start,
          endTime: end,
          location: location || null,
          type,
          recurring: recurring || false,
          recurringPattern: recurringPattern || null,
          metadata: metadata || null
        } as any,
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
      console.error('Error creating schedule:', error)
      return NextResponse.json(
        { error: 'Schedule model not available yet. Please restart the development server.' },
        { status: 503 }
      )
    }

    const sch = schedule as any
    return NextResponse.json({
      message: 'Schedule created successfully',
      schedule: {
        id: sch.id,
        title: sch.title,
        description: sch.description,
        subject: sch.subject,
        grade: sch.grade,
        startTime: sch.startTime.toISOString(),
        endTime: sch.endTime.toISOString(),
        location: sch.location,
        type: sch.type,
        status: sch.status,
        recurring: sch.recurring,
        recurringPattern: sch.recurringPattern,
        metadata: sch.metadata,
        class: sch.class,
        createdAt: sch.createdAt.toISOString(),
        updatedAt: sch.updatedAt.toISOString()
      }
    }, { status: 201 })

  } catch (error) {
    console.error('Error creating schedule:', error)
    return NextResponse.json(
      { error: 'Failed to create schedule' },
      { status: 500 }
    )
  }
}
