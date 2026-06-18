import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json()
    console.error('[CLIENT_ERROR]', JSON.stringify(payload, null, 2))
  } catch (error) {
    console.error('[CLIENT_ERROR_PARSE_FAILED]', error)
  }

  return NextResponse.json({ ok: true })
}
