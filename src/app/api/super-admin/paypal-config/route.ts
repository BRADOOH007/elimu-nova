import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { route } from '@/lib/api-middleware'
import { testConnection } from '@/lib/paypal'
import { encryptPassword, decryptPassword } from '@/lib/password-encryption'

const SENSITIVE_KEYS = ['paypal_client_secret']

const CONFIG_KEYS = [
  'paypal_client_id',
  'paypal_client_secret',
  'paypal_environment',
] as const

export const GET = route({ auth: 'SUPER_ADMIN' }, async (req, { user }) => {
  try {
    const settings = await Promise.all(
      CONFIG_KEYS.map(key =>
        prisma.systemSettings.findUnique({ where: { key } })
      )
    )

    const config: Record<string, string> = {}
    for (let i = 0; i < CONFIG_KEYS.length; i++) {
      const stored = settings[i]?.value || ''
      const key = CONFIG_KEYS[i]
      const val = SENSITIVE_KEYS.includes(key) && stored ? (decryptPassword(stored) || stored) : stored
      if ((key === 'paypal_client_secret' || key === 'paypal_client_id') && val) {
        config[key] = val.length > 8
          ? val.slice(0, 4) + '•'.repeat(8) + val.slice(-4)
          : '•'.repeat(8)
      } else {
        config[key] = val
      }
    }

    const isConfigured = !!(settings[0]?.value && settings[1]?.value)

    return NextResponse.json({ config, isConfigured, environment: config.paypal_environment || 'sandbox' })
  } catch (error) {
    console.error('Error fetching PayPal config:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
})

export const POST = route({ auth: 'SUPER_ADMIN' }, async (req, { user }) => {
  try {
    const body = await req.json()
    const updated: string[] = []

    for (const key of CONFIG_KEYS) {
      if (body[key] === undefined) continue
      const value = String(body[key])
      if (value.includes('•')) continue
      const storedValue = SENSITIVE_KEYS.includes(key) ? encryptPassword(value) : value
      await prisma.systemSettings.upsert({
        where: { key },
        create: {
          key,
          value: storedValue,
          type: 'string',
          category: 'payment',
          description: `PayPal ${key.replace('paypal_', '').replace('_', ' ')}`,
          isPublic: key === 'paypal_environment',
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
    console.error('Error saving PayPal config:', error)
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
    console.error('Error testing PayPal connection:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
})
