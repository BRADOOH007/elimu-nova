import { NextResponse } from 'next/server'
import { route } from '@/lib/api-middleware'
import { trackStudySession } from '@/lib/telemetry'

export const POST = route({}, async (req, { user }) => {
  try {
    const { subject, topic, durationSeconds } = await req.json()
    if (!durationSeconds || durationSeconds < 1) {
      return NextResponse.json({ ok: true })
    }
    await trackStudySession({
      userId: user.id,
      subject,
      topic,
      durationSeconds: Math.min(durationSeconds, 300),
    })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: true })
  }
})
