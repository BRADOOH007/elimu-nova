import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { route } from '@/lib/api-middleware'

// We store live sessions in the Schedule table (type=CLASS, status=IN_PROGRESS)
// and use metadata JSON for session state (board content, chat, participants)

export const GET = route({ skipSubscriptionCheck: true }, async (req, { user }) => {

    const { searchParams } = new URL(req.url)
    const sessionId = searchParams.get('sessionId')
    const role = user.role
    const now = new Date()

    // Auto-expire stale IN_PROGRESS sessions past endTime
    await prisma.schedule.updateMany({
      where: { status: 'IN_PROGRESS', endTime: { lt: now } },
      data: { status: 'COMPLETED' },
    })

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
      const teacher = await prisma.teacher.findUnique({ where: { userId: user.id } })
      if (!teacher) return NextResponse.json({ error: 'Teacher not found' }, { status: 404 })

      const sessions = await prisma.schedule.findMany({
        where: { teacherId: teacher.id, type: 'CLASS', status: { in: ['SCHEDULED', 'IN_PROGRESS'] } },
        include: { class: true },
        orderBy: { startTime: 'desc' },
        take: 20,
      })
      return NextResponse.json({ sessions })
    }

    // For students: get their class's active session (plus open sessions)
    if (role === 'STUDENT') {
      const student = await prisma.student.findUnique({
        where: { userId: user.id },
        select: { id: true, classId: true, teacherId: true, schoolId: true }
      })
      if (!student) return NextResponse.json({ sessions: [] })

      const sessions = await prisma.schedule.findMany({
        where: {
          type: 'CLASS',
          status: { in: ['SCHEDULED', 'IN_PROGRESS'] },
          OR: [
            ...(student.classId ? [{ classId: student.classId, schoolId: student.schoolId || undefined }] : []),
            { classId: null, schoolId: student.schoolId || undefined },
            ...(student.teacherId ? [{ teacherId: student.teacherId, schoolId: student.schoolId || undefined }] : []),
          ],
        },
        include: { teacher: { include: { user: true } }, class: true },
        orderBy: { startTime: 'desc' },
        take: 20,
      })
      return NextResponse.json({ sessions })
    }

    // Senior students: see live sessions targeted at adult learners
    if (role === 'SENIOR_STUDENT') {
      const sessions = await prisma.schedule.findMany({
        where: {
          type: 'CLASS',
          status: { in: ['SCHEDULED', 'IN_PROGRESS'] },
          audience: 'ADULT',
        },
        include: { teacher: { include: { user: true } }, seniorTeacher: { include: { user: true } }, class: true },
        orderBy: { startTime: 'desc' },
        take: 20,
      })
      return NextResponse.json({ sessions })
    }

    // Senior teachers: see their own adult live sessions
    if (role === 'SENIOR_TEACHER') {
      const seniorTeacher = await prisma.seniorTeacher.findUnique({ where: { userId: user.id } })
      if (!seniorTeacher) return NextResponse.json({ sessions: [] })
      const sessions = await prisma.schedule.findMany({
        where: {
          seniorTeacherId: seniorTeacher.id,
          type: 'CLASS',
          status: { in: ['SCHEDULED', 'IN_PROGRESS'] },
        },
        orderBy: { startTime: 'desc' },
        take: 20,
      })
      return NextResponse.json({ sessions })
    }

    return NextResponse.json({ sessions: [] })
})

// POST — teacher or senior teacher starts a new live session
export const POST = route({ auth: ['TEACHER', 'SENIOR_TEACHER'], skipSubscriptionCheck: true }, async (req, { user }) => {

    const { title, classId, subject, description, meetingLink, audience } = await req.json()

    const now = new Date()
    const end = new Date(now.getTime() + 60 * 60 * 1000) // 1 hour default

    // Auto-generate a Jitsi Meet link if none provided (no account needed)
    const sessionCode = Math.random().toString(36).substring(2, 8).toUpperCase()
    let finalMeetingLink = meetingLink || ''
    if (!finalMeetingLink) {
      const slug = `${title || 'LiveClass'}-${sessionCode}`.replace(/[^a-zA-Z0-9-]/g, '').slice(0, 40)
      finalMeetingLink = `https://meet.jit.si/${slug}`
    }

    // Senior teacher → always an adult (GED) session, no school/class
    if (user.role === 'SENIOR_TEACHER') {
      const seniorTeacher = await prisma.seniorTeacher.findUnique({ where: { userId: user.id } })
      if (!seniorTeacher) return NextResponse.json({ error: 'Senior teacher not found' }, { status: 404 })

      const liveSession = await prisma.schedule.create({
        data: {
          schoolId: null,
          teacherId: null,
          seniorTeacherId: seniorTeacher.id,
          classId: null,
          audience: 'ADULT',
          title: title || 'Live Lesson',
          description: description || '',
          subject: subject || '',
          startTime: now,
          endTime: end,
          type: 'CLASS',
          status: 'IN_PROGRESS',
          metadata: {
            boardContent: '',
            chat: [],
            participants: [],
            startedAt: now.toISOString(),
            sessionCode,
            meetingLink: finalMeetingLink,
          },
        },
      })
      return NextResponse.json({ session: liveSession })
    }

    const teacher = await prisma.teacher.findUnique({
      where: { userId: user.id },
      include: { classes: true },
    })
    if (!teacher) return NextResponse.json({ error: 'Teacher not found' }, { status: 404 })

    const isAdult = audience === 'ADULT'
    const liveSession = await prisma.schedule.create({
      data: {
        schoolId:    isAdult ? null : (teacher.schoolId || null),
        teacherId:   teacher.id,
        classId:     isAdult ? null : (classId || teacher.classes[0]?.id || null),
        audience:    isAdult ? 'ADULT' : 'K12',
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
          sessionCode,
          meetingLink: finalMeetingLink,
        },
      },
      include: { class: true },
    })

    return NextResponse.json({ session: liveSession })
})

// PATCH — update session state (board, chat, end session)
export const PATCH = route({ skipSubscriptionCheck: true }, async (req, { user }) => {

    const { sessionId, action, data } = await req.json()

    const existing = await prisma.schedule.findUnique({ where: { id: sessionId } })
    if (!existing) return NextResponse.json({ error: 'Session not found' }, { status: 404 })

    const meta = (existing.metadata as any) || {}

    if (action === 'end') {
      await prisma.schedule.update({
        where: { id: sessionId },
        data: { status: 'COMPLETED', endTime: new Date(), metadata: { ...meta, endedAt: new Date().toISOString() } },
      })
      return NextResponse.json({ session: { status: 'COMPLETED' } })
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

    if (action === 'raiseHand') {
      if (!meta.participants) meta.participants = []
      const p = meta.participants.find((p: any) => p.userId === data.userId)
      if (p) p.handRaised = true
      else meta.participants.push({ userId: data.userId, name: data.name, joinedAt: new Date().toISOString(), handRaised: true })
    }

    if (action === 'lowerHand') {
      if (meta.participants) {
        const p = meta.participants.find((p: any) => p.userId === data.userId)
        if (p) p.handRaised = false
      }
    }

    // Board strokes are ephemeral — never persisted to DB

    const updated = await prisma.schedule.update({
      where: { id: sessionId },
      data: { metadata: meta },
    })
    return NextResponse.json({ session: updated })
})
