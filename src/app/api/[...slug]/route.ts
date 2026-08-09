import { NextRequest, NextResponse } from 'next/server'
import { recordApiLog } from '@/lib/incident-service'

export const dynamic = 'force-dynamic'

async function handler(request: NextRequest) {
  const path = request.nextUrl?.pathname || '/'
  const start = Date.now()
  recordApiLog({ method: request.method, path, status: 404, durationMs: Date.now() - start }).catch(() => {})
  return NextResponse.json({ error: 'Not found', code: 'NOT_FOUND' }, { status: 404 })
}

export const GET = handler
export const POST = handler
export const PUT = handler
export const PATCH = handler
export const DELETE = handler
export const OPTIONS = handler
