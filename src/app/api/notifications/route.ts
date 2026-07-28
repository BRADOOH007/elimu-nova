import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { route } from '@/lib/api-middleware'

export const GET = route({}, async (req, { user }) => {

    const { searchParams } = new URL(req.url)
    const userId = user.id
    const unreadOnly = searchParams.get('unreadOnly') === 'true'
    const countOnly = searchParams.get('countOnly') === 'true'
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)
    const offset = parseInt(searchParams.get('offset') || '0')

    const where: any = { userId }
    if (unreadOnly) where.isRead = false

    if (countOnly) {
      const count = await prisma.notification.count({ where })
      return NextResponse.json({ count })
    }

    const notifications = await prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    })

    return NextResponse.json(notifications)
})

export const POST = route({}, async (req) => {

    const body = await req.json()
    const { title, message, type, userId } = body

    if (!title || !message || !type || !userId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const notification = await prisma.notification.create({
      data: {
        title,
        message,
        type,
        userId
      }
    })

    return NextResponse.json(notification, { status: 201 })
})
