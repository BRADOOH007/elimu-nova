import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { route } from '@/lib/api-middleware'

export const dynamic = 'force-dynamic'

export const GET = route({ auth: 'SUPER_ADMIN' }, async (req, { user }) => {
  try {
    const url = new URL(req.url)
    const page = parseInt(url.searchParams.get('page') || '1')
    const limit = parseInt(url.searchParams.get('limit') || '50')
    const entity = url.searchParams.get('entity')
    const action = url.searchParams.get('action')

    const where: any = {}
    if (entity) where.entity = entity
    if (action) where.action = action

    const [logs, total] = await Promise.all([
      prisma.adminAuditLog.findMany({
        where,
        include: { actor: { select: { firstName: true, lastName: true, email: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.adminAuditLog.count({ where }),
    ])

    return NextResponse.json({ logs, total, page, limit, pages: Math.ceil(total / limit) })
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
})
