import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { route } from '@/lib/api-middleware'

export const GET = route({ auth: ['TEACHER', 'STUDENT', 'SCHOOL_ADMIN', 'SUPER_ADMIN', 'PARENT'], skipSubscriptionCheck: true }, async (req, { user }) => {
  const { searchParams } = new URL(req.url)
  const userId = searchParams.get('userId')

  if (!userId) {
    return NextResponse.json(
      { error: 'User ID is required' },
      { status: 400 }
    )
  }

  const foundUser = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      role: true,
      avatar: true,
      phone: true,
      address: true,
      createdAt: true,
      isActive: true,
    }
  })

  if (!foundUser) {
    return NextResponse.json(
      { error: 'User not found' },
      { status: 404 }
    )
  }

  return NextResponse.json(foundUser)
})

export const PATCH = route({ auth: ['TEACHER', 'STUDENT', 'SCHOOL_ADMIN', 'SUPER_ADMIN', 'PARENT'], skipSubscriptionCheck: true }, async (req, { user }) => {
  const body = await req.json()
  const { userId, firstName, lastName, avatar, phone, address } = body

  if (!userId) {
    return NextResponse.json(
      { error: 'User ID is required' },
      { status: 400 }
    )
  }

  if (user.id !== userId && user.role !== 'SUPER_ADMIN' && user.role !== 'SCHOOL_ADMIN') {
    return NextResponse.json(
      { error: 'Forbidden: You can only update your own profile' },
      { status: 403 }
    )
  }

  if (!firstName || !lastName) {
    return NextResponse.json(
      { error: 'First name and last name are required' },
      { status: 400 }
    )
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      ...(avatar !== undefined && { avatar: avatar || null }),
      ...(phone !== undefined && { phone: phone?.trim() || null }),
      ...(address !== undefined && { address: address?.trim() || null }),
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      role: true,
      avatar: true,
      phone: true,
      address: true,
      createdAt: true,
      isActive: true,
    }
  })

  return NextResponse.json(updatedUser)
})
