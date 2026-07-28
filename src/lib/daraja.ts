/**
 * Safaricom Daraja API v2 — M-Pesa integration service.
 *
 * Credentials loaded from:
 *   1. Database (SystemSettings table) — set by super admin via dashboard
 *   2. Environment variables — fallback for local dev
 *
 * Never throws at build/import time — only at runtime when actually used.
 */

const SANDBOX_BASE = 'https://sandbox.safaricom.co.ke'
const PRODUCTION_BASE = 'https://api.safaricom.co.ke'

interface MpesaConfig {
  consumerKey: string
  consumerSecret: string
  passkey: string
  shortcode: string
  environment: 'sandbox' | 'production'
}

interface StkPushResponse {
  MerchantRequestID: string
  CheckoutRequestID: string
  ResponseCode: string
  ResponseDescription: string
  CustomerMessage: string
}

interface StkQueryResponse {
  ResponseCode: string
  ResponseDescription: string
  MerchantRequestID: string
  CheckoutRequestID: string
  ResultCode: string
  ResultDesc: string
}

interface MpesaCallback {
  Body: {
    stkCallback: {
      MerchantRequestID: string
      CheckoutRequestID: string
      ResultCode: number
      ResultDesc: string
      CallbackMetadata?: {
        Item: Array<{
          Name: string
          Value?: string | number
        }>
      }
    }
  }
}

async function loadConfig(): Promise<MpesaConfig> {
  try {
    const { prisma } = await import('@/lib/prisma')
    const { decryptPassword } = await import('./password-encryption')
    const [ck, cs, pk, sc, env] = await Promise.all([
      (prisma as any).systemSettings.findUnique({ where: { key: 'mpesa_consumer_key' } }),
      (prisma as any).systemSettings.findUnique({ where: { key: 'mpesa_consumer_secret' } }),
      (prisma as any).systemSettings.findUnique({ where: { key: 'mpesa_passkey' } }),
      (prisma as any).systemSettings.findUnique({ where: { key: 'mpesa_shortcode' } }),
      (prisma as any).systemSettings.findUnique({ where: { key: 'mpesa_environment' } }),
    ])

    const decrypt = (val: string | undefined) => val ? (decryptPassword(val) || val) : ''

    const config: MpesaConfig = {
      consumerKey: decrypt(ck?.value) || process.env.MPESA_CONSUMER_KEY || '',
      consumerSecret: decrypt(cs?.value) || process.env.MPESA_CONSUMER_SECRET || '',
      passkey: decrypt(pk?.value) || process.env.MPESA_PASSKEY || '',
      shortcode: sc?.value || process.env.MPESA_SHORTCODE || '',
      environment: (env?.value || process.env.MPESA_ENVIRONMENT || 'sandbox') as 'sandbox' | 'production',
    }

    if (!config.consumerKey || !config.consumerSecret || !config.passkey || !config.shortcode) {
      throw new Error('M-Pesa not configured. Set credentials in Super Admin → Billing → M-Pesa Config.')
    }

    return config
  } catch (err) {
    if (err instanceof Error && err.message.includes('M-Pesa not configured')) throw err
    console.warn('[Daraja] DB load config failed, falling back to env:', err)
    // DB not ready — fall through to env
    const config: MpesaConfig = {
      consumerKey: process.env.MPESA_CONSUMER_KEY || '',
      consumerSecret: process.env.MPESA_CONSUMER_SECRET || '',
      passkey: process.env.MPESA_PASSKEY || '',
      shortcode: process.env.MPESA_SHORTCODE || '',
      environment: (process.env.MPESA_ENVIRONMENT || 'sandbox') as 'sandbox' | 'production',
    }
    if (!config.consumerKey || !config.consumerSecret || !config.passkey || !config.shortcode) {
      throw new Error('M-Pesa not configured. Set MPESA_* environment variables.')
    }
    return config
  }
}

function getBaseUrl(env: 'sandbox' | 'production'): string {
  return env === 'production' ? PRODUCTION_BASE : SANDBOX_BASE
}

