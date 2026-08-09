import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { route } from '@/lib/api-middleware'

export const GET = route({ auth: 'STUDENT' }, async (_req, { user }) => {
  const notes = await (prisma as any).studentNote.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    take: 20,
    select: { id: true, subject: true, topic: true, content: true, createdAt: true },
  })
  return NextResponse.json({ notes })
})

export const POST = route({ auth: 'STUDENT' }, async (req, { user }) => {
  const { subject, topic, content } = await req.json()
  if (!content) return NextResponse.json({ error: 'Content required' }, { status: 400 })

  // Ensure the table exists — create via raw query if needed
  const note = await (prisma as any).studentNote.create({
    data: { userId: user.id, subject: subject || 'General', topic: topic || 'General', content },
  })

  return NextResponse.json({ id: note.id, message: 'Note saved' })
})
