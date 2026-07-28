// ──────────────────────────────────────────────────────────────
// Health check endpoint — used by Vercel Cron, k6 load tests,
// and external uptime monitors. Returns 200 if DB + cache are
// healthy, 503 if degraded.
// ──────────────────────────────────────────────────────────────

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { cache } from '@/lib/redis'

export const dynamic = 'force-dynamic'

export async function GET() {
  const checks: Record<string, string> = {}
  let healthy = true

  // Database check
  try {
    await prisma.$queryRaw`SELECT 1`
    checks.database = 'ok'
  } catch (e) {
    checks.database = 'error'
    healthy = false
  }

  // Redis/cache check
  try {
    await cache.ping()
    checks.cache = 'ok'
  } catch {
    checks.cache = 'unavailable'
  }

  const status = healthy ? 200 : 503
  return NextResponse.json({
    status: healthy ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    checks,
  }, { status })
}
