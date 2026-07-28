import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { route } from '@/lib/api-middleware'

export const POST = route({ auth: 'SUPER_ADMIN' }, async (req, { user }) => {
  const body = await req.json()
  const { subscriptionId, packageId } = body

  if (!subscriptionId || !packageId) {
    return NextResponse.json({ error: 'subscriptionId and packageId are required' }, { status: 400 })
  }

  const oldSubscription = await prisma.subscription.findUnique({
    where: { id: subscriptionId },
    include: { package: true }
  })

  if (!oldSubscription) {
    return NextResponse.json({ error: 'Subscription not found' }, { status: 404 })
  }

  const newPackage = await prisma.package.findUnique({
    where: { id: packageId }
  })

  if (!newPackage) {
    return NextResponse.json({ error: 'Package not found' }, { status: 404 })
  }

  const startDate = new Date()
  const durationMs = newPackage.duration * 30 * 24 * 60 * 60 * 1000
  const endDate = new Date(startDate.getTime() + durationMs)

  const newSubscription = await prisma.subscription.create({
    data: {
      schoolId: oldSubscription.schoolId,
      userId: oldSubscription.userId,
      packageId: newPackage.id,
      status: 'ACTIVE',
      startDate,
      endDate,
      amount: newPackage.price,
      isTrial: false,
      type: 'RENEWAL',
      paymentMethod: 'MANUAL',
    },
    include: {
      school: {
        select: {
          id: true, name: true, address: true, phone: true, email: true,
          schoolAdmin: {
            include: {
              user: { select: { firstName: true, lastName: true, email: true } }
            }
          }
        }
      },
      package: {
        select: { id: true, name: true, description: true, price: true, duration: true, features: true }
      }
    }
  })

  return NextResponse.json({
    message: 'Subscription renewed successfully',
    subscription: newSubscription
  })
})
