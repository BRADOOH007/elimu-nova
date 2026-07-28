import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { route } from '@/lib/api-middleware'

export const GET = route({ auth: ['SUPER_ADMIN', 'SCHOOL_ADMIN'] }, async (req, { user }) => {

    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || ''
    const schoolId = searchParams.get('schoolId') || ''

    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {}
    
    // For school admins, filter by their school
    if (user.role === 'SCHOOL_ADMIN') {
      // Get the school admin's school ID
      const schoolAdmin = await prisma.schoolAdmin.findFirst({
        where: { userId: user.id },
        select: { schoolId: true }
      })
      
      if (!schoolAdmin) {
        return NextResponse.json({ error: 'School admin not found' }, { status: 404 })
      }
      
      where.subscription = {
        schoolId: schoolAdmin.schoolId
      }
    } else if (schoolId) {
      // For super admins, allow filtering by schoolId
      where.subscription = {
        schoolId
      }
    }
    
    if (search) {
      where.OR = [
        { invoiceNumber: { contains: search, mode: 'insensitive' } },
        { notes: { contains: search, mode: 'insensitive' } }
      ]
    }
    
    if (status) {
      where.status = status
    }

    // Get invoices with pagination
    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder as 'asc' | 'desc' },
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
      }),
      prisma.invoice.count({ where })
    ])

    const totalPages = Math.ceil(total / limit)

    return NextResponse.json({
      invoices,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    })
})

export const POST = route({ auth: 'SUPER_ADMIN' }, async (req) => {

    const body = await req.json()
    const { 
      subscriptionId, 
      amount, 
      taxAmount = 0, 
      dueDate, 
      paymentMethodId, 
      notes 
    } = body

    // Validate required fields
    if (!subscriptionId || !amount || !dueDate) {
      return NextResponse.json(
        { error: 'Subscription ID, amount, and due date are required' },
        { status: 400 }
      )
    }

    // Check if subscription exists
    const subscription = await prisma.subscription.findUnique({
      where: { id: subscriptionId },
      include: {
        school: true,
        package: true
      }
    })

    if (!subscription) {
      return NextResponse.json(
        { error: 'Subscription not found' },
        { status: 404 }
      )
    }

    // Generate invoice number
    const invoiceCount = await prisma.invoice.count()
    const invoiceNumber = `INV-${String(invoiceCount + 1).padStart(6, '0')}`

    const totalAmount = amount + taxAmount

    // Create invoice
    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        subscriptionId,
        amount,
        taxAmount,
        totalAmount,
        dueDate: new Date(dueDate),
        paymentMethodId,
        notes
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

    return NextResponse.json(invoice, { status: 201 })
})
