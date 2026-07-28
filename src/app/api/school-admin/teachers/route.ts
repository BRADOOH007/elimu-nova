import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { route } from '@/lib/api-middleware'
import { generateUsername } from '@/lib/bulk-import'

async function generateUniqueUsername(firstName: string, lastName: string): Promise<string> {
  let username = generateUsername(firstName, lastName)
  let suffixAttempt = 0
  while (await prisma.user.findUnique({ where: { username } })) {
    suffixAttempt++
    username = generateUsername(firstName, lastName, `${Date.now().toString(36)}${suffixAttempt}`)
  }
  return username
}

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
          user: {
            firstName: {
              contains: search,
              mode: 'insensitive'
            }
          }
        },
        {
          user: {
            lastName: {
              contains: search,
              mode: 'insensitive'
            }
          }
        },
        {
          user: {
            email: {
              contains: search,
              mode: 'insensitive'
            }
          }
        }
      ]
    }

    if (status !== 'all') {
      where.user = {
        ...where.user,
        isActive: status === 'active'
      }
    }

    // Get teachers with pagination
    const [teachers, total] = await Promise.all([
      prisma.teacher.findMany({
        where,
        skip,
        take: limit,
        orderBy: { user: { createdAt: 'desc' } },
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
              createdAt: true,
              isActive: true,
              phone: true,
              address: true
            }
          },
          students: {
            select: { id: true }
          },
          classes: {
            select: {
              name: true,
              subject: true
            }
          }
        }
      }),
      prisma.teacher.count({ where })
    ])

    // Format teachers data
    const formattedTeachers = teachers.map(teacher => ({
      id: teacher.id,
      name: `${teacher.user.firstName} ${teacher.user.lastName}`,
      email: teacher.user.email,
      students: teacher.students.length,
      status: teacher.user.isActive ? 'Active' : 'Inactive',
      joinDate: teacher.user.createdAt.toISOString().split('T')[0],
      phone: teacher.user.phone,
      address: teacher.user.address,
      subjects: teacher.classes.map(cls => cls.subject).filter(Boolean)
    }))

    return NextResponse.json({
      teachers: formattedTeachers,
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
    where: { userId: user.id },
    include: { school: true }
  })

    if (!schoolAdmin) {
      return NextResponse.json({ error: 'School admin not found' }, { status: 404 })
    }

    const schoolId = schoolAdmin.schoolId
    const body = await req.json()
    const { firstName, lastName, email, password } = body

    if (!firstName || !lastName || !email || !password) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Generate username
    const username = await generateUniqueUsername(firstName, lastName)

    // Create user
    const newUser = await prisma.user.create({
      data: {
        username,
        firstName,
        lastName,
        email,
        password: hashedPassword,
        role: 'TEACHER',
        isActive: true
      }
    })

    // Create teacher record
    const teacher = await prisma.teacher.create({
      data: {
        userId: newUser.id,
        schoolId: schoolId
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            createdAt: true,
            isActive: true
          }
        }
      }
    })

    return NextResponse.json({
      message: 'Teacher enrolled successfully',
      teacher: {
        id: teacher.id,
        name: `${teacher.user.firstName} ${teacher.user.lastName}`,
        email: teacher.user.email,
        status: teacher.user.isActive ? 'Active' : 'Inactive',
        joinDate: teacher.user.createdAt.toISOString().split('T')[0]
      }
    })
})