import { NextResponse } from 'next/server'
import { createOrder } from '@/lib/paypal'
import { resolveCheckoutPackage } from '@/lib/subscription-service'
import { prisma } from '@/lib/prisma'
import { route } from '@/lib/api-middleware'

const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'

export const POST = route({}, async (req, { user }) => {
  const body = await req.json()
  const { packageId } = body

  if (!packageId) {
    return NextResponse.json({ error: 'Missing required fields: packageId' }, { status: 400 })
  }

  const packageInfo = await resolveCheckoutPackage(packageId)
  if (!packageInfo) {
    return NextResponse.json({ error: 'Package not found' }, { status: 404 })
  }

  let userId: string | undefined
  let schoolId: string | undefined

  if (user.role === 'TEACHER') {
    const teacher = await prisma.teacher.findUnique({ where: { userId: user.id }, include: { school: true } })
    if (teacher?.schoolId) {
      schoolId = teacher.schoolId
    } else {
      userId = user.id
    }
  } else if (user.role === 'SCHOOL_ADMIN') {
    const schoolAdmin = await prisma.schoolAdmin.findUnique({ where: { userId: user.id }, include: { school: true } })
    schoolId = schoolAdmin?.schoolId
  } else {
    userId = user.id
  }

  // KES is not a PayPal-supported currency — always charge in USD.
  const paypalCurrency = 'USD'
  const paypalAmount = Math.round(packageInfo.price * 100) / 100

  const { orderId, approvalUrl } = await createOrder({
    amount: paypalAmount,
    currency: paypalCurrency,
    description: `${packageInfo.name} — ElimuNova subscription`,
    customId: packageInfo.id,
    returnUrl: `${baseUrl}/api/subscription/paypal/complete`,
    cancelUrl: `${baseUrl}/subscription/cancel`,
  })

  // Create a PENDING subscription row that the capture/webhook later flips to ACTIVE.
  const startDate = new Date()
  const endDate = new Date(startDate.getTime() + packageInfo.duration * 30 * 24 * 60 * 60 * 1000)
  const localSub = await prisma.subscription.create({
    data: {
      userId,
      schoolId,
      packageId: packageInfo.id,
      status: 'INACTIVE',
      startDate,
      endDate,
      amount: paypalAmount,
      isTrial: false,
      type: 'SUBSCRIPTION',
      paymentMethod: 'PAYPAL',
      transactionId: orderId,
      notes: `paypal_order:${orderId}`,
    },
  })

  return NextResponse.json({
    approvalUrl,
    orderId,
    subscriptionId: localSub.id,
  })
})
