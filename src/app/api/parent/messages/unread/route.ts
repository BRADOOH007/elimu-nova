import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { route } from '@/lib/api-middleware'

export const GET = route({ auth: 'PARENT' }, async (req, { user }) => {
  try {
    const parent = await prisma.parent.findUnique({ where: { userId: user.id } })
    if (!parent) {
      return NextResponse.json({ error: 'Parent not found' }, { status: 404 })
    }

    const unreadCount = await prisma.message.count({
      where: {
        recipientId: parent.id,
        recipientType: 'PARENT',
        isRead: false
      }
    })

    return NextResponse.json({ unreadCount })
  } catch (error) {
    console.error('Error fetching parent unread count:', error)
    return NextResponse.json(
      { error: 'Failed to fetch unread count' },
      { status: 500 }
    )
  }
})