async function getAuthToken(config: MpesaConfig): Promise<string> {
  const auth = Buffer.from(`${config.consumerKey}:${config.consumerSecret}`).toString('base64')
  const res = await fetch(`${getBaseUrl(config.environment)}/oauth/v1/generate?grant_type=client_credentials`, {
    method: 'GET',
    headers: { Authorization: `Basic ${auth}` },
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Daraja auth failed (${res.status}): ${text}`)
  }
  const data = await res.json()
  if (!data.access_token) {
    throw new Error(`Daraja auth failed: ${JSON.stringify(data)}`)
  }
  return data.access_token
}

function generatePassword(shortcode: string, passkey: string, timestamp: string): string {
  return Buffer.from(`${shortcode}${passkey}${timestamp}`).toString('base64')
}

function generateTimestamp(): string {
  const now = new Date()
  const y = now.getFullYear().toString()
  const m = (now.getMonth() + 1).toString().padStart(2, '0')
  const d = now.getDate().toString().padStart(2, '0')
  const h = now.getHours().toString().padStart(2, '0')
  const min = now.getMinutes().toString().padStart(2, '0')
  const s = now.getSeconds().toString().padStart(2, '0')
  return `${y}${m}${d}${h}${min}${s}`
}

/**
 * Initiate STK Push (Lipia Na M-Pesa Online).
 *
 * @param phone - Customer phone in 254XXXXXXXXX format
 * @param amount - Amount in KES
 * @param accountRef - Reference for the transaction (e.g. school name, subscription ID)
 * @param transactionDesc - Description shown to customer
 * @returns CheckoutRequestID for status queries
 */
export async function stkPush(
  phone: string,
  amount: number,
  accountRef: string,
  transactionDesc: string = 'Subscription Payment'
): Promise<{ MerchantRequestID: string; CheckoutRequestID: string }> {
  const config = await loadConfig()
  const token = await getAuthToken(config)
  const timestamp = generateTimestamp()
  const password = generatePassword(config.shortcode, config.passkey, timestamp)

  const callbackUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'https://elimunova.app'}/api/billing/mpesa/callback`

  const body = {
    BusinessShortCode: config.shortcode,
    Password: password,
    Timestamp: timestamp,
    TransactionType: 'CustomerPayBillOnline',
    Amount: Math.round(amount),
    PartyA: phone,
    PartyB: config.shortcode,
    PhoneNumber: phone,
    CallBackURL: callbackUrl,
    AccountReference: accountRef.slice(0, 12),
    TransactionDesc: transactionDesc.slice(0, 13),
  }

  const res = await fetch(`${getBaseUrl(config.environment)}/mpesa/stkpush/v1/processrequest`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`STK Push failed (${res.status}): ${text}`)
  }

  const data: StkPushResponse = await res.json()

  if (data.ResponseCode !== '0') {
    throw new Error(`STK Push rejected: ${data.ResponseDescription || data.CustomerMessage}`)
  }

  return {
    MerchantRequestID: data.MerchantRequestID,
    CheckoutRequestID: data.CheckoutRequestID,
  }
}

/**
 * Query STK Push transaction status.
 */
export async function queryStatus(checkoutRequestId: string): Promise<StkQueryResponse> {
  const config = await loadConfig()
  const token = await getAuthToken(config)
  const timestamp = generateTimestamp()
  const password = generatePassword(config.shortcode, config.passkey, timestamp)

  const body = {
    BusinessShortCode: config.shortcode,
    Password: password,
    Timestamp: timestamp,
    CheckoutRequestID: checkoutRequestId,
  }

  const res = await fetch(`${getBaseUrl(config.environment)}/mpesa/stkpushquery/v1/query`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`STK Query failed (${res.status}): ${text}`)
  }

  return res.json()
}

/**
 * Parse M-Pesa callback payload and extract payment details.
 * Returns null if the transaction failed.
 */
export function parseCallback(body: MpesaCallback): {
  success: boolean
  checkoutRequestId: string
  resultCode: number
  resultDesc: string
  amount?: number
  mpesaReceiptNumber?: string
  phoneNumber?: string
  transactionDate?: string
} | null {
  if (!body?.Body?.stkCallback) return null

  const { stkCallback } = body.Body
  const metadata: Record<string, string | number> = {}

  if (stkCallback.CallbackMetadata?.Item) {
    for (const item of stkCallback.CallbackMetadata.Item) {
      metadata[item.Name] = item.Value ?? ''
    }
  }

  return {
    success: stkCallback.ResultCode === 0,
    checkoutRequestId: stkCallback.CheckoutRequestID,
    resultCode: stkCallback.ResultCode,
    resultDesc: stkCallback.ResultDesc,
    amount: metadata.Amount as number | undefined,
    mpesaReceiptNumber: metadata.MpesaReceiptNumber as string | undefined,
    phoneNumber: metadata.PhoneNumber as string | undefined,
    transactionDate: metadata.TransactionDate as string | undefined,
  }
}

/**
 * Test M-Pesa configuration by fetching an auth token.
 */
export async function testConnection(): Promise<{ success: boolean; message: string }> {
  try {
    const config = await loadConfig()
    const token = await getAuthToken(config)
    if (token) {
      return { success: true, message: `Connected to ${config.environment} environment successfully` }
    }
    return { success: false, message: 'Failed to obtain auth token' }
  } catch (err) {
    return { success: false, message: err instanceof Error ? err.message : 'Connection failed' }
  }
}
