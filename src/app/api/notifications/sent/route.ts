import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { route } from '@/lib/api-middleware'

/**
 * GET /api/notifications/sent
 * Returns broadcast messages sent BY the current user, aggregated by title+createdAt.
 * Used by super admin broadcast history panel.
 */
export const GET = route({}, async (req, { user }) => {
  const { searchParams } = new URL(req.url)
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100)

  // Get distinct broadcasts sent by this user — one row per unique broadcast
  // We group by title + createdAt (within 1 second window) to collapse per-user rows
  const sent = await prisma.notification.findMany({
    where: { senderId: user.id },
    orderBy: { createdAt: 'desc' },
    distinct: ['title', 'type'],
    take: limit,
    select: {
      id: true,
      title: true,
      message: true,
      type: true,
      createdAt: true,
    },
  })

  // For each unique broadcast, count how many users received it
  const withCounts = await Promise.all(
    sent.map(async (n) => {
      const count = await prisma.notification.count({
        where: {
          senderId: user.id,
          title: n.title,
          createdAt: {
            gte: new Date(n.createdAt.getTime() - 5000),
            lte: new Date(n.createdAt.getTime() + 5000),
          },
        },
      })
      return { ...n, recipientCount: count }
    })
  )

  return NextResponse.json({ broadcasts: withCounts })
})
