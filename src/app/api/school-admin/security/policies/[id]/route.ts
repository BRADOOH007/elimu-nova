import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { route } from '@/lib/api-middleware'

export const GET = route({ auth: 'SCHOOL_ADMIN' }, async (req, { user, params }) => {
  const { id } = await params

    const policy = await prisma.securityPolicy.findUnique({
      where: { id },
      include: {
        createdByUser: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        },
        updatedByUser: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    })

    if (!policy) {
      return NextResponse.json({ error: 'Security policy not found' }, { status: 404 })
    }

    return NextResponse.json(policy)
})

export const PUT = route({ auth: 'SCHOOL_ADMIN' }, async (req, { user, params }) => {
  const { id } = await params
    const body = await req.json()
    const { 
      name,
      description,
      policyType,
      rules,
      isActive,
      priority
    } = body

    // Check if policy exists
    const existingPolicy = await prisma.securityPolicy.findUnique({
      where: { id }
    })

    if (!existingPolicy) {
      return NextResponse.json({ error: 'Security policy not found' }, { status: 404 })
    }

    // Update policy
    const policy = await prisma.securityPolicy.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(policyType && { policyType }),
        ...(rules && { rules: typeof rules === 'string' ? rules : JSON.stringify(rules) }),
        ...(isActive !== undefined && { isActive }),
        ...(priority !== undefined && { priority }),
        updatedBy: user.id
      },
      include: {
        createdByUser: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        },
        updatedByUser: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    })

    return NextResponse.json(policy)
})

export const DELETE = route({ auth: 'SCHOOL_ADMIN' }, async (req, { user, params }) => {
  const { id } = await params

    // Check if policy exists
    const existingPolicy = await prisma.securityPolicy.findUnique({
      where: { id }
    })

    if (!existingPolicy) {
      return NextResponse.json({ error: 'Security policy not found' }, { status: 404 })
    }

    // Delete policy
    await prisma.securityPolicy.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Security policy deleted successfully' })
})
