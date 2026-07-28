import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sseBus } from '@/lib/sse-events'
import { route } from '@/lib/api-middleware'
import { addMessage, getMessages } from '@/lib/meeting-chat-store'
import type { ChatMessage } from '@/lib/meeting-chat-store'

async function canAccessMeeting(userId: string, role: string, meetingId: string): Promise<boolean> {
  const meeting = await prisma.meeting.findUnique({ where: { id: meetingId }, select: { schoolId: true, createdBy: true } })
  if (!meeting) return false
  if (meeting.createdBy === userId) return true

  if (role === 'TEACHER') {
    const teacher = await prisma.teacher.findUnique({ where: { userId }, select: { schoolId: true } })
    return teacher !== null && meeting.schoolId === teacher.schoolId
  }
  if (role === 'PARENT') {
    const parent = await prisma.parent.findUnique({
      where: { userId },
      include: { students: { include: { student: { select: { schoolId: true } } } } },
    })
    if (!parent) return false
    return parent.students.some(ps => ps.student.schoolId === meeting.schoolId)
  }
  if (role === 'SCHOOL_ADMIN') {
    const admin = await prisma.schoolAdmin.findUnique({ where: { userId }, select: { schoolId: true } })
    return admin !== null && meeting.schoolId === admin.schoolId
  }
  return false
}

export const GET = route({ auth: 'TEACHER' }, async (req, { user, params }) => {
  const { id } = params

  const allowed = await canAccessMeeting(user.id, user.role, id)
  if (!allowed) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 })
  }

  return NextResponse.json({ messages: getMessages(id) })
})

export const POST = route({ auth: 'TEACHER' }, async (req, { user, params }) => {
  const { id } = params

  const allowed = await canAccessMeeting(user.id, user.role, id)
  if (!allowed) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 })
  }

  const body = await req.json()
  const { content } = body
  if (!content?.trim()) {
    return NextResponse.json({ error: 'Content is required' }, { status: 400 })
  }

  const timestamp = new Date().toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  })

  const senderType: 'teacher' | 'student' = user.role === 'TEACHER' ? 'teacher' : 'student'

  const message = {
    id: crypto.randomUUID(),
    senderId: user.id,
    senderName: (user as any).firstName
      ? `${(user as any).firstName} ${(user as any).lastName || ''}`.trim()
      : 'You',
    senderType,
    content: content.trim(),
    timestamp,
  } as ChatMessage

  addMessage(id, message)

  sseBus.publish(`meeting:${id}`, 'chat-message', message)

  return NextResponse.json({ success: true, message })
})
