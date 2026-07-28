import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { route } from '@/lib/api-middleware'

export const GET = route({ auth: 'STUDENT' }, async (request, { user }) => {
  const student = await prisma.student.findUnique({
    where: { userId: user.id }
  })

  if (!student) {
    return NextResponse.json({ error: 'Student not found' }, { status: 404 })
  }

  // Count unread messages
  const unreadCount = await prisma.message.count({
    where: {
      recipientId: student.id,
      recipientType: 'STUDENT',
      isRead: false
    }
  })

  return NextResponse.json({
    unreadCount
  })
})
