import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { route } from '@/lib/api-middleware'

export const GET = route({ auth: 'SUPER_ADMIN' }, async (req) => {

    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    const where: any = {}
    
    // Search filter
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ]
    }

    // Sort configuration
    const orderBy: any = {}
    if (sortBy === 'name') {
      orderBy.name = sortOrder
    } else if (sortBy === 'price') {
      orderBy.price = sortOrder
    } else if (sortBy === 'duration') {
      orderBy.duration = sortOrder
    } else if (sortBy === 'maxTeachers') {
      orderBy.maxTeachers = sortOrder
    } else if (sortBy === 'maxStudents') {
      orderBy.maxStudents = sortOrder
    } else {
      orderBy.createdAt = sortOrder
    }

    const [packages, total] = await Promise.all([
      prisma.package.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy,
        include: {
          subscriptions: {
            where: { status: 'ACTIVE' },
            select: { id: true }
          },
          _count: {
            select: {
              subscriptions: true
            }
          }
        }
      }),
      prisma.package.count({ where })
    ])

    const pages = Math.ceil(total / limit)

    return NextResponse.json({
      packages,
      pagination: {
        page,
        limit,
        total,
        pages
      }
    })
})

export const POST = route({ auth: 'SUPER_ADMIN' }, async (req) => {

    const body = await req.json()
    const { 
      name,
      description,
      price,
      duration,
      maxTeachers,
      maxStudents,
      features,
      isActive = true
    } = body

    // Validate required fields
    if (!name || !description || !price || !duration || !maxTeachers || !maxStudents) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Check if package name already exists
    const existingPackage = await prisma.package.findFirst({
      where: { name: { equals: name, mode: 'insensitive' } }
    })

    if (existingPackage) {
      return NextResponse.json({ error: 'Package name already exists' }, { status: 409 })
    }

    // Create package
    const packageData = await prisma.package.create({
      data: {
        name,
        description,
        price: parseFloat(price),
        duration: parseInt(duration),
        maxTeachers: parseInt(maxTeachers),
        maxStudents: parseInt(maxStudents),
        features: features || [],
        isActive
      },
      include: {
        subscriptions: {
          where: { status: 'ACTIVE' },
          select: { id: true }
        },
        _count: {
          select: {
            subscriptions: true
          }
        }
      }
    })

    return NextResponse.json(packageData, { status: 201 })
})
