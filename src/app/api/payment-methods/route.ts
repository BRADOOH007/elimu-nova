import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { route } from '@/lib/api-middleware'

export const GET = route({ auth: 'SUPER_ADMIN' }, async (req) => {

    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'
    const search = searchParams.get('search') || ''
    const type = searchParams.get('type') || ''

    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {}
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ]
    }
    
    if (type) {
      where.type = type
    }

    // Get payment methods with pagination
    const [paymentMethods, total] = await Promise.all([
      prisma.paymentMethod.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder as 'asc' | 'desc' },
        include: {
          _count: {
            select: {
              subscriptions: true,
              invoices: true
            }
          }
        }
      }),
      prisma.paymentMethod.count({ where })
    ])

    const totalPages = Math.ceil(total / limit)

    return NextResponse.json({
      paymentMethods,
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
    const { name, type, description, isActive = true } = body

    // Validate required fields
    if (!name || !type) {
      return NextResponse.json(
        { error: 'Name and type are required' },
        { status: 400 }
      )
    }

    // Create payment method
    const paymentMethod = await prisma.paymentMethod.create({
      data: {
        name,
        type,
        description,
        isActive
      }
    })

    return NextResponse.json(paymentMethod, { status: 201 })
})

export const PATCH = route({ auth: 'SUPER_ADMIN' }, async (req) => {

    const body = await req.json()
    const { id, name, type, description, isActive } = body

    if (!id) {
      return NextResponse.json({ error: 'Missing payment method id' }, { status: 400 })
    }

    const existing = await prisma.paymentMethod.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Payment method not found' }, { status: 404 })
    }

    const updated = await prisma.paymentMethod.update({
      where: { id },
      data: {
        ...(name !== undefined ? { name } : {}),
        ...(type !== undefined ? { type } : {}),
        ...(description !== undefined ? { description } : {}),
        ...(isActive !== undefined ? { isActive } : {}),
      },
    })

    return NextResponse.json(updated)
})
