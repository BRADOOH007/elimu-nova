import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { route } from '@/lib/api-middleware'

export const GET = route({ auth: 'SCHOOL_ADMIN' }, async (req, { user }) => {
  const schoolAdmin = await prisma.schoolAdmin.findUnique({
    where: { userId: user.id },
    include: { school: true }
  })

    if (!schoolAdmin?.schoolId) {
      return NextResponse.json({ error: 'School not found' }, { status: 404 })
    }

    // In a real implementation, this would fetch from Stripe
    // For now, return mock data
    const paymentMethods = [
      {
        id: 'pm_1234567890',
        type: 'card',
        brand: 'visa',
        last4: '4242',
        expiryMonth: 12,
        expiryYear: 2025,
        isPrimary: true,
        createdAt: new Date().toISOString()
      }
    ]

    return NextResponse.json({ success: true, paymentMethods })
})

export const POST = route({ auth: 'SCHOOL_ADMIN' }, async (req, { user }) => {
  const body = await req.json()
  const { action, paymentMethodId } = body
  const schoolAdmin = await prisma.schoolAdmin.findUnique({
    where: { userId: user.id },
    include: { school: true }
  })

    if (!schoolAdmin?.schoolId) {
      return NextResponse.json({ error: 'School not found' }, { status: 404 })
    }

    // Handle different payment method actions
    switch (action) {
      case 'add':
        // In a real implementation, this would create a Stripe setup intent
        // and redirect to Stripe's payment method collection page
        return NextResponse.json({ 
          success: true, 
          message: 'Payment method setup initiated',
          setupUrl: 'https://checkout.stripe.com/setup/...' // Mock URL
        })

      case 'update':
        // In a real implementation, this would update the payment method in Stripe
        return NextResponse.json({ 
          success: true, 
          message: 'Payment method updated successfully' 
        })

      case 'delete':
        // In a real implementation, this would detach the payment method from Stripe
        if (!paymentMethodId) {
          return NextResponse.json({ error: 'Payment method ID required' }, { status: 400 })
        }
        return NextResponse.json({ 
          success: true, 
          message: 'Payment method removed successfully' 
        })

      case 'set_primary':
        // In a real implementation, this would update the default payment method in Stripe
        if (!paymentMethodId) {
          return NextResponse.json({ error: 'Payment method ID required' }, { status: 400 })
        }
        return NextResponse.json({ 
          success: true, 
          message: 'Primary payment method updated' 
        })

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
})