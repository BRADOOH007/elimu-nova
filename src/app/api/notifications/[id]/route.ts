import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { route } from '@/lib/api-middleware'

export const PATCH = route({}, async (req, { params, user }) => {

    const { id } = params
    const notification = await prisma.notification.update({
      where: { id, userId: user.id },
      data: { isRead: true }
    })

    return NextResponse.json(notification)
})

export const DELETE = route({}, async (req, { params, user }) => {

    const { id } = params
    await prisma.notification.delete({
      where: { id, userId: user.id }
    })

    return NextResponse.json({ success: true })
})
