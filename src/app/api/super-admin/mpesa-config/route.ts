import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { route } from '@/lib/api-middleware'
import { testConnection } from '@/lib/daraja'
import { encryptPassword, decryptPassword } from '@/lib/password-encryption'

const SENSITIVE_KEYS = ['mpesa_consumer_key', 'mpesa_consumer_secret', 'mpesa_passkey']

const CONFIG_KEYS = [
  'mpesa_consumer_key',
  'mpesa_consumer_secret',
  'mpesa_passkey',
  'mpesa_shortcode',
  'mpesa_environment',
] as const

export const GET = route({ auth: 'SUPER_ADMIN' }, async (req, { user }) => {
  try {

    const settings = await Promise.all(
      CONFIG_KEYS.map(key =>
        (prisma as any).systemSettings.findUnique({ where: { key } })
      )
    )

    const config: Record<string, string> = {}
    for (let i = 0; i < CONFIG_KEYS.length; i++) {
      const stored = settings[i]?.value || ''
      const key = CONFIG_KEYS[i]
      // Decrypt sensitive values before masking
      const val = SENSITIVE_KEYS.includes(key) && stored ? (decryptPassword(stored) || stored) : stored
      // Mask secrets (consumer_secret, passkey)
      if ((key === 'mpesa_consumer_secret' || key === 'mpesa_passkey') && val) {
        config[key] = val.length > 8
          ? val.slice(0, 4) + '•'.repeat(8) + val.slice(-4)
          : '•'.repeat(8)
      } else {
        config[key] = val
      }
    }

    const isConfigured = !!(settings[0]?.value && settings[1]?.value && settings[2]?.value && settings[3]?.value)

    return NextResponse.json({ config, isConfigured, environment: config.mpesa_environment || 'sandbox' })
  } catch (error) {
    console.error('Error fetching M-Pesa config:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
})

export const POST = route({ auth: 'SUPER_ADMIN' }, async (req, { user }) => {
  try {
    const body = await req.json()
    const updated: string[] = []

    for (const key of CONFIG_KEYS) {
      if (body[key] === undefined) continue
      let value = String(body[key])
      // Skip masked values (contain •)
      if (value.includes('•')) continue
      // Encrypt sensitive values at rest
      const storedValue = SENSITIVE_KEYS.includes(key) ? encryptPassword(value) : value
      await (prisma as any).systemSettings.upsert({
        where: { key },
        create: {
          key,
          value: storedValue,
          type: 'string',
          category: 'payment',
          description: `M-Pesa ${key.replace('mpesa_', '').replace('_', ' ')}`,
          isPublic: key === 'mpesa_environment',
          isEditable: true,
          updatedBy: user.id,
        },
        update: {
          value: storedValue,
          updatedBy: user.id,
        },
      })
      updated.push(key)
    }

    return NextResponse.json({ success: true, updated })
  } catch (error) {
    console.error('Error saving M-Pesa config:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
})

export const PUT = route({ auth: 'SUPER_ADMIN' }, async (req, { user }) => {
  try {
    const result = await testConnection()
    if (result.success) {
      return NextResponse.json({ success: true, mode: 'connected', message: result.message })
    }
    return NextResponse.json({ success: false, error: result.message }, { status: 400 })
  } catch (error) {
    console.error('Error testing M-Pesa connection:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
})
