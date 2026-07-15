import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { sseBus } from '@/lib/sse-events'
import { addMessage, getMessages } from '@/lib/meeting-chat-store'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { id } = await params
  return NextResponse.json({ messages: getMessages(id) })
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { id } = await params
  const body = await request.json()
  const { content } = body
  if (!content?.trim()) {
    return NextResponse.json({ error: 'Content is required' }, { status: 400 })
  }

  const timestamp = new Date().toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  })

  const senderType = session.user.role === 'TEACHER' ? 'teacher' : 'student'

  const message = {
    id: crypto.randomUUID(),
    senderId: session.user.id,
    senderName: session.user.firstName
      ? `${session.user.firstName} ${session.user.lastName || ''}`.trim()
      : 'You',
    senderType,
    content: content.trim(),
    timestamp,
  }

  addMessage(id, message)

  sseBus.publish(`meeting:${id}`, 'chat-message', message)

  return NextResponse.json({ success: true, message })
}
