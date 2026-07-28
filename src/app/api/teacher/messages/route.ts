import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { route } from '@/lib/api-middleware'
import { sseBus } from '@/lib/sse-events'

export const GET = route({ auth: 'TEACHER' }, async (req, { user }) => {
  try {
    console.log('📨 Fetching teacher messages...')

    // Get teacher record
    const teacher = await prisma.teacher.findUnique({
      where: { userId: user.id }
    })

    if (!teacher) {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 })
    }

    console.log('✅ Teacher found:', teacher.id)

    // Get messages for this teacher (both sent and received, including parent messages)
    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { recipientId: teacher.id, recipientType: 'TEACHER' },
          { senderId: teacher.id, senderType: 'TEACHER' },
          // Parents can also message teachers directly using the teacher's userId
          { recipientId: user.id, recipientType: 'TEACHER' },
        ]
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    console.log(`✅ Found ${messages.length} messages`)

    // Get sender details for each message
    const messagesWithDetails = await Promise.all(
      messages.map(async (message) => {
        let senderInfo: { name: string; role: string; avatar: string | null } = {
          name: 'Unknown',
          role: message.senderType,
          avatar: null as string | null
        }

        // If message is from student
        if (message.senderType === 'STUDENT') {
          const student = await prisma.student.findUnique({
            where: { id: message.senderId },
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                  avatar: true
                }
              }
            }
          })
          if (student) {
            senderInfo = {
              name: `${student.user.firstName} ${student.user.lastName}`,
              role: 'Student',
              avatar: student.user.avatar
            }
          }
        } 
        // If message is from parent
        else if (message.senderType === 'PARENT') {
          const parent = await prisma.parent.findUnique({
            where: { id: message.senderId },
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                  avatar: true
                }
              }
            }
          })
          if (parent) {
            senderInfo = {
              name: `${parent.user.firstName} ${parent.user.lastName}`,
              role: 'Parent',
              avatar: parent.user.avatar
            }
          }
        }
        // If message is from teacher (sent by current user)
        else if (message.senderType === 'TEACHER' && message.senderId === teacher.id) {
          senderInfo = {
            name: 'You',
            role: 'Teacher',
            avatar: user.avatar || null
          }
        }

        const msg = message as any
        return {
          id: message.id,
          from: senderInfo,
          subject: message.subject,
          content: message.content,
          timestamp: message.createdAt.toISOString(),
          read: message.isRead,
          isSent: message.senderId === teacher.id,
          hasReplies: msg.replies?.length > 0,
          attachments: message.attachments,
          senderId: message.senderId,
          senderType: message.senderType
        }
      })
    )

    return NextResponse.json({
      messages: messagesWithDetails
    })

  } catch (error) {
    console.error('❌ Error fetching messages:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch messages',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
})

// POST endpoint to send a message
export const POST = route({ auth: 'TEACHER' }, async (req, { user }) => {
  try {
    console.log('📤 Sending message...')

    const teacher = await prisma.teacher.findUnique({
      where: { userId: user.id }
    })

    if (!teacher) {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 })
    }

    const body = await req.json()
    const { recipientId, subject, content, recipientType = 'STUDENT', parentId, attachments = [] } = body

    if (!recipientId || !subject || !content) {
      return NextResponse.json({ 
        error: 'Missing required fields: recipientId, subject, content' 
      }, { status: 400 })
    }

    // Create the message
    const message = await prisma.message.create({
      data: {
        senderId: teacher.id,
        senderType: 'TEACHER',
        recipientId,
        recipientType,
        subject,
        content,
        parentId,
        attachments,
        isRead: false
      }
    })

    console.log('✅ Message sent:', message.id)

    sseBus.publish(`messages:teacher:${teacher.id}`, 'message-sent', {
      messageId: message.id,
      subject: message.subject,
    })

    return NextResponse.json({
      success: true,
      message: 'Message sent successfully',
      messageId: message.id
    })

  } catch (error) {
    console.error('❌ Error sending message:', error)
    return NextResponse.json({ 
      error: 'Failed to send message',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
})

// PATCH endpoint to mark message as read
export const PATCH = route({ auth: 'TEACHER' }, async (req, { user }) => {
  try {
    const teacher = await prisma.teacher.findUnique({
      where: { userId: user.id }
    })

    if (!teacher) {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 })
    }

    const body = await req.json()
    const { messageId } = body

    if (!messageId) {
      return NextResponse.json({ error: 'Missing messageId' }, { status: 400 })
    }

    // Update message as read
    const message = await prisma.message.update({
      where: {
        id: messageId,
        recipientId: teacher.id,
        recipientType: 'TEACHER'
      },
      data: {
        isRead: true,
        readAt: new Date()
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Message marked as read'
    })

  } catch (error) {
    console.error('❌ Error marking message as read:', error)
    return NextResponse.json({ 
      error: 'Failed to mark message as read',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
})
