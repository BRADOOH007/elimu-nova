import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { route } from '@/lib/api-middleware'
import bcrypt from 'bcryptjs'
import { generateUsername } from '@/lib/bulk-import'

async function uniqueUsername(first: string, last: string): Promise<string> {
  let u = generateUsername(first, last)
  let attempts = 0
  while (await prisma.user.findUnique({ where: { username: u } })) {
    attempts++
    u = generateUsername(first, last, `${Date.now().toString(36)}${attempts}`)
  }
  return u
}

export const POST = route({ auth: 'SUPER_ADMIN' }, async (req, { user }) => {
  const body = await req.json()
  const {
    firstName,
    lastName,
    email,
    password,
    role,
    schoolId,
    phone,
    address
  } = body

  if (!firstName || !lastName || !email || !password || !role) {
    return NextResponse.json({
      error: 'Missing required fields: firstName, lastName, email, password, role'
    }, { status: 400 })
  }

  const validRoles = ['SCHOOL_ADMIN', 'TEACHER', 'STUDENT']
  if (!validRoles.includes(role)) {
    return NextResponse.json({
      error: 'Invalid role. Must be one of: SCHOOL_ADMIN, TEACHER, STUDENT'
    }, { status: 400 })
  }

  const existingUser = await prisma.user.findUnique({
    where: { email: email.toLowerCase() }
  })

  if (existingUser) {
    return NextResponse.json({
      error: 'User with this email already exists'
    }, { status: 400 })
  }

  const hashedPassword = await bcrypt.hash(password, 12)
  const username = await uniqueUsername(firstName, lastName)

  const newUser = await prisma.user.create({
    data: {
      username,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      role: role as any,
      phone: phone?.trim() || null,
      address: address?.trim() || null
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      role: true,
      phone: true,
      address: true,
      createdAt: true
    }
  })

  if (role === 'SCHOOL_ADMIN' && schoolId) {
    await prisma.schoolAdmin.create({
      data: {
        userId: newUser.id,
        schoolId: schoolId
      }
    })
  }

  if (role === 'TEACHER' && schoolId) {
    await prisma.teacher.create({
      data: {
        userId: newUser.id,
        schoolId: schoolId
      }
    })
  }

  if (role === 'STUDENT' && schoolId) {
    console.log('Student creation skipped - requires teacherId field')
  }

  return NextResponse.json(newUser, { status: 201 })
})

export const GET = route({ auth: 'SUPER_ADMIN' }, async (req, { user }) => {
  const { searchParams } = new URL(req.url)
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '10')
  const role = searchParams.get('role') || ''
  const search = searchParams.get('search') || ''

  const where: any = {}

  if (role) {
    where.role = role
  }

  if (search) {
    where.OR = [
      { firstName: { contains: search, mode: 'insensitive' } },
      { lastName: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } }
    ]
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: {
        createdAt: 'desc'
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        phone: true,
        address: true,
        createdAt: true,
        schoolAdmin: {
          include: {
            school: {
              select: {
                name: true
              }
            }
          }
        },
        teacher: {
          include: {
            school: {
              select: {
                name: true
              }
            }
          }
        },
        student: {
          include: {
            school: {
              select: {
                name: true
              }
            }
          }
        }
      }
    }),
    prisma.user.count({ where })
  ])

  return NextResponse.json({
    users,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  })
})
