import { NextResponse } from 'next/server'
import { runAdaptiveMaintenance } from '@/lib/mastery-engine'
import { route } from '@/lib/api-middleware'

export const dynamic = 'force-dynamic'

// Daily adaptive maintenance: applies forgetting-curve decay, recomputes
// mastery levels, and bootstraps spaced-repetition schedules for any active
// topic that has none. Callable via cron / manual trigger.
export const GET = route({ auth: 'none' }, async () => {
  try {
    const stats = await runAdaptiveMaintenance()
    return NextResponse.json({ ok: true, ...stats })
  } catch (error) {
    console.error('[cron/adaptive-learning] failed:', error)
    return NextResponse.json({ ok: false, error: 'maintenance failed' }, { status: 500 })
  }
})
