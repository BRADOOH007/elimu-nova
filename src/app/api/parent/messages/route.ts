import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const prismaClient = prisma as any

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const messages = await prismaClient.message.findMany({
      where: {
        OR: [
          { senderId: session.user.id, senderType: 'PARENT' },
          { recipientId: session.user.id, recipientType: 'PARENT' },
        ],
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })

    return NextResponse.json({ messages })
  } catch (error) {
    console.error('[GET_PARENT_MESSAGES]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { subject, content, recipientId, recipientType, parentId } = await request.json()
    if (!subject || !content || !recipientId || !recipientType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const message = await prismaClient.message.create({
      data: {
        subject,
        content,
        senderId: session.user.id,
        senderType: 'PARENT',
        recipientId,
        recipientType,
        parentId: parentId || null,
      },
    })

    return NextResponse.json(message, { status: 201 })
  } catch (error) {
    console.error('[POST_PARENT_MESSAGES]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { messageId } = await request.json()
    const message = await prismaClient.message.update({
      where: { id: messageId },
      data: { isRead: true, readAt: new Date() },
    })

    return NextResponse.json(message)
  } catch (error) {
    console.error('[PATCH_PARENT_MESSAGES]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
