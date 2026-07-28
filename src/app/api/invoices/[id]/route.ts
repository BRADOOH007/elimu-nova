import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { route } from '@/lib/api-middleware'

export const GET = route({ auth: 'SUPER_ADMIN' }, async (req, { params }) => {

    const { id } = params

    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        subscription: {
          include: {
            school: {
              select: {
                id: true,
                name: true,
                email: true,
                address: true,
                phone: true
              }
            },
            package: {
              select: {
                id: true,
                name: true,
                price: true,
                description: true
              }
            }
          }
        },
        paymentMethod: {
          select: {
            id: true,
            name: true,
            type: true
          }
        }
      }
    })

    if (!invoice) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(invoice)
})

export const PUT = route({ auth: 'SUPER_ADMIN' }, async (req, { params }) => {

    const { id } = params
    const body = await req.json()
    const { 
      amount, 
      taxAmount, 
      totalAmount, 
      status, 
      dueDate, 
      paidDate, 
      paymentMethodId, 
      notes 
    } = body

    // Check if invoice exists
    const existingInvoice = await prisma.invoice.findUnique({
      where: { id }
    })

    if (!existingInvoice) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      )
    }

    // Update invoice
    const updatedInvoice = await prisma.invoice.update({
      where: { id },
      data: {
        ...(amount !== undefined && { amount }),
        ...(taxAmount !== undefined && { taxAmount }),
        ...(totalAmount !== undefined && { totalAmount }),
        ...(status && { status }),
        ...(dueDate && { dueDate: new Date(dueDate) }),
        ...(paidDate && { paidDate: new Date(paidDate) }),
        ...(paymentMethodId && { paymentMethodId }),
        ...(notes !== undefined && { notes })
      },
      include: {
        subscription: {
          include: {
            school: {
              select: {
                id: true,
                name: true,
                email: true
              }
            },
            package: {
              select: {
                id: true,
                name: true,
                price: true
              }
            }
          }
        },
        paymentMethod: {
          select: {
            id: true,
            name: true,
            type: true
          }
        }
      }
    })

    return NextResponse.json(updatedInvoice)
})

export const DELETE = route({ auth: 'SUPER_ADMIN' }, async (req, { params }) => {

    const { id } = params

    // Check if invoice exists
    const existingInvoice = await prisma.invoice.findUnique({
      where: { id }
    })

    if (!existingInvoice) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      )
    }

    // Check if invoice is already paid
    if (existingInvoice.status === 'PAID') {
      return NextResponse.json(
        { error: 'Cannot delete paid invoice' },
        { status: 400 }
      )
    }

    // Delete invoice
    await prisma.invoice.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Invoice deleted successfully' })
})
