import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    console.log('📨 Fetching teacher messages...')
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id || session.user.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get teacher record
    const teacher = await prisma.teacher.findUnique({
      where: { userId: session.user.id }
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
          { recipientId: session.user.id, recipientType: 'TEACHER' },
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
        let senderInfo = {
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
            avatar: session.user.avatar || null
          }
        }

        return {
          id: message.id,
          from: senderInfo,
          subject: message.subject,
          content: message.content,
          timestamp: message.createdAt.toISOString(),
          read: message.isRead,
          isSent: message.senderId === teacher.id,
          hasReplies: message.replies?.length > 0,
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
}

// POST endpoint to send a message
export async function POST(request: NextRequest) {
  try {
    console.log('📤 Sending message...')
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id || session.user.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const teacher = await prisma.teacher.findUnique({
      where: { userId: session.user.id }
    })

    if (!teacher) {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 })
    }

    const body = await request.json()
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
}

// PATCH endpoint to mark message as read
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id || session.user.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const teacher = await prisma.teacher.findUnique({
      where: { userId: session.user.id }
    })

    if (!teacher) {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 })
    }

    const body = await request.json()
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
}
