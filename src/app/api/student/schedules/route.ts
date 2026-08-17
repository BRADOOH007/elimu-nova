import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { route } from '@/lib/api-middleware'

export const GET = route({ auth: 'STUDENT' }, async (request, { user }) => {
  // Get student's class ID
  const student = await prisma.student.findUnique({
    where: { userId: user.id },
    include: { class: true }
  })

  if (!student || !student.class) {
    return NextResponse.json({ error: 'Student or class not found' }, { status: 404 })
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

  // Build where clause - get schedules for student's class
  const where: any = {
    classId: student.class.id
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
          },
          teacher: {
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                  email: true
                }
              }
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
    teacher: {
      name: schedule.teacher ? `${schedule.teacher.user.firstName} ${schedule.teacher.user.lastName}` : 'Unassigned',
      email: schedule.teacher?.user.email || ''
    },
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
})
