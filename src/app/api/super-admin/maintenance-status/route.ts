import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { route } from '@/lib/api-middleware'

export const dynamic = 'force-dynamic'

export const GET = route({ auth: 'SUPER_ADMIN' }, async () => {
  try {
    const setting = await prisma.systemSettings.findUnique({ where: { key: 'maintenance_mode' } })
    if (!setting) return NextResponse.json({ enabled: false, message: '' })
    const parsed = JSON.parse(setting.value)
    return NextResponse.json({ enabled: !!parsed.enabled, message: parsed.message || '' })
  } catch (e) {
    console.warn('[MaintenanceStatus] Failed to parse:', e)
    return NextResponse.json({ enabled: false, message: '' })
  }
})
