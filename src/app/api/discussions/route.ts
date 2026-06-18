import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// We store discussions as Message records with senderType=STUDENT/TEACHER
// and a special subject prefix "DISCUSSION:" so they're filterable

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const classId = searchParams.get('classId')
    const status  = searchParams.get('status') || 'all' // pending | approved | rejected | all

    // Get the teacher/student's school context
    let teacherId = ''
    if (session.user.role === 'TEACHER') {
      const t = await (prisma as any).teacher.findUnique({ where: { userId: session.user.id } })
      teacherId = t?.id || ''
    }

    // Fetch discussion messages (stored as messages with DISCUSSION: prefix)
    const whereClause: any = {
      subject: { startsWith: 'DISCUSSION:' },
    }

    if (status === 'pending')  whereClause.isRead = false
    if (status === 'approved') whereClause.isRead = true

    const messages = await (prisma as any).message.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      take: 100,
    })

    // Enrich with sender info
    const enriched = await Promise.all(messages.map(async (m: any) => {
      let senderName = 'Unknown'
      let senderRole = m.senderType

      if (m.senderType === 'STUDENT') {
        const s = await (prisma as any).student.findUnique({
          where: { id: m.senderId },
          include: { user: { select: { firstName: true, lastName: true } } },
        })
        if (s) senderName = `${s.user.firstName} ${s.user.lastName}`
      } else if (m.senderType === 'TEACHER') {
        const t = await (prisma as any).teacher.findUnique({
          where: { id: m.senderId },
          include: { user: { select: { firstName: true, lastName: true } } },
        })
        if (t) senderName = `${t.user.firstName} ${t.user.lastName}`
      }

      return {
        id:         m.id,
        topic:      m.subject.replace('DISCUSSION:', '').trim(),
        message:    m.content,
        senderName,
        senderRole,
        senderId:   m.senderId,
        status:     m.isRead ? 'approved' : 'pending',
        readAt:     m.readAt,
        createdAt:  m.createdAt,
        attachments: m.attachments,
      }
    }))

    return NextResponse.json({ discussions: enriched })
  } catch (error) {
    console.error('[GET_DISCUSSIONS]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST — student or teacher posts a discussion message
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { topic, message, recipientId, recipientType = 'TEACHER' } = await request.json()
    if (!topic || !message) return NextResponse.json({ error: 'Topic and message required' }, { status: 400 })

    // Determine senderId (teacher.id or student.id, not user.id)
    let senderId  = ''
    let senderType = ''

    if (session.user.role === 'STUDENT') {
      const s = await (prisma as any).student.findUnique({ where: { userId: session.user.id } })
      senderId  = s?.id || ''
      senderType = 'STUDENT'
    } else if (session.user.role === 'TEACHER') {
      const t = await (prisma as any).teacher.findUnique({ where: { userId: session.user.id } })
      senderId  = t?.id || ''
      senderType = 'TEACHER'
    }

    if (!senderId) return NextResponse.json({ error: 'Sender not found' }, { status: 404 })

    const msg = await (prisma as any).message.create({
      data: {
        subject:       `DISCUSSION: ${topic}`,
        content:       message,
        senderId,
        senderType,
        recipientId:   recipientId || senderId,
        recipientType: recipientType,
        isRead:        session.user.role === 'TEACHER', // teacher posts are auto-approved
        attachments:   [],
      },
    })

    return NextResponse.json({ discussion: { id: msg.id, status: msg.isRead ? 'approved' : 'pending' } }, { status: 201 })
  } catch (error) {
    console.error('[POST_DISCUSSIONS]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH — teacher approves or rejects a message
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || session.user.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { messageId, action } = await request.json() // action: 'approve' | 'reject'

    const updated = await (prisma as any).message.update({
      where: { id: messageId },
      data: {
        isRead:  action === 'approve',
        readAt:  action === 'approve' ? new Date() : null,
        // Store rejection in content prefix (non-destructive)
        ...(action === 'reject' ? { subject: `REJECTED:${(await (prisma as any).message.findUnique({ where: { id: messageId } }))?.subject}` } : {}),
      },
    })

    return NextResponse.json({ success: true, status: action === 'approve' ? 'approved' : 'rejected' })
  } catch (error) {
    console.error('[PATCH_DISCUSSIONS]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
