import { NextResponse } from 'next/server'
import { loadConfig, generateSignature } from '@/lib/zoom'
import { route } from '@/lib/api-middleware'
import { validate } from '@/lib/validate'
import { z } from 'zod'
import { logger } from '@/lib/logger'

export const runtime = 'nodejs'

const SignatureSchema = z.object({
  meetingNumber: z.union([z.string(), z.number()]).refine(v => String(v).length > 0, 'Meeting number is required'),
  role: z.number().int().min(0).max(1).default(0),
})

export const POST = route({}, async (req, { user }) => {
  const body = await req.json()
  const data = validate(SignatureSchema, body)

  const config = await loadConfig()
  if (!config.sdkKey || !config.sdkSecret) {
    return NextResponse.json({ error: 'Zoom SDK not configured. Ask your admin to set up Zoom credentials.' }, { status: 400 })
  }

  const signature = generateSignature(config.sdkKey, config.sdkSecret, String(data.meetingNumber), data.role)
  logger.info('Zoom signature generated', { userId: user.id, role: data.role })

  return NextResponse.json({ signature, sdkKey: config.sdkKey })
})
