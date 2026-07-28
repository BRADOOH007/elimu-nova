import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const setting = await prisma.systemSettings.findUnique({ where: { key: 'maintenance_mode' } })
    if (!setting) return NextResponse.json({ enabled: false, message: '' })
    const parsed = JSON.parse(setting.value)
    return NextResponse.json({ enabled: !!parsed.enabled, message: parsed.message || '' })
  } catch (e) {
    console.warn('[MaintenanceStatus] Failed to parse:', e)
    return NextResponse.json({ enabled: false, message: '' })
  }
}
