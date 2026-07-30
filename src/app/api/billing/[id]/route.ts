import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { route } from '@/lib/api-middleware'

export const GET = route({ auth: 'SUPER_ADMIN' }, async (req, { params }) => {
  const { id } = params

  const include = {
    school: {
      select: {
        id: true,
        name: true,
        address: true,
        phone: true,
        email: true,
        schoolAdmin: {
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
    },
    package: {
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        duration: true,
        features: true
      }
    },
    user: {
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true
      }
    }
  } as const

  const subscription = await prisma.subscription.findUnique({
    where: { id },
    include
  })

  if (!subscription) {
    return NextResponse.json({ error: 'Subscription not found' }, { status: 404 })
  }

  return NextResponse.json(subscription)
})

export const PUT = route({ auth: 'SUPER_ADMIN' }, async (req, { params }) => {
  const { id } = params
  const body = await req.json()
  const {
    schoolId,
    packageId,
    startDate,
    endDate,
    amount,
    status,
    type,
    paymentMethod,
    transactionId,
    notes
  } = body

  const existingSubscription = await prisma.subscription.findUnique({
    where: { id }
  })

  if (!existingSubscription) {
    return NextResponse.json({ error: 'Subscription not found' }, { status: 404 })
  }

  const include = {
    school: {
      select: {
        id: true,
        name: true,
        address: true,
        phone: true,
        email: true,
        schoolAdmin: {
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
    },
    package: {
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        duration: true,
        features: true
      }
    },
    user: {
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true
      }
    }
  } as const

  const subscription = await prisma.subscription.update({
    where: { id },
    data: {
      ...(schoolId && { schoolId }),
      ...(packageId && { packageId }),
      ...(startDate && { startDate: new Date(startDate) }),
      ...(endDate && { endDate: new Date(endDate) }),
      ...(amount && { amount }),
      ...(status && { status }),
      ...(type && { type, isFreemium: type === 'FREEMIUM' }),
      ...(paymentMethod && { paymentMethod }),
      ...(transactionId && { transactionId }),
      ...(notes !== undefined && { notes })
    },
    include
  })

  return NextResponse.json(subscription)
})

export const DELETE = route({ auth: 'SUPER_ADMIN' }, async (req, { params }) => {
  const { id } = params

  const existingSubscription = await prisma.subscription.findUnique({
    where: { id }
  })

  if (!existingSubscription) {
    return NextResponse.json({ error: 'Subscription not found' }, { status: 404 })
  }

  await prisma.subscription.delete({
    where: { id }
  })

  return NextResponse.json({ message: 'Subscription deleted successfully' })
})
