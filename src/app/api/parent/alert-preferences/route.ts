import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { route } from '@/lib/api-middleware'
import { z } from 'zod'

const UpdatePreferencesSchema = z.object({
  emailEnabled: z.boolean(),
  smsEnabled: z.boolean(),
  types: z.array(z.enum(['performance_drop', 'absence', 'behavior', 'achievement'])),
})

export const GET = route({ auth: 'PARENT' }, async (req, { user }) => {
  const prefs = await prisma.userPreference.findUnique({ where: { userId: user.id } })

  const parentPrefs = prefs?.tourCompletion as { emailEnabled?: boolean; smsEnabled?: boolean; types?: string[] } | null

  return NextResponse.json({
    emailEnabled: parentPrefs?.emailEnabled ?? true,
    smsEnabled: parentPrefs?.smsEnabled ?? false,
    types: parentPrefs?.types ?? ['performance_drop', 'absence', 'behavior', 'achievement'],
  })
})

export const POST = route({ auth: 'PARENT', schema: UpdatePreferencesSchema }, async (req, { user, body }) => {
  const { emailEnabled, smsEnabled, types } = body!

  const prefs = await prisma.userPreference.upsert({
    where: { userId: user.id },
    update: {
      emailNotifications: emailEnabled,
      tourCompletion: { emailEnabled, smsEnabled, types },
    },
    create: {
      userId: user.id,
      theme: 'light',
      language: 'en',
      timezone: 'UTC',
      emailNotifications: emailEnabled,
      tourCompletion: { emailEnabled, smsEnabled, types },
    },
  })

  return NextResponse.json({
    emailEnabled: (prefs.tourCompletion as any)?.emailEnabled ?? emailEnabled,
    smsEnabled: (prefs.tourCompletion as any)?.smsEnabled ?? smsEnabled,
    types: (prefs.tourCompletion as any)?.types ?? types,
  })
})
