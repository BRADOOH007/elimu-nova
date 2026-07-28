import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { route } from '@/lib/api-middleware'

export const GET = route({}, async (req, { user }) => {
  const { searchParams } = new URL(req.url)
  const requestedUserId = searchParams.get('userId')
  const userId = (requestedUserId && user.role === 'SUPER_ADMIN') ? requestedUserId : user.id

  let preferences = await prisma.userPreference.findUnique({
    where: { userId }
  })

  if (!preferences) {
    preferences = await prisma.userPreference.create({
      data: {
        userId,
        theme: 'light',
        language: 'en',
        timezone: 'UTC',
        emailNotifications: true,
        pushNotifications: true,
        country: '',
        curriculum: '',
      }
    })
  }

  return NextResponse.json(preferences)
})

export const POST = route({}, async (req, { user }) => {
  const body = await req.json()
  let { userId, theme, language, timezone, emailNotifications, pushNotifications, country, curriculum } = body

  const targetUserId = (userId && user.role === 'SUPER_ADMIN') ? userId : user.id

  const preferences = await prisma.userPreference.upsert({
    where: { userId: targetUserId },
    update: {
      theme,
      language,
      timezone,
      emailNotifications,
      pushNotifications,
      country,
      curriculum,
    },
    create: {
      userId: targetUserId,
      theme: theme || 'light',
      language: language || 'en',
      timezone: timezone || 'UTC',
      emailNotifications: emailNotifications !== undefined ? emailNotifications : true,
      pushNotifications: pushNotifications !== undefined ? pushNotifications : true,
      country: country || '',
      curriculum: curriculum || '',
    }
  })

  return NextResponse.json(preferences)
})
