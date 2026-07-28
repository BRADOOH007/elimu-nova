import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { testConnection } from '@/lib/zoom'
import { encryptPassword, decryptPassword } from '@/lib/password-encryption'

import { route, apiLogger } from '@/lib/api-middleware'
const log = apiLogger('zoom/config')

const CONFIG_KEYS = ['zoom_sdk_key', 'zoom_sdk_secret'] as const
const ZOOM_SENSITIVE = CONFIG_KEYS as readonly string[]

export const GET = route({ auth: 'SUPER_ADMIN' }, async (req, { user, params }) => {
  try {
    const settings = await Promise.all(
      CONFIG_KEYS.map(key => (prisma as any).systemSettings.findUnique({ where: { key } }))
    )

    const config: Record<string, string> = {}
    for (let i = 0; i < CONFIG_KEYS.length; i++) {
      const stored = settings[i]?.value || ''
      const key = CONFIG_KEYS[i]
      const val = stored ? (decryptPassword(stored) || stored) : ''
      if (key === 'zoom_sdk_secret' && val) {
        config[key] = val.length > 8
          ? val.slice(0, 4) + '•'.repeat(8) + val.slice(-4)
          : '•'.repeat(8)
      } else {
        config[key] = val
      }
    }

    const isConfigured = !!(settings[0]?.value && settings[1]?.value)

    return NextResponse.json({ config, isConfigured })
  } catch (error) {
    log.error('Error fetching Zoom config:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }

})

export const POST = route({ auth: 'SUPER_ADMIN' }, async (req, { user, params }) => {
  try {
    const body = await req.json()
    const updated: string[] = []

    for (const key of CONFIG_KEYS) {
      if (body[key] === undefined) continue
      let value = String(body[key])
      if (value.includes('•')) continue
      const storedValue = encryptPassword(value)
      await (prisma as any).systemSettings.upsert({
        where: { key },
        create: {
          key,
          value: storedValue,
          type: 'string',
          category: 'integration',
          description: `Zoom ${key.replace('zoom_', '').replace('_', ' ')}`,
          isPublic: false,
          isEditable: true,
          updatedBy: user.id,
        },
        update: { value: storedValue, updatedBy: user.id },
      })
      updated.push(key)
    }

    return NextResponse.json({ success: true, updated })
  } catch (error) {
    log.error('Error saving Zoom config:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }

})

export const PUT = route({ auth: 'SUPER_ADMIN' }, async (req, { user, params }) => {
  try {
    const result = await testConnection()
    if (result.success) {
      return NextResponse.json({ success: true, message: result.message })
    }
    return NextResponse.json({ success: false, error: result.message }, { status: 400 })
  } catch (error) {
    log.error('Error testing Zoom connection:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }

})
