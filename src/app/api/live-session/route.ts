import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// We store live sessions in the Schedule table (type=CLASS, status=IN_PROGRESS)
// and use metadata JSON for session state (board content, chat, participants)

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('sessionId')
    const role = session.user.role

    if (sessionId) {
      // Get a specific session
      const liveSession = await prisma.schedule.findUnique({
        where: { id: sessionId },
        include: { teacher: { include: { user: true } }, class: true },
      })
      if (!liveSession) return NextResponse.json({ error: 'Session not found' }, { status: 404 })
      return NextResponse.json({ session: liveSession })
    }

    // For teachers: get their active sessions
    if (role === 'TEACHER') {
      const teacher = await (prisma as any).teacher.findUnique({ where: { userId: session.user.id } })
      if (!teacher) return NextResponse.json({ error: 'Teacher not found' }, { status: 404 })

      const sessions = await prisma.schedule.findMany({
        where: { teacherId: teacher.id, type: 'CLASS', status: { in: ['SCHEDULED', 'IN_PROGRESS'] } },
        include: { class: true },
        orderBy: { startTime: 'desc' },
        take: 20,
      })
      return NextResponse.json({ sessions })
    }

    // For students: get their class's active session
    if (role === 'STUDENT') {
      const student = await (prisma as any).student.findUnique({ where: { userId: session.user.id } })
      if (!student?.classId) return NextResponse.json({ sessions: [] })

      const sessions = await prisma.schedule.findMany({
        where: { classId: student.classId, status: 'IN_PROGRESS' },
        include: { teacher: { include: { user: true } } },
        orderBy: { startTime: 'desc' },
        take: 5,
      })
      return NextResponse.json({ sessions })
    }

    return NextResponse.json({ sessions: [] })
  } catch (error) {
    console.error('[GET_LIVE_SESSION]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST — teacher starts a new live session
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || session.user.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const teacher = await (prisma as any).teacher.findUnique({
      where: { userId: session.user.id },
      include: { classes: true },
    })
    if (!teacher) return NextResponse.json({ error: 'Teacher not found' }, { status: 404 })

    const { title, classId, subject, description } = await request.json()

    const now = new Date()
    const end = new Date(now.getTime() + 60 * 60 * 1000) // 1 hour default

    const liveSession = await prisma.schedule.create({
      data: {
        schoolId:    teacher.schoolId || '',
        teacherId:   teacher.id,
        classId:     classId || teacher.classes[0]?.id || null,
        title:       title || 'Live Class',
        description: description || '',
        subject:     subject || '',
        startTime:   now,
        endTime:     end,
        type:        'CLASS',
        status:      'IN_PROGRESS',
        metadata: {
          boardContent: '',    // whiteboard JSON
          chat: [],            // [{ userId, name, message, ts }]
          participants: [],    // [{ userId, name, joinedAt }]
          startedAt: now.toISOString(),
          sessionCode: Math.random().toString(36).substring(2, 8).toUpperCase(),
        },
      },
      include: { class: true },
    })

    return NextResponse.json({ session: liveSession })
  } catch (error) {
    console.error('[POST_LIVE_SESSION]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH — update session state (board, chat, end session)
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { sessionId, action, data } = await request.json()

    const existing = await prisma.schedule.findUnique({ where: { id: sessionId } })
    if (!existing) return NextResponse.json({ error: 'Session not found' }, { status: 404 })

    const meta = (existing.metadata as any) || {}

    if (action === 'end') {
      const updated = await prisma.schedule.update({
        where: { id: sessionId },
        data: { status: 'COMPLETED', endTime: new Date() },
      })
      return NextResponse.json({ session: updated })
    }

    if (action === 'updateBoard') {
      meta.boardContent = data.boardContent
    }

    if (action === 'addChat') {
      if (!meta.chat) meta.chat = []
      meta.chat.push({ ...data, ts: new Date().toISOString() })
      if (meta.chat.length > 200) meta.chat = meta.chat.slice(-200)
    }

    if (action === 'join') {
      if (!meta.participants) meta.participants = []
      const already = meta.participants.find((p: any) => p.userId === data.userId)
      if (!already) meta.participants.push({ userId: data.userId, name: data.name, joinedAt: new Date().toISOString() })
    }

    const updated = await prisma.schedule.update({
      where: { id: sessionId },
      data: { metadata: meta },
    })
    return NextResponse.json({ session: updated })
  } catch (error) {
    console.error('[PATCH_LIVE_SESSION]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
