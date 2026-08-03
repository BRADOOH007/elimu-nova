import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { route } from '@/lib/api-middleware'

export const GET = route({ auth: 'SUPER_ADMIN' }, async (req) => {
  const { searchParams } = new URL(req.url)
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '10')
  const search = searchParams.get('search') || ''
  const role = searchParams.get('role') || ''
  const status = searchParams.get('status') || ''
  const sortBy = searchParams.get('sortBy') || 'createdAt'
  const sortOrder = searchParams.get('sortOrder') || 'desc'

  const where: any = {}
  
  if (search) {
    where.OR = [
      { username: { contains: search, mode: 'insensitive' } },
      { firstName: { contains: search, mode: 'insensitive' } },
      { lastName: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
      { phone: { contains: search, mode: 'insensitive' } }
    ]
  }
  
  if (role && role !== 'all') {
    where.role = role
  }
  
  if (status === 'active') {
    where.isActive = true
  } else if (status === 'inactive') {
    where.isActive = false
  }

  const orderBy: any = {}
  if (sortBy === 'name') {
    orderBy.firstName = sortOrder
  } else if (sortBy === 'email') {
    orderBy.email = sortOrder
  } else if (sortBy === 'lastLogin') {
    orderBy.lastLogin = sortOrder
  } else {
    orderBy.createdAt = sortOrder
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy,
      select: {
        id: true,
        username: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
        address: true,
        schoolAdmin: {
          include: {
            school: { select: { id: true, name: true } }
          }
        },
        teacher: {
          include: {
            school: { select: { id: true, name: true } }
          }
        },
        student: {
          include: {
            school: { select: { id: true, name: true } }
          }
        }
      }
    }),
    prisma.user.count({ where })
  ])

  const pages = Math.ceil(total / limit)

  return NextResponse.json({
    users,
    pagination: {
      page,
      limit,
      total,
      pages
    }
  })
})

export const POST = route({ auth: 'SUPER_ADMIN' }, async (req) => {
  const body = await req.json()
  const { 
    firstName, 
    lastName, 
    email, 
    phone, 
    role, 
    schoolId,
    password,
    isActive = true 
  } = body

  if (!firstName || !lastName || !email || !role) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const existingUser = await prisma.user.findUnique({
    where: { email }
  })

  if (existingUser) {
    return NextResponse.json({ error: 'Email already exists' }, { status: 400 })
  }

  const bcrypt = await import('bcryptjs')
  const { generatePassword: genPwd, generateUsername } = await import('@/lib/bulk-import')
  const { encryptPassword } = await import('@/lib/password-encryption')
  const finalPassword = password || genPwd()
  const hashedPassword = await bcrypt.hash(finalPassword, 12)
  const encryptedPwd = encryptPassword(finalPassword)

  // Generate unique username
  let username = generateUsername(firstName, lastName)
  let suffixAttempt = 0
  while (await prisma.user.findUnique({ where: { username } })) {
    suffixAttempt++
    username = generateUsername(firstName, lastName, `${Date.now().toString(36)}${suffixAttempt}`)
  }

  const validRoles = ['STUDENT', 'TEACHER', 'PARENT', 'SCHOOL_ADMIN', 'SUPER_ADMIN']
  if (!validRoles.includes(role)) {
    return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
  }

  const schoolRoles = ['SCHOOL_ADMIN', 'STUDENT']
  if (schoolRoles.includes(role) && !schoolId) {
    return NextResponse.json({ error: 'School selection is required for this role' }, { status: 400 })
  }

  const user = await prisma.user.create({
    data: {
      username,
      firstName,
      lastName,
      email,
      phone,
      role,
      isActive,
      password: hashedPassword,
      address: encryptedPwd,
      ...(role === 'SCHOOL_ADMIN' && schoolId && {
        schoolAdmin: {
          create: {
            schoolId
          }
        }
      }),
      ...(role === 'TEACHER' && schoolId && {
        teacher: {
          create: {
            schoolId
          }
        }
      }),
      ...(role === 'STUDENT' && schoolId && {
        student: {
          create: {
            schoolId
          }
        }
      })
    },
    include: {
      schoolAdmin: {
        include: {
          school: {
            select: {
              id: true,
              name: true
            }
          }
        }
      },
      teacher: {
        include: {
          school: {
            select: {
              id: true,
              name: true
            }
          }
        }
      },
      student: {
        include: {
          school: {
            select: {
              id: true,
              name: true
            }
          }
        }
      }
    }
  })

  const responseBody = password
    ? { ...user, password: undefined, address: undefined }
    : { ...user, password: undefined, address: undefined, generatedPassword: finalPassword }

  return NextResponse.json(responseBody, { status: 201 })
})
