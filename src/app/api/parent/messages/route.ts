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

    const parent = await prisma.parent.findUnique({ where: { userId: session.user.id } })
    if (!parent) {
      return NextResponse.json({ error: 'Parent not found' }, { status: 404 })
    }

    const messages = await prismaClient.message.findMany({
      where: {
        OR: [
          { senderId: parent.id, senderType: 'PARENT' },
          { recipientId: parent.id, recipientType: 'PARENT' },
        ],
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })

    // Resolve sender/recipient names
    const teacherIds = new Set<string>()
    messages.forEach((m: any) => {
      if (m.senderType === 'TEACHER') teacherIds.add(m.senderId)
      if (m.recipientType === 'TEACHER') teacherIds.add(m.recipientId)
    })

    const teacherNameMap = new Map<string, string>()
    if (teacherIds.size > 0) {
      const teachers = await prismaClient.teacher.findMany({
        where: { id: { in: Array.from(teacherIds) } },
        include: { user: { select: { firstName: true, lastName: true } } },
      })
      for (const t of teachers) {
        teacherNameMap.set(t.id, `${t.user.firstName} ${t.user.lastName}`)
      }
    }

    const enriched = messages.map((m: any) => {
      let senderName = m.senderType
      let recipientName = m.recipientType
      if (m.senderType === 'TEACHER') senderName = teacherNameMap.get(m.senderId) || 'Teacher'
      if (m.recipientType === 'TEACHER') recipientName = teacherNameMap.get(m.recipientId) || 'Teacher'
      if (m.senderType === 'PARENT' && m.senderId === parent.id) senderName = 'You'
      if (m.recipientType === 'PARENT' && m.recipientId === parent.id) recipientName = 'You'
      return {
        ...m,
        senderName,
        recipientName,
      }
    })

    return NextResponse.json({ messages: enriched, parentId: parent.id })
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

    const parent = await prisma.parent.findUnique({ where: { userId: session.user.id } })
    if (!parent) {
      return NextResponse.json({ error: 'Parent not found' }, { status: 404 })
    }

    const { subject, content, recipientId, recipientType, parentId } = await request.json()
    if (!subject || !content || !recipientId || !recipientType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const message = await prismaClient.message.create({
      data: {
        subject,
        content,
        senderId: parent.id,
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
