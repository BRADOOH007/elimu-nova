import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { route } from '@/lib/api-middleware'

export const POST = route({}, async (req, { user }) => {

    const body = await req.json()
    const { recipientId, recipientType, subject, content } = body

    if (!recipientId || !content) {
      return NextResponse.json({ error: 'Recipient and content are required' }, { status: 400 })
    }

    // Determine sender model ID based on role
    let senderId = user.id
    if (user.role === 'TEACHER') {
      const teacher = await prisma.teacher.findUnique({ where: { userId: user.id } })
      if (teacher) senderId = teacher.id
    } else if (user.role === 'PARENT') {
      const parent = await prisma.parent.findUnique({ where: { userId: user.id } })
      if (parent) senderId = parent.id
    } else if (user.role === 'STUDENT') {
      const student = await prisma.student.findUnique({ where: { userId: user.id } })
      if (student) senderId = student.id
    }

    const message = await prisma.message.create({
      data: {
        senderId,
        senderType: user.role as any,
        recipientId,
        recipientType: recipientType || 'PARENT',
        subject: subject || 'No subject',
        content,
        isRead: false,
      }
    })

    return NextResponse.json(message, { status: 201 })
})
