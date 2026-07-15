import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    console.log('📨 Fetching student messages...')
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id || session.user.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get student record
    const student = await prisma.student.findUnique({
      where: { userId: session.user.id },
      include: {
        teacher: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                avatar: true
              }
            }
          }
        }
      }
    })

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }

    console.log('✅ Student found:', student.id)

    // Get messages for this student (both sent and received)
    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { recipientId: student.id, recipientType: 'STUDENT' },
          { senderId: student.id, senderType: 'STUDENT' }
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

        // If message is from teacher, get teacher info
        if (message.senderType === 'TEACHER' && message.senderId === student.teacher?.id) {
          senderInfo = {
            name: `${student.teacher.user.firstName} ${student.teacher.user.lastName}`,
            role: 'Teacher',
            avatar: student.teacher.user.avatar
          }
        } 
        // If message is from student (sent by current user)
        else if (message.senderType === 'STUDENT' && message.senderId === student.id) {
          senderInfo = {
            name: 'You',
            role: 'Student',
            avatar: session.user.avatar || null
          }
        }
        // If message is from another teacher
        else if (message.senderType === 'TEACHER') {
          const teacher = await prisma.teacher.findUnique({
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
          if (teacher) {
            senderInfo = {
              name: `${teacher.user.firstName} ${teacher.user.lastName}`,
              role: 'Teacher',
              avatar: teacher.user.avatar
            }
          }
        }

        return {
          id: message.id,
          from: senderInfo,
          subject: message.subject,
          content: message.content,
          timestamp: message.createdAt.toISOString(),
          read: message.isRead,
          isSent: message.senderId === student.id,
          hasReplies: (message as any).replies?.length > 0,
          attachments: message.attachments
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
    
    if (!session?.user?.id || session.user.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const student = await prisma.student.findUnique({
      where: { userId: session.user.id }
    })

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }

    const body = await request.json()
    let { recipientId, subject, content, recipientType = 'TEACHER', parentId, attachments = [] } = body

    if (!subject || !content) {
      return NextResponse.json({ 
        error: 'Missing required fields: subject, content' 
      }, { status: 400 })
    }

    // If recipientId is 'teacher' or not provided, use the student's assigned teacher
    if (!recipientId || recipientId === 'teacher') {
      console.log('🔍 Resolving teacher ID from student assignment...')
      if (!student.teacherId) {
        console.log('❌ Student has no teacher assigned!')
        return NextResponse.json({ 
          error: 'No teacher assigned to this student' 
        }, { status: 400 })
      }
      recipientId = student.teacherId
      console.log(`✅ Resolved teacher ID: ${recipientId}`)
    }

    console.log(`📤 Creating message: ${subject}`)
    console.log(`   From: STUDENT (${student.id})`)
    console.log(`   To: ${recipientType} (${recipientId})`)

    // Create the message
    const message = await prisma.message.create({
      data: {
        senderId: student.id,
        senderType: 'STUDENT',
        recipientId,
        recipientType,
        subject,
        content,
        parentId: parentId || null,
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
    
    if (!session?.user?.id || session.user.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const student = await prisma.student.findUnique({
      where: { userId: session.user.id }
    })

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
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
        recipientId: student.id,
        recipientType: 'STUDENT'
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
