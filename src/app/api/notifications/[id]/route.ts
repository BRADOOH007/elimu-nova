import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { route } from '@/lib/api-middleware'

export const PATCH = route({ rateLimit: false }, async (req, { params, user }) => {
  const { id } = params
  if (!id) return NextResponse.json({ error: 'Missing notification id' }, { status: 400 })

  // Only mark the user's OWN notification as read — scope safely via findFirst.
  const owned = await prisma.notification.findFirst({ where: { id, userId: user.id } })
  if (!owned) return NextResponse.json({ error: 'Notification not found' }, { status: 404 })

  const notification = await prisma.notification.update({
    where: { id },
    data: { isRead: true },
  })

  return NextResponse.json(notification)
})

export const DELETE = route({ rateLimit: false }, async (req, { params, user }) => {
  const { id } = params
  if (!id) return NextResponse.json({ error: 'Missing notification id' }, { status: 400 })

  // Only allow deleting the user's OWN notification.
  const owned = await prisma.notification.findFirst({ where: { id, userId: user.id } })
  if (!owned) return NextResponse.json({ error: 'Notification not found' }, { status: 404 })

  await prisma.notification.delete({ where: { id } })

  return NextResponse.json({ success: true })
})
