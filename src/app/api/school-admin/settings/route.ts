import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { route } from '@/lib/api-middleware'

export const GET = route({ auth: 'SCHOOL_ADMIN' }, async (req, { user }) => {
  const { searchParams } = new URL(req.url)
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '10')
  const search = searchParams.get('search') || ''
  const category = searchParams.get('category') || ''
  const sortBy = searchParams.get('sortBy') || 'createdAt'
  const sortOrder = searchParams.get('sortOrder') || 'desc'

  const schoolAdmin = await prisma.schoolAdmin.findFirst({
    where: { userId: user.id },
    select: { schoolId: true }
  })
    
    if (!schoolAdmin) {
      return NextResponse.json({ error: 'School admin not found' }, { status: 404 })
    }

    const where: any = {
      schoolId: schoolAdmin.schoolId
    }
    
    // Search filter
    if (search) {
      where.OR = [
        { key: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ]
    }
    
    // Category filter
    if (category && category !== 'all') {
      where.category = category
    }

    // Sort configuration
    const orderBy: any = {}
    if (sortBy === 'key') {
      orderBy.key = sortOrder
    } else if (sortBy === 'category') {
      orderBy.category = sortOrder
    } else if (sortBy === 'updatedAt') {
      orderBy.updatedAt = sortOrder
    } else {
      orderBy.createdAt = sortOrder
    }

    const [settings, total] = await Promise.all([
      prisma.schoolSettings.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy,
        include: {
          updatedByUser: {
            select: {
              firstName: true,
              lastName: true,
              email: true
            }
          }
        }
      }),
      prisma.schoolSettings.count({ where })
    ])

    const pages = Math.ceil(total / limit)

    return NextResponse.json({
      settings,
      pagination: {
        page,
        limit,
        total,
        pages
      }
    })
})

export const POST = route({ auth: 'SCHOOL_ADMIN' }, async (req, { user }) => {
  const body = await req.json()
    const { 
      key, 
      value, 
      type = 'string',
      category = 'general',
      description,
      isEditable = true
    } = body

    // Get school admin's school ID
    const schoolAdmin = await prisma.schoolAdmin.findFirst({
      where: { userId: user.id },
      select: { schoolId: true }
    })
    
    if (!schoolAdmin) {
      return NextResponse.json({ error: 'School admin not found' }, { status: 404 })
    }

    // Validate required fields
    if (!key || value === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Check if setting already exists for this school
    const existingSetting = await prisma.schoolSettings.findFirst({
      where: {
        schoolId: schoolAdmin.schoolId,
        key
      }
    })

    if (existingSetting) {
      return NextResponse.json({ error: 'Setting with this key already exists for this school' }, { status: 400 })
    }

    // Create setting
    const setting = await prisma.schoolSettings.create({
      data: {
        schoolId: schoolAdmin.schoolId,
        key,
        value: typeof value === 'string' ? value : JSON.stringify(value),
        type,
        category,
        description,
        isEditable,
        updatedBy: user.id
      },
      include: {
        updatedByUser: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    })

    return NextResponse.json(setting, { status: 201 })
})
