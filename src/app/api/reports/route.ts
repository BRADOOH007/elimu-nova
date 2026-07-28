import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { route } from '@/lib/api-middleware'

export const GET = route({ auth: 'SUPER_ADMIN' }, async (req, { user }) => {
  const { searchParams } = new URL(req.url)
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '10')
  const search = searchParams.get('search') || ''
  const type = searchParams.get('type') || ''
  const status = searchParams.get('status') || ''
  const sortBy = searchParams.get('sortBy') || 'createdAt'
  const sortOrder = searchParams.get('sortOrder') || 'desc'

  const skip = (page - 1) * limit

  const where: any = {}

  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } }
    ]
  }

  if (type) {
    where.type = type
  }

  if (status) {
    where.status = status
  }

  const total = await prisma.report.count({ where })

  const reports = await prisma.report.findMany({
    where,
    skip,
    take: limit,
    orderBy: {
      [sortBy]: sortOrder
    },
    include: {
      generatedByUser: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true
        }
      },
      school: {
        select: {
          id: true,
          name: true,
          email: true,
          address: true,
          phone: true
        }
      }
    }
  })

  const pages = Math.ceil(total / limit)

  return NextResponse.json({
    reports,
    pagination: {
      page,
      limit,
      total,
      pages
    }
  })
})

export const POST = route({ auth: 'SUPER_ADMIN' }, async (req, { user }) => {
  const body = await req.json()
  const {
    title,
    description,
    type,
    content,
    filters,
    isPublic,
    scheduledAt,
    expiresAt,
    schoolId
  } = body

  if (!title || !type) {
    return NextResponse.json(
      { error: 'Title and type are required' },
      { status: 400 }
    )
  }

  const report = await prisma.report.create({
    data: {
      title,
      description,
      type,
      status: 'DRAFT',
      content: content || '{}',
      filters: filters || null,
      isPublic: isPublic || false,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      generatedBy: user.id,
      schoolId: schoolId || null
    },
    include: {
      generatedByUser: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true
        }
      },
      school: {
        select: {
          id: true,
          name: true,
          email: true,
          address: true,
          phone: true
        }
      }
    }
  })

  return NextResponse.json(report, { status: 201 })
})
