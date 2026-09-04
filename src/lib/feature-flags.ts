import { prisma } from '@/lib/prisma'
import { cache } from '@/lib/redis'

/**
 * Feature flags — lightweight, DB-backed configuration read from
 * system_settings (category 'feature'). Safe default OFF unless explicitly
 * enabled, so a missing flag never activates an unreleased feature.
 *
 * Super admins set a flag via the System Settings panel with key
 * `feature.<name>` and value "true"/"false".
 */

const CACHE_TTL = 300 // 5 min
const PREFIX = 'feature:'

function flagKey(name: string): string {
  return `${PREFIX}${name}`
}

async function readFlagFromDb(name: string): Promise<boolean> {
  try {
    const row = await prisma.systemSettings.findUnique({ where: { key: flagKey(name) } })
    if (!row) return false
    const v = (row.value || '').toLowerCase()
    return v === 'true' || v === '1' || v === 'on' || v === 'yes'
  } catch {
    return false
  }
}

/** Get a feature flag (default false). Cached for 5 min; fails safe to false. */
export async function isFeatureEnabled(name: string): Promise<boolean> {
  const key = `feature:${name}`
  try {
    const cached = await cache.get(key)
    if (cached !== null) return cached === 'true'
  } catch { /* Redis unavailable — read DB directly */ }

  const enabled = await readFlagFromDb(name)
  try { await cache.set(key, enabled ? 'true' : 'false', CACHE_TTL) } catch { /* ignore */ }
  return enabled
}

/** Force the cache for a flag to refresh (call after an admin toggles it). */
export async function invalidateFeatureFlag(name: string): Promise<void> {
  try { await cache.del(`feature:${name}`) } catch { /* ignore */ }
}
