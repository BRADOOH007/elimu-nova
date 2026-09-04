import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { emitNewNotification } from '@/lib/notification-events'
import { route } from '@/lib/api-middleware'

export const GET = route({ skipSubscriptionCheck: true, rateLimit: false }, async (req, { user }) => {

    const { searchParams } = new URL(req.url)
    const userId = user.id
    const unreadOnly = searchParams.get('unreadOnly') === 'true'
    const countOnly = searchParams.get('countOnly') === 'true'
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)
    const offset = parseInt(searchParams.get('offset') || '0')

    const where: any = { userId }
    if (unreadOnly) where.isRead = false

    // Exclude expired notifications (e.g. maintenance banners whose window has
    // passed) so they stop appearing, and auto-mark them read so they don't
    // count toward the unread badge either.
    const now = new Date()
    await prisma.notification.updateMany({
      where: { userId, expiresAt: { not: null, lt: now } },
      data: { isRead: true },
    })

    if (countOnly) {
      const count = await prisma.notification.count({ where })
      return NextResponse.json({ count })
    }

    const notifications = await prisma.notification.findMany({
      where: {
        ...where,
        OR: [
          { expiresAt: null },
          { expiresAt: { gte: now } },
        ],
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    })

    return NextResponse.json(notifications)
})

export const POST = route({ auth: ['TEACHER', 'SCHOOL_ADMIN', 'SUPER_ADMIN'] }, async (req, { user }) => {

    const body = await req.json()
    const { title, message, type, userId, expiresAt } = body

    if (!title || !message || !type || !userId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (user.role !== 'SUPER_ADMIN') {
      const targetUser = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } })
      if (!targetUser) {
        return NextResponse.json({ error: 'Target user not found' }, { status: 404 })
      }
    }

    let expiresAtDate: Date | null = null
    if (expiresAt) {
      const d = new Date(expiresAt)
      if (isNaN(d.getTime())) {
        return NextResponse.json({ error: 'Invalid expiresAt date' }, { status: 400 })
      }
      expiresAtDate = d
    }

    const notification = await prisma.notification.create({
      data: {
        title,
        message,
        type,
        userId,
        senderId: user.id,
        expiresAt: expiresAtDate,
      }
    })

    // Push a realtime event so open dashboards refresh instantly.
    emitNewNotification(userId, { title, type })

    return NextResponse.json(notification, { status: 201 })
})
