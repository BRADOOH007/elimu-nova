/**
 * Stripe client — keys loaded from:
 *   1. Database (SystemSettings table) — set by super admin via dashboard
 *   2. Environment variables — fallback for local dev
 *
 * Never throws at build/import time — only at runtime when actually used.
 */

import Stripe from 'stripe'

let _stripe: Stripe | null = null
let _secretKey: string | null = null

/**
 * Load Stripe secret key — checks DB first, then env var.
 * Called lazily so build never fails.
 */
async function loadSecretKey(): Promise<string> {
  // Try DB first (set by super admin)
  try {
    const { prisma } = await import('@/lib/prisma')
    const setting = await (prisma as any).systemSettings.findUnique({
      where: { key: 'stripe_secret_key' },
    })
    if (setting?.value) return setting.value
  } catch { /* DB not ready yet — fall through */ }

  // Fallback to env var
  const envKey = process.env.STRIPE_SECRET_KEY
  if (envKey && envKey !== 'sk_test_placeholder') return envKey

  throw new Error('Stripe secret key not configured. Set it in Super Admin → Stripe Configuration.')
}

/**
 * Load publishable key for client-side use.
 */
export async function getPublishableKey(): Promise<string> {
  try {
    const { prisma } = await import('@/lib/prisma')
    const setting = await (prisma as any).systemSettings.findUnique({
      where: { key: 'stripe_publishable_key' },
    })
    if (setting?.value) return setting.value
  } catch { /* fall through */ }

  const envKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  if (envKey && envKey !== 'pk_test_placeholder') return envKey

  throw new Error('Stripe publishable key not configured.')
}

/**
 * Load webhook secret.
 */
export async function getWebhookSecret(): Promise<string> {
  try {
    const { prisma } = await import('@/lib/prisma')
    const setting = await (prisma as any).systemSettings.findUnique({
      where: { key: 'stripe_webhook_secret' },
    })
    if (setting?.value) return setting.value
  } catch { /* fall through */ }

  const envKey = process.env.STRIPE_WEBHOOK_SECRET
  if (envKey && envKey !== 'whsec_placeholder') return envKey

  throw new Error('Stripe webhook secret not configured.')
}

/**
 * Get (or lazily create) the Stripe client.
 */
export async function getStripeAsync(): Promise<Stripe> {
  const key = await loadSecretKey()

  // Re-create client if key changed
  if (_stripe && key === _secretKey) return _stripe

  _secretKey = key
  _stripe = new Stripe(key, {
    apiVersion: '2024-11-20.acacia' as any,
    typescript: true,
  })
  return _stripe
}

/**
 * Synchronous getter — uses cached client.
 * Call getStripeAsync() first to warm the cache.
 */
export function getStripe(): Stripe {
  if (!_stripe) {
    // Synchronous fallback using env var only (for webhook handler)
    const key = process.env.STRIPE_SECRET_KEY
    if (!key || key === 'sk_test_placeholder') {
      throw new Error('Stripe not initialised. Call getStripeAsync() first or set STRIPE_SECRET_KEY.')
    }
    _stripe = new Stripe(key, { apiVersion: '2024-11-20.acacia' as any, typescript: true })
    _secretKey = key
  }
  return _stripe
}

/**
 * Reset cached client — called after super admin updates keys.
 */
export function resetStripe(): void {
  _stripe    = null
  _secretKey = null
}

/**
 * Backwards-compatible proxy export.
 * Routes all property accesses through the sync getter.
 */
export const stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    return (getStripe() as any)[prop]
  },
})

// Legacy helper
export const getStripePublishableKey = () => {
  const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  if (!key) throw new Error('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not set')
  return key
}
