import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { route } from '@/lib/api-middleware'

export const GET = route({ auth: 'SUPER_ADMIN' }, async (req) => {
  const { searchParams } = new URL(req.url)
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '10')
  const search = searchParams.get('search') || ''
  const eventType = searchParams.get('eventType') || ''
  const severity = searchParams.get('severity') || ''
  const resolved = searchParams.get('resolved') || ''
  const sortBy = searchParams.get('sortBy') || 'createdAt'
  const sortOrder = searchParams.get('sortOrder') || 'desc'

  const where: any = {}
  
  if (search) {
    where.OR = [
      { description: { contains: search, mode: 'insensitive' } },
      { ipAddress: { contains: search, mode: 'insensitive' } }
    ]
  }
  
  if (eventType && eventType !== 'all-events') {
    where.eventType = eventType
  }
  
  if (severity && severity !== 'all-severities') {
    where.severity = severity
  }

  if (resolved && resolved !== 'all-status') {
    where.resolved = resolved === 'resolved'
  }

  const orderBy: any = {}
  if (sortBy === 'eventType') {
    orderBy.eventType = sortOrder
  } else if (sortBy === 'severity') {
    orderBy.severity = sortOrder
  } else if (sortBy === 'resolved') {
    orderBy.resolved = sortOrder
  } else {
    orderBy.createdAt = sortOrder
  }

  const [logs, total] = await Promise.all([
    prisma.securityLog.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy,
      include: {
        user: {
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
            name: true
          }
        },
        resolver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    }),
    prisma.securityLog.count({ where })
  ])

  const pages = Math.ceil(total / limit)

  return NextResponse.json({
    logs,
    pagination: {
      page,
      limit,
      total,
      pages
    }
  })
})
