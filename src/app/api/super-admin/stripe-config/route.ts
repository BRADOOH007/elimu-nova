import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const STRIPE_KEYS = [
  'stripe_secret_key',
  'stripe_publishable_key',
  'stripe_webhook_secret',
  'stripe_mode', // 'test' | 'live'
]

async function requireSuperAdmin() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id || session.user.role !== 'SUPER_ADMIN') return null
  return session
}

export async function GET() {
  try {
    const session = await requireSuperAdmin()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const settings = await (prisma as any).systemSettings.findMany({
      where: { key: { in: STRIPE_KEYS } },
    })

    const config: Record<string, string> = {}
    settings.forEach((s: any) => {
      // Mask secret keys — show last 4 chars only
      if (s.key === 'stripe_secret_key' && s.value) {
        config[s.key] = '••••••••••••••••' + s.value.slice(-4)
      } else if (s.key === 'stripe_webhook_secret' && s.value) {
        config[s.key] = '••••••••' + s.value.slice(-4)
      } else {
        config[s.key] = s.value || ''
      }
    })

    // Check if Stripe is configured
    const secretSetting = settings.find((s: any) => s.key === 'stripe_secret_key')
    const isConfigured = !!(secretSetting?.value)
    const mode = settings.find((s: any) => s.key === 'stripe_mode')?.value || 'test'

    return NextResponse.json({ config, isConfigured, mode })
  } catch (error) {
    console.error('[GET_STRIPE_CONFIG]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireSuperAdmin()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { stripe_secret_key, stripe_publishable_key, stripe_webhook_secret, stripe_mode } = await request.json()

    const updates: Record<string, string> = {}
    if (stripe_secret_key     && !stripe_secret_key.includes('•'))     updates.stripe_secret_key     = stripe_secret_key
    if (stripe_publishable_key && !stripe_publishable_key.includes('•')) updates.stripe_publishable_key = stripe_publishable_key
    if (stripe_webhook_secret  && !stripe_webhook_secret.includes('•'))  updates.stripe_webhook_secret  = stripe_webhook_secret
    if (stripe_mode) updates.stripe_mode = stripe_mode

    for (const [key, value] of Object.entries(updates)) {
      await (prisma as any).systemSettings.upsert({
        where:  { key },
        update: { value, updatedBy: session.user.id },
        create: {
          key,
          value,
          type:        'string',
          category:    'payment',
          description: `Stripe configuration: ${key}`,
          isPublic:    key === 'stripe_publishable_key',
          updatedBy:   session.user.id,
        },
      })
    }

    // Invalidate the cached Stripe client so it reloads with new keys
    const { resetStripe } = await import('@/lib/stripe')
    resetStripe()

    return NextResponse.json({ success: true, updated: Object.keys(updates) })
  } catch (error) {
    console.error('[POST_STRIPE_CONFIG]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Test the Stripe connection with stored keys
export async function PUT() {
  try {
    const session = await requireSuperAdmin()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { getStripe } = await import('@/lib/stripe')
    const stripe = getStripe()

    // Simple test — list first payment method
    const balance = await stripe.balance.retrieve()
    return NextResponse.json({
      success: true,
      mode:    balance.livemode ? 'live' : 'test',
      message: `Connected successfully in ${balance.livemode ? 'LIVE' : 'TEST'} mode`,
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 })
  }
}
