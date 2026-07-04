import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'

const PUBLIC_SIGNUP_ROLES = ['SCHOOL_ADMIN', 'TEACHER', 'STUDENT', 'PARENT'] as const

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      firstName,
      lastName,
      email,
      password,
      role,
      schoolName,
      schoolAddress,
      schoolPhone,
    } = body

    if (!PUBLIC_SIGNUP_ROLES.includes(role)) {
      return NextResponse.json(
        { error: 'Invalid account type' },
        { status: 400 }
      )
    }

    if (role === 'SCHOOL_ADMIN' && (!schoolName || !schoolAddress)) {
      return NextResponse.json(
        { error: 'School name and address are required' },
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

    // Create user and related records based on role
    if (role === 'SCHOOL_ADMIN') {
      // Create school first
      const school = await prisma.school.create({
        data: {
          name: schoolName,
          address: schoolAddress,
          phone: schoolPhone,
        }
      })

      // Create user
      const user = await prisma.user.create({
        data: {
          firstName,
          lastName,
          email,
          password: hashedPassword,
          role: 'SCHOOL_ADMIN',
        }
      })

      // Create school admin relationship
      await prisma.schoolAdmin.create({
        data: {
          userId: user.id,
          schoolId: school.id,
        }
      })

      return NextResponse.json({ message: 'School admin account created successfully' })
    } else {
      // For teachers and students, they need to be enrolled by a school admin
      const user = await prisma.user.create({
        data: {
          firstName,
          lastName,
          email,
          password: hashedPassword,
          role,
        }
      })

      return NextResponse.json({ 
        message: 'Account created successfully. Please contact your school administrator to complete enrollment.' 
      })
    }
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
