import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { route } from '@/lib/api-middleware'

export const GET = route({}, async (req, { user }) => {
  try {
    const { searchParams } = new URL(req.url)
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50)

    const sessions = await prisma.aITutorSession.findMany({
      where: { studentId: user.id },
      select: { question: true, response: true, createdAt: true }
    })

    const messages: Array<{ role: string; content: string; id: string }> = []
    for (const s of sessions.slice(-limit)) {
      if (s.question) messages.push({ id: s.createdAt?.getTime().toString() || '', role: 'user', content: s.question })
      if (s.response) messages.push({ id: (s.createdAt?.getTime() + 1).toString() || '', role: 'assistant', content: s.response })
    }

    return NextResponse.json({ messages })
  } catch (e) {
    return NextResponse.json({ messages: [] })
  }
})
