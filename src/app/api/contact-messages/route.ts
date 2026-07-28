import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { route } from '@/lib/api-middleware'

export const GET = route({ auth: 'SUPER_ADMIN' }, async (req) => {
  const { searchParams } = new URL(req.url)
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '20')
  const read = searchParams.get('read') // 'true', 'false', or null for all

  const where: any = {}
  if (read === 'true') where.isRead = true
  else if (read === 'false') where.isRead = false

  const [messages, total, unread] = await Promise.all([
    prisma.contactMessage.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.contactMessage.count({ where }),
    prisma.contactMessage.count({ where: { isRead: false } }),
  ])

  return NextResponse.json({
    messages,
    unread,
    pagination: {
      page, limit, total,
      pages: Math.ceil(total / limit),
    },
  })
})

export async function PATCH(req: Request) {
  const { ids, isRead } = await req.json()
  await prisma.contactMessage.updateMany({
    where: { id: { in: ids } },
    data: { isRead },
  })
  return NextResponse.json({ success: true })
}
