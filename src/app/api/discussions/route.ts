import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { checkRateLimit, getClientIdentifier } from '@/lib/rate-limit'
import { route } from '@/lib/api-middleware'
import { filterProfanity } from '@/lib/profanity-filter'

export const GET = route({}, async (req, { user }) => {
  const { searchParams } = new URL(req.url)
  const classId = searchParams.get('classId')
  const status  = searchParams.get('status') || 'all'

  const whereClause: any = {
    subject: { startsWith: 'DISCUSSION:' },
  }

  if (classId) {
    const [classStudents, classTeachers] = await Promise.all([
      prisma.student.findMany({ where: { classId }, select: { id: true } }),
      prisma.teacher.findMany({ where: { classes: { some: { id: classId } } }, select: { id: true } }),
    ])
    const ids = [...classStudents.map(s => s.id), ...classTeachers.map(t => t.id)]
    whereClause.senderId = { in: ids }
  }

  if (status === 'pending')  whereClause.isRead = false
  if (status === 'approved') whereClause.isRead = true

  const messages = await prisma.message.findMany({
    where: whereClause,
    orderBy: { createdAt: 'desc' },
    take: 100,
  })

  const studentIds = [...new Set(messages.filter(m => m.senderType === 'STUDENT').map(m => m.senderId))]
  const teacherIds = [...new Set(messages.filter(m => m.senderType === 'TEACHER').map(m => m.senderId))]
  const [students, teachers] = await Promise.all([
    studentIds.length > 0
      ? prisma.student.findMany({ where: { id: { in: studentIds } }, include: { user: { select: { firstName: true, lastName: true } } } })
      : Promise.resolve([]),
    teacherIds.length > 0
      ? prisma.teacher.findMany({ where: { id: { in: teacherIds } }, include: { user: { select: { firstName: true, lastName: true } } } })
      : Promise.resolve([]),
  ])
  const studentMap = new Map((students as any[]).map((s: any) => [s.id, `${s.user.firstName} ${s.user.lastName}`]))
  const teacherMap = new Map((teachers as any[]).map((t: any) => [t.id, `${t.user.firstName} ${t.user.lastName}`]))

  const enriched = messages.map((m: any) => ({
    id:         m.id,
    topic:      m.subject.replace('DISCUSSION:', '').trim(),
    message:    m.content,
    senderName: m.senderType === 'STUDENT' ? (studentMap.get(m.senderId) || 'Unknown') : (teacherMap.get(m.senderId) || 'Unknown'),
    senderRole: m.senderType,
    senderId:   m.senderId,
    status:     m.isRead ? 'approved' : 'pending',
    readAt:     m.readAt,
    createdAt:  m.createdAt,
    attachments: m.attachments,
  }))

  return NextResponse.json({ discussions: enriched })
})

export const POST = route({}, async (req, { user }) => {
  const rl = await checkRateLimit(`discuss:${getClientIdentifier(req)}`, { maxRequests: 20, windowMs: 60000, keyPrefix: 'ratelimit:discuss' })
  if (!rl.allowed) {
    return NextResponse.json({ error: 'Too many messages. Try again later.' }, { status: 429 })
  }

  const { topic, message, recipientId, recipientType = 'TEACHER' } = await req.json()
  if (!topic || !message) return NextResponse.json({ error: 'Topic and message required' }, { status: 400 })

  const sanitized = filterProfanity(message)
  if (sanitized.flagged) {
    console.warn(`[Discussions] Profanity filtered for user ${user.id}:`, sanitized.words)
  }

  let senderId  = ''
  let senderType: 'STUDENT' | 'TEACHER' = 'STUDENT'

  if (user.role === 'STUDENT') {
    const s = await prisma.student.findUnique({ where: { userId: user.id } })
    senderId  = s?.id || ''
    senderType = 'STUDENT'
  } else if (user.role === 'TEACHER') {
    const t = await prisma.teacher.findUnique({ where: { userId: user.id } })
    senderId  = t?.id || ''
    senderType = 'TEACHER'
  }

  if (!senderId) return NextResponse.json({ error: 'Sender not found' }, { status: 404 })

  const msg = await prisma.message.create({
    data: {
      subject:       `DISCUSSION: ${topic}`,
      content:       sanitized.filtered,
      senderId,
      senderType,
      recipientId:   recipientId || senderId,
      recipientType: recipientType,
      isRead:        sanitized.flagged ? false : true,
      attachments:   [],
    },
  })

  return NextResponse.json({
    discussion: {
      id: msg.id,
      status: msg.isRead ? 'approved' : 'pending',
      flagged: sanitized.flagged,
    },
  }, { status: 201 })
})

export const PATCH = route({ auth: 'TEACHER' }, async (req, { user }) => {
  const { messageId, action } = await req.json()

  const updated = await prisma.message.update({
    where: { id: messageId },
    data: {
      isRead:  action === 'approve',
      readAt:  action === 'approve' ? new Date() : null,
      ...(action === 'reject' ? { subject: `REJECTED:${(await prisma.message.findUnique({ where: { id: messageId } }))?.subject}` } : {}),
    },
  })

  return NextResponse.json({ success: true, status: action === 'approve' ? 'approved' : 'rejected' })
})
