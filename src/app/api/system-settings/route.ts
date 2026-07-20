import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is super admin
    if (session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const category = searchParams.get('category') || ''
    const type = searchParams.get('type') || ''
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    const where: any = {}
    
    // Search filter
    if (search) {
      where.OR = [
        { key: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ]
    }
    
    // Category filter
    if (category && category !== 'all-categories') {
      where.category = category
    }
    
    // Type filter
    if (type && type !== 'all-types') {
      where.type = type
    }

    // Sort configuration
    const orderBy: any = {}
    if (sortBy === 'key') {
      orderBy.key = sortOrder
    } else if (sortBy === 'category') {
      orderBy.category = sortOrder
    } else if (sortBy === 'type') {
      orderBy.type = sortOrder
    } else if (sortBy === 'updatedAt') {
      orderBy.updatedAt = sortOrder
    } else {
      orderBy.createdAt = sortOrder
    }

    const [settings, total] = await Promise.all([
      prisma.systemSettings.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy,
        include: {
          updatedByUser: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          }
        }
      }),
      prisma.systemSettings.count({ where })
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
  } catch (error) {
    console.error('Error fetching system settings:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { searchParams } = new URL(request.url)
    const key = searchParams.get('key')
    if (!key) return NextResponse.json({ error: 'key param required' }, { status: 400 })
    await prisma.systemSettings.delete({ where: { key } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting system setting:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is super admin
    if (session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { 
      key,
      value,
      type,
      category,
      description,
      isPublic,
      isEditable
    } = body

    // Validate required fields
    if (!key || !value || !type || !category) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Upsert — create or update
    const setting = await prisma.systemSettings.upsert({
      where: { key },
      update: {
        value,
        type,
        category,
        description: description || null,
        isPublic: isPublic || false,
        isEditable: isEditable !== false,
        updatedBy: session.user.id,
      },
      create: {
        key,
        value,
        type,
        category,
        description: description || null,
        isPublic: isPublic || false,
        isEditable: isEditable !== false,
        updatedBy: session.user.id,
      },
      include: {
        updatedByUser: {
          select: { id: true, firstName: true, lastName: true, email: true }
        }
      }
    })

    return NextResponse.json(setting, { status: 201 })
  } catch (error) {
    console.error('Error creating system setting:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
