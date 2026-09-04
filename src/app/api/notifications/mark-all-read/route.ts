import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { route } from '@/lib/api-middleware'

export const PATCH = route({ rateLimit: false }, async (req, { user }) => {

    const body = await req.json()
    const { userId } = body

    await prisma.notification.updateMany({
      where: { 
        userId: userId || user.id,
        isRead: false 
      },
      data: { isRead: true }
    })

    return NextResponse.json({ success: true })
})
