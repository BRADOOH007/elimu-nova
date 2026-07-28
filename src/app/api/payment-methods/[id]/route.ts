import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { route } from '@/lib/api-middleware'

export const GET = route({ auth: 'SUPER_ADMIN' }, async (req, { params }) => {

    const { id } = params

    const paymentMethod = await prisma.paymentMethod.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            subscriptions: true,
            invoices: true
          }
        }
      }
    })

    if (!paymentMethod) {
      return NextResponse.json(
        { error: 'Payment method not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(paymentMethod)
})

export const PUT = route({ auth: 'SUPER_ADMIN' }, async (req, { params }) => {

    const { id } = params
    const body = await req.json()
    const { name, type, description, isActive } = body

    // Check if payment method exists
    const existingPaymentMethod = await prisma.paymentMethod.findUnique({
      where: { id }
    })

    if (!existingPaymentMethod) {
      return NextResponse.json(
        { error: 'Payment method not found' },
        { status: 404 }
      )
    }

    // Update payment method
    const updatedPaymentMethod = await prisma.paymentMethod.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(type && { type }),
        ...(description !== undefined && { description }),
        ...(isActive !== undefined && { isActive })
      }
    })

    return NextResponse.json(updatedPaymentMethod)
})

export const DELETE = route({ auth: 'SUPER_ADMIN' }, async (req, { params }) => {

    const { id } = params

    // Check if payment method exists
    const existingPaymentMethod = await prisma.paymentMethod.findUnique({
      where: { id },
      include: {
        subscriptions: {
          where: { status: 'ACTIVE' }
        },
        invoices: {
          where: { status: 'PENDING' }
        }
      }
    })

    if (!existingPaymentMethod) {
      return NextResponse.json(
        { error: 'Payment method not found' },
        { status: 404 }
      )
    }

    // Check if payment method is in use
    if (existingPaymentMethod.subscriptions.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete payment method that is in use by active subscriptions' },
        { status: 400 }
      )
    }

    if (existingPaymentMethod.invoices.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete payment method that has pending invoices' },
        { status: 400 }
      )
    }

    // Delete payment method
    await prisma.paymentMethod.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Payment method deleted successfully' })
})
