const ZOOM_WEBHOOK_SECRET = process.env.ZOOM_WEBHOOK_SECRET

export async function verifyZoomWebhook(body: string, signatureHeader: string): Promise<boolean> {
  if (!ZOOM_WEBHOOK_SECRET) {
    console.warn('ZOOM_WEBHOOK_SECRET not configured — webhook verification skipped')
    return true
  }

  try {
    // Zoom sends the HMAC-SHA256 signature in the header
    // Format: v0={signature}, t={timestamp}
    const parts = signatureHeader.split(',')
    let timestamp = ''
    let receivedSig = ''

    for (const part of parts) {
      const [key, value] = part.trim().split('=')
      if (key === 't' && value) timestamp = value
      if (key === 'v0' && value) receivedSig = value
    }

    if (!timestamp || !receivedSig) {
      console.warn('[ZOOM_WEBHOOK] Malformed signature header', { signatureHeader })
      return false
    }

    const encoder = new TextEncoder()
    const message = `v0:${timestamp}:${body}`

    const crypto = globalThis.crypto
    return crypto.subtle
      ? verifyWithSubtle(encoder, message, receivedSig)
      : verifyWithNode(encoder, message, receivedSig)
  } catch (err) {
    console.error('[ZOOM_WEBHOOK] Verification error:', err)
    return false
  }
}

async function verifyWithSubtle(encoder: TextEncoder, message: string, receivedSig: string): Promise<boolean> {
  try {
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(ZOOM_WEBHOOK_SECRET!),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    )
    const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(message))
    const computed = Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('')
    return computed === receivedSig
  } catch (e) { console.warn('[ZoomWebhook] verifyWithSubtle failed:', e)
    return false
  }
}

function verifyWithNode(encoder: TextEncoder, message: string, receivedSig: string): boolean {
  const crypto = require('crypto')
  const computed = crypto.createHmac('sha256', ZOOM_WEBHOOK_SECRET!).update(message).digest('hex')
  return computed === receivedSig
}

export interface ZoomWebhookEvent {
  event: string
  payload: {
    account_id: string
    object: {
      id: number | string
      uuid: string
      topic: string
      host_id: string
      type: number
      start_time: string
      duration: number
      timezone: string
      status?: string
      recording_files?: Array<{
        id: string
        file_type: string
        download_url: string
        file_size: number
        recording_start: string
        recording_end: string
      }>
      participant?: {
        user_id: string
        user_name: string
        email: string
        join_time: string
        leave_time: string
      }
    }
  }
}

export function parseZoomWebhookEvent(body: string): ZoomWebhookEvent | null {
  try {
    return JSON.parse(body) as ZoomWebhookEvent
  } catch (e) { console.warn('[ZoomWebhook] parseZoomWebhookEvent failed:', e)
    return null
  }
}
