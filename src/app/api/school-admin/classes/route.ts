import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { logClassCreated } from '@/lib/activity-logger'
import { route } from '@/lib/api-middleware'

export const GET = route({ auth: 'SCHOOL_ADMIN' }, async (req, { user }) => {
  const schoolAdmin = await prisma.schoolAdmin.findUnique({
    where: { userId: user.id }
  })

  if (!schoolAdmin) {
    return NextResponse.json({ error: 'School admin not found' }, { status: 404 })
  }

  const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    const skip = (page - 1) * limit

    // Build where clause
    const where = {
      schoolId: schoolAdmin.schoolId,
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' as const } },
          { subject: { contains: search, mode: 'insensitive' as const } },
          { grade: { contains: search, mode: 'insensitive' as const } }
        ]
      })
    }

    // Get classes with pagination
    const [classes, total] = await Promise.all([
      prisma.class.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          [sortBy]: sortOrder
        },
        include: {
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
          },
          students: {
            select: { id: true }
          }
        }
      }),
      prisma.class.count({ where })
    ])

    const formattedClasses = classes.map(cls => ({
      id: cls.id,
      name: cls.name,
      description: cls.description,
      subject: cls.subject,
      grade: cls.grade,
      isActive: cls.isActive,
      studentCount: cls.students.length,
      teacherName: `${cls.teacher.user.firstName} ${cls.teacher.user.lastName}`,
      teacherEmail: cls.teacher.user.email,
      teacherId: cls.teacherId,
      createdAt: cls.createdAt,
      updatedAt: cls.updatedAt
    }))

    return NextResponse.json({
      classes: formattedClasses,
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

    const body = await req.json()
    const { name, description, subject, grade, teacherId } = body

    // Validate required fields
    if (!name || !subject || !grade || !teacherId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Verify teacher exists and belongs to the same school
    const teacher = await prisma.teacher.findFirst({
      where: {
        id: teacherId,
        schoolId: schoolAdmin.schoolId
      }
    })

    if (!teacher) {
      return NextResponse.json(
        { error: 'Teacher not found or does not belong to this school' },
        { status: 400 }
      )
    }

    // Create class
    const newClass = await prisma.class.create({
      data: {
        name,
        description,
        subject,
        grade,
        schoolId: schoolAdmin.schoolId,
        teacherId
      },
      include: {
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
        },
        students: {
          select: { id: true }
        }
      }
    })

    // Log activity
    await logClassCreated(
      schoolAdmin.schoolId,
      user.id,
      newClass.name,
      newClass.subject
    )

    return NextResponse.json({
      message: 'Class created successfully',
      class: {
        id: newClass.id,
        name: newClass.name,
        description: newClass.description,
        subject: newClass.subject,
        grade: newClass.grade,
        isActive: newClass.isActive,
        studentCount: newClass.students.length,
        teacherName: `${newClass.teacher.user.firstName} ${newClass.teacher.user.lastName}`,
        teacherEmail: newClass.teacher.user.email,
        teacherId: newClass.teacherId,
        createdAt: newClass.createdAt
      }
    }, { status: 201 })
})
