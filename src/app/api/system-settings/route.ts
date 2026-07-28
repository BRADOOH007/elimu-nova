import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { route } from '@/lib/api-middleware'

export const GET = route({ auth: 'SUPER_ADMIN' }, async (req) => {
  const { searchParams } = new URL(req.url)
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '10')
  const search = searchParams.get('search') || ''
  const category = searchParams.get('category') || ''
  const type = searchParams.get('type') || ''
  const sortBy = searchParams.get('sortBy') || 'createdAt'
  const sortOrder = searchParams.get('sortOrder') || 'desc'

  const where: any = {}
  
  if (search) {
    where.OR = [
      { key: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } }
    ]
  }
  
  if (category && category !== 'all-categories') {
    where.category = category
  }
  
  if (type && type !== 'all-types') {
    where.type = type
  }

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
})

export const DELETE = route({ auth: 'SUPER_ADMIN' }, async (req) => {
  const { searchParams } = new URL(req.url)
  const key = searchParams.get('key')
  if (!key) return NextResponse.json({ error: 'key param required' }, { status: 400 })
  await prisma.systemSettings.delete({ where: { key } })
  return NextResponse.json({ success: true })
})

export const POST = route({ auth: 'SUPER_ADMIN' }, async (req, { user }) => {
  const body = await req.json()
  const { 
    key,
    value,
    type,
    category,
    description,
    isPublic,
    isEditable
  } = body

  if (!key || !value || !type || !category) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const setting = await prisma.systemSettings.upsert({
    where: { key },
    update: {
      value,
      type,
      category,
      description: description || null,
      isPublic: isPublic || false,
      isEditable: isEditable !== false,
      updatedBy: user.id,
    },
    create: {
      key,
      value,
      type,
      category,
      description: description || null,
      isPublic: isPublic || false,
      isEditable: isEditable !== false,
      updatedBy: user.id,
    },
    include: {
      updatedByUser: {
        select: { id: true, firstName: true, lastName: true, email: true }
      }
    }
  })

  return NextResponse.json(setting, { status: 201 })
})
