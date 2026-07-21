import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { recipientId, recipientType, subject, content } = body

    if (!recipientId || !content) {
      return NextResponse.json({ error: 'Recipient and content are required' }, { status: 400 })
    }

    // Determine sender model ID based on role
    let senderId = session.user.id
    if (session.user.role === 'TEACHER') {
      const teacher = await prisma.teacher.findUnique({ where: { userId: session.user.id } })
      if (teacher) senderId = teacher.id
    } else if (session.user.role === 'PARENT') {
      const parent = await prisma.parent.findUnique({ where: { userId: session.user.id } })
      if (parent) senderId = parent.id
    } else if (session.user.role === 'STUDENT') {
      const student = await prisma.student.findUnique({ where: { userId: session.user.id } })
      if (student) senderId = student.id
    }

    const message = await prisma.message.create({
      data: {
        senderId,
        senderType: session.user.role as any,
        recipientId,
        recipientType: recipientType || 'PARENT',
        subject: subject || 'No subject',
        content,
        isRead: false,
      }
    })

    return NextResponse.json(message, { status: 201 })
  } catch (error) {
    console.error('Error sending message:', error)
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 })
  }
}
