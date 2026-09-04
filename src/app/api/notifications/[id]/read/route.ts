import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { route } from '@/lib/api-middleware'

/** PATCH /api/notifications/:id/read — mark a single notification as read */
export const PATCH = route({ rateLimit: false }, async (req, { user, params }) => {
  const id = params.id
  if (!id) return NextResponse.json({ error: 'Missing notification id' }, { status: 400 })

  // Only allow marking own notifications as read
  const notification = await prisma.notification.findFirst({
    where: { id, userId: user.id },
  })

  if (!notification) {
    return NextResponse.json({ error: 'Notification not found' }, { status: 404 })
  }

  await prisma.notification.update({
    where: { id },
    data: { isRead: true },
  })

  return NextResponse.json({ success: true })
})
