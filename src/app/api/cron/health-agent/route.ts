import { NextResponse } from 'next/server'
import { route } from '@/lib/api-middleware'
import { runHealthCheck } from '@/lib/incident-service'

export const dynamic = 'force-dynamic'

export const GET = route({ auth: 'none' }, async () => {
  const summary = await runHealthCheck()
  return NextResponse.json({ ok: true, ...summary })
})
