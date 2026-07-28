import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { route } from '@/lib/api-middleware'

export const GET = route({ auth: 'SUPER_ADMIN' }, async (req, { params }) => {
  const { id } = params

  const policy = await prisma.securityPolicy.findUnique({
    where: { id },
    include: {
      createdByUser: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true
        }
      },
      updatedByUser: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true
        }
      }
    }
  })

  if (!policy) {
    return NextResponse.json({ error: 'Policy not found' }, { status: 404 })
  }

  return NextResponse.json(policy)
})

export const PUT = route({ auth: 'SUPER_ADMIN' }, async (req, { params, user }) => {
  const { id } = params
  const body = await req.json()
  const { 
    name,
    description,
    policyType,
    rules,
    isActive,
    priority
  } = body

  const existingPolicy = await prisma.securityPolicy.findUnique({
    where: { id }
  })

  if (!existingPolicy) {
    return NextResponse.json({ error: 'Policy not found' }, { status: 404 })
  }

  if (rules) {
    try {
      JSON.parse(rules)
    } catch {
      return NextResponse.json({ error: 'Invalid rules JSON format' }, { status: 400 })
    }
  }

  const policy = await prisma.securityPolicy.update({
    where: { id },
    data: {
      ...(name !== undefined && { name }),
      ...(description !== undefined && { description }),
      ...(policyType !== undefined && { policyType }),
      ...(rules !== undefined && { rules }),
      ...(isActive !== undefined && { isActive }),
      ...(priority !== undefined && { priority }),
      updatedBy: user.id
    },
    include: {
      createdByUser: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true
        }
      },
      updatedByUser: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true
        }
      }
    }
  })

  return NextResponse.json(policy)
})

export const DELETE = route({ auth: 'SUPER_ADMIN' }, async (req, { params }) => {
  const { id } = params

  const existingPolicy = await prisma.securityPolicy.findUnique({
    where: { id }
  })

  if (!existingPolicy) {
    return NextResponse.json({ error: 'Policy not found' }, { status: 404 })
  }

  await prisma.securityPolicy.delete({
    where: { id }
  })

  return NextResponse.json({ message: 'Policy deleted successfully' })
})
