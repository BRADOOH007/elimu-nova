import { NextResponse } from 'next/server'
import { route } from '@/lib/api-middleware'

export const POST = route({ auth: 'none' }, async (req) => {
  try {
    const payload = await req.json()
    console.error('[CLIENT_ERROR]', JSON.stringify(payload, null, 2))
  } catch (error) {
    console.error('[CLIENT_ERROR_PARSE_FAILED]', error)
  }

  return NextResponse.json({ ok: true })
})
