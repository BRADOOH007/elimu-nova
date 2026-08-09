import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { route } from '@/lib/api-middleware'
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

const PUBLIC_SIGNUP_ROLES = ['SCHOOL_ADMIN', 'TEACHER', 'STUDENT', 'PARENT'] as const

export const POST = route({ auth: 'none' }, async (req) => {
  const body = await req.json()
  const {
    firstName,
    lastName,
    email,
    password,
    role,
    schoolName,
    schoolAddress,
    schoolPhone,
    country,
    curriculum,
    grade,
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

  const existingUser = await prisma.user.findUnique({
    where: { email }
  })

  if (existingUser) {
    return NextResponse.json(
      { error: 'User with this email already exists' },
      { status: 400 }
    )
  }

  const hashedPassword = await bcrypt.hash(password, 12)

  if (role === 'SCHOOL_ADMIN') {
    const school = await prisma.school.create({
      data: {
        name: schoolName,
        address: schoolAddress,
        phone: schoolPhone,
      }
    })

    const username = await uniqueUsername(firstName, lastName)
    const user = await prisma.user.create({
      data: {
        username,
        firstName,
        lastName,
        email,
        password: hashedPassword,
        role: 'SCHOOL_ADMIN',
      }
    })

    await prisma.schoolAdmin.create({
      data: {
        userId: user.id,
        schoolId: school.id,
      }
    })

    // No free trial — schools must subscribe to a paid plan
    // await autoCreateTrial(undefined, school.id)

    return NextResponse.json({ message: 'School admin account created successfully' })
  } else {
    const username = await uniqueUsername(firstName, lastName)
    const user = await prisma.user.create({
      data: {
        username,
        firstName,
        lastName,
        email,
        password: hashedPassword,
        role,
      }
    })

    // Store learning preferences for independent users
    if (country || curriculum || grade) {
      await (prisma as any).userPreference.upsert({
        where: { userId: user.id },
        update: { country: country || '', curriculum: curriculum || '', language: 'en' },
        create: { userId: user.id, country: country || '', curriculum: curriculum || '', language: 'en' },
      })
    }

    // Create role-specific profile if needed (e.g., Teacher for TEACHER, Parent for PARENT)
    if (role === 'TEACHER') {
      await (prisma as any).teacher.upsert({ where: { userId: user.id }, update: {}, create: { userId: user.id } })
    } else if (role === 'STUDENT') {
      await (prisma as any).student.upsert({ where: { userId: user.id }, update: { subjects: [] }, create: { userId: user.id, subjects: [] } })
    } else if (role === 'PARENT') {
      await (prisma as any).parent.upsert({ where: { userId: user.id }, update: {}, create: { userId: user.id } })
    }

    // No free trial — independent users must subscribe to a paid plan
    // await autoCreateTrial(user.id, undefined)

    return NextResponse.json({
      message: 'Account created successfully.'
    })
  }
})
