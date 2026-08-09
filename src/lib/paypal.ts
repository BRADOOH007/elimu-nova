/**
 * PayPal Orders v2 REST API — standalone PayPal integration.
 *
 * Credentials loaded from:
 *   1. Database (SystemSettings table) — set by super admin via dashboard
 *   2. Environment variables — fallback for local dev
 *
 * Never throws at build/import time — only at runtime when actually used.
 */

const SANDBOX_BASE = 'https://api-m.sandbox.paypal.com'
const PRODUCTION_BASE = 'https://api-m.paypal.com'

interface PayPalConfig {
  clientId: string
  clientSecret: string
  environment: 'sandbox' | 'live'
}

interface PayPalOrder {
  id: string
  status: string
  links?: Array<{ rel: string; href: string; method?: string }>
}

interface PayPalCaptureResult {
  id: string
  status: string
  captureId?: string
  amount?: number
  currency?: string
}

async function loadConfig(): Promise<PayPalConfig> {
  try {
    const { prisma } = await import('@/lib/prisma')
    const { decryptPassword } = await import('./password-encryption')
    const [cid, csec, env] = await Promise.all([
      prisma.systemSettings.findUnique({ where: { key: 'paypal_client_id' } }),
      prisma.systemSettings.findUnique({ where: { key: 'paypal_client_secret' } }),
      prisma.systemSettings.findUnique({ where: { key: 'paypal_environment' } }),
    ])

    const decrypt = (val: string | undefined) => val ? (decryptPassword(val) || val) : ''

    const config: PayPalConfig = {
      clientId: decrypt(cid?.value) || process.env.PAYPAL_CLIENT_ID || '',
      clientSecret: decrypt(csec?.value) || process.env.PAYPAL_CLIENT_SECRET || '',
      environment: (env?.value || process.env.PAYPAL_ENVIRONMENT || 'sandbox') as 'sandbox' | 'live',
    }

    if (!config.clientId || !config.clientSecret) {
      throw new Error('PayPal not configured. Set credentials in Super Admin → Billing → PayPal Config.')
    }

    return config
  } catch (err) {
    if (err instanceof Error && err.message.includes('PayPal not configured')) throw err
    console.warn('[PayPal] DB load config failed, falling back to env:', err)
    const config: PayPalConfig = {
      clientId: process.env.PAYPAL_CLIENT_ID || '',
      clientSecret: process.env.PAYPAL_CLIENT_SECRET || '',
      environment: (process.env.PAYPAL_ENVIRONMENT || 'sandbox') as 'sandbox' | 'live',
    }
    if (!config.clientId || !config.clientSecret) {
      throw new Error('PayPal not configured. Set PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET.')
    }
    return config
  }
}

function getBaseUrl(env: PayPalConfig['environment']): string {
  return env === 'live' ? PRODUCTION_BASE : SANDBOX_BASE
}

let _tokenCache: { token: string; expiresAt: number } | null = null

/**
 * Fetch an OAuth2 access token (client_credentials). Cached until expiry.
 */
export async function getAccessToken(): Promise<string> {
  const config = await loadConfig()

  if (_tokenCache && _tokenCache.expiresAt > Date.now() + 30_000) {
    return _tokenCache.token
  }

  const auth = Buffer.from(`${config.clientId}:${config.clientSecret}`).toString('base64')
  const res = await fetch(`${getBaseUrl(config.environment)}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`PayPal auth failed (${res.status}): ${text}`)
  }

  const data = await res.json()
  if (!data.access_token) {
    throw new Error(`PayPal auth failed: ${JSON.stringify(data)}`)
  }

  _tokenCache = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in || 3600) * 1000,
  }
  return _tokenCache.token
}

export interface CreateOrderInput {
  amount: number
  currency: string
  description: string
  returnUrl: string
  cancelUrl: string
  customId?: string
}

/**
 * Create a PayPal order with intent CAPTURE. Returns the order id plus the
 * approval URL the user should be redirected to.
 */
export async function createOrder(input: CreateOrderInput): Promise<{ orderId: string; approvalUrl: string }> {
  const config = await loadConfig()
  const token = await getAccessToken()

  const body = {
    intent: 'CAPTURE',
    purchase_units: [
      {
        reference_id: input.customId || input.description,
        description: input.description.slice(0, 127),
        amount: {
          currency_code: input.currency.toUpperCase(),
          value: input.amount.toFixed(2),
        },
      },
    ],
    application_context: {
      brand_name: 'ElimuNova',
      user_action: 'PAY_NOW',
      return_url: input.returnUrl,
      cancel_url: input.cancelUrl,
      shipping_preference: 'NO_SHIPPING',
    },
  }

  const res = await fetch(`${getBaseUrl(config.environment)}/v2/checkout/orders`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`PayPal create order failed (${res.status}): ${text}`)
  }

  const data = (await res.json()) as PayPalOrder
  const approveLink = data.links?.find(l => l.rel === 'approve')?.href

  if (!data.id || !approveLink) {
    throw new Error(`PayPal order creation failed: ${JSON.stringify(data)}`)
  }

  return { orderId: data.id, approvalUrl: approveLink }
}

/**
 * Capture an approved PayPal order. Returns capture details on success.
 */
export async function captureOrder(orderId: string): Promise<PayPalCaptureResult> {
  const config = await loadConfig()
  const token = await getAccessToken()

  const res = await fetch(`${getBaseUrl(config.environment)}/v2/checkout/orders/${orderId}/capture`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`PayPal capture failed (${res.status}): ${text}`)
  }

  const data = await res.json()

  const capture = data?.purchase_units?.[0]?.payments?.captures?.[0]
  const amount = capture?.amount?.value

  return {
    id: data.id,
    status: data.status,
    captureId: capture?.id,
    amount: amount ? parseFloat(amount) : undefined,
    currency: capture?.amount?.currency_code,
  }
}

/**
 * Test PayPal configuration by fetching an access token.
 */
export async function testConnection(): Promise<{ success: boolean; message: string }> {
  try {
    const config = await loadConfig()
    const token = await getAccessToken()
    if (token) {
      return { success: true, message: `Connected to PayPal ${config.environment} environment successfully` }
    }
    return { success: false, message: 'Failed to obtain access token' }
  } catch (err) {
    return { success: false, message: err instanceof Error ? err.message : 'Connection failed' }
  }
}
