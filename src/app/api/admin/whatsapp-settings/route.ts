import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { route } from '@/lib/api-middleware'

export const GET = route({ auth: 'SUPER_ADMIN' }, async () => {
  const keys = await prisma.systemSettings.findMany({
    where: { key: { in: ['whatsapp_provider', 'twilio_account_sid', 'twilio_auth_token', 'twilio_from_number', 'africastalking_api_key', 'africastalking_username', 'africastalking_from_number'] } }
  })
  const map: Record<string, string> = {}
  for (const k of keys) map[k.key] = k.value
  return NextResponse.json(map)
})

export const POST = route({ auth: 'SUPER_ADMIN' }, async (req, { user }) => {
  const body = await req.json()
  const allowed = ['whatsapp_provider', 'twilio_account_sid', 'twilio_auth_token', 'twilio_from_number', 'africastalking_api_key', 'africastalking_username', 'africastalking_from_number']
  const entries = Object.entries(body).filter(([k]) => allowed.includes(k))
  for (const [key, value] of entries) {
    await prisma.systemSettings.upsert({
      where: { key },
      update: { value: String(value), updatedBy: user.id },
      create: { key, value: String(value), type: 'string', category: 'notifications', updatedBy: user.id },
    })
  }
  return NextResponse.json({ success: true })
})
