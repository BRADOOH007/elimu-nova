import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { route } from '@/lib/api-middleware'

export const dynamic = 'force-dynamic'

export const GET = route({ auth: 'SUPER_ADMIN' }, async (req) => {
  const url = new URL(req.url)
  const status = url.searchParams.get('status')
  const category = url.searchParams.get('category')
  const severity = url.searchParams.get('severity')
  const page = parseInt(url.searchParams.get('page') || '1', 10)
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '50', 10), 100)

  const where: any = {}
  if (status) where.status = status
  if (category) where.category = category
  if (severity) where.severity = severity

  const [incidents, total, counts] = await Promise.all([
    (prisma as any).systemIncident.findMany({
      where,
      orderBy: [{ lastSeen: 'desc' }],
      skip: (page - 1) * limit,
      take: limit,
    }),
    (prisma as any).systemIncident.count({ where }),
    (prisma as any).systemIncident.groupBy({
      by: ['status'],
      _count: { _all: true },
    }),
  ])

  const statusCounts = Object.fromEntries(counts.map(c => [c.status, c._count._all]))

  return NextResponse.json({ incidents, total, page, limit, pages: Math.ceil(total / limit), statusCounts })
})

export const PATCH = route({ auth: 'SUPER_ADMIN' }, async (req, { user }) => {
  const body = await req.clone().json()
  const { id, action } = body
  if (!id || !action || !['RESOLVE', 'ACKNOWLEDGE'].includes(action)) {
    return NextResponse.json({ error: 'Invalid request. Provide id and action (RESOLVE or ACKNOWLEDGE).' }, { status: 400 })
  }

  const incident = await prisma.systemIncident.findUnique({ where: { id } })
  if (!incident) return NextResponse.json({ error: 'Incident not found' }, { status: 404 })

  await prisma.systemIncident.update({
    where: { id },
    data: action === 'RESOLVE'
      ? { status: 'RESOLVED', resolvedAt: new Date(), resolvedBy: user.id }
      : { status: 'ACKNOWLEDGED' },
  })

  return NextResponse.json({ ok: true, id, action })
})
