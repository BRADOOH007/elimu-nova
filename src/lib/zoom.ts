import crypto from 'crypto'

interface ZoomConfig {
  sdkKey: string
  sdkSecret: string
}

async function loadConfig(): Promise<ZoomConfig> {
  try {
    const { prisma } = await import('@/lib/prisma')
    const { decryptPassword } = await import('./password-encryption')
    const [key, secret] = await Promise.all([
      (prisma as any).systemSettings.findUnique({ where: { key: 'zoom_sdk_key' } }),
      (prisma as any).systemSettings.findUnique({ where: { key: 'zoom_sdk_secret' } }),
    ])
    const decrypt = (val: string | undefined) => val ? (decryptPassword(val) || val) : ''
    return {
      sdkKey: decrypt(key?.value) || process.env.ZOOM_SDK_KEY || '',
      sdkSecret: decrypt(secret?.value) || process.env.ZOOM_SDK_SECRET || '',
    }
  } catch (e) {
    console.warn('[Zoom] Failed to load config from DB:', e)
    return {
      sdkKey: process.env.ZOOM_SDK_KEY || '',
      sdkSecret: process.env.ZOOM_SDK_SECRET || '',
    }
  }
}

function generateSignature(sdkKey: string, sdkSecret: string, meetingNumber: string, role: number): string {
  const timestamp = Math.floor(Date.now() - 30000)
  const msg = Buffer.from(`${sdkKey}${meetingNumber}${timestamp}${role}`).toString('base64')
  const hash = crypto.createHmac('sha256', sdkSecret).update(msg).digest('base64')
  const signature = Buffer.from(`${sdkKey}.${meetingNumber}.${timestamp}.${role}.${hash}`).toString('base64')
  return signature
}

async function testConnection(): Promise<{ success: boolean; message: string }> {
  try {
    const config = await loadConfig()
    if (!config.sdkKey || !config.sdkSecret) {
      return { success: false, message: 'Zoom SDK credentials not configured' }
    }
    generateSignature(config.sdkKey, config.sdkSecret, '123456789', 0)
    return { success: true, message: 'Zoom SDK configured successfully. Signature generation works.' }
  } catch (err) {
    return { success: false, message: err instanceof Error ? err.message : 'Connection failed' }
  }
}

export { loadConfig, generateSignature, testConnection }
export type { ZoomConfig }
