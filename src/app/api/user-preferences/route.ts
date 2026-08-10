import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { route } from '@/lib/api-middleware'

export const GET = route({ skipSubscriptionCheck: true }, async (req, { user }) => {
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

export const POST = route({ skipSubscriptionCheck: true }, async (req, { user }) => {
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

async function mergeTourCompletion(userId: string, next: object): Promise<object> {
  try {
    const existing = await prisma.userPreference.findUnique({ where: { userId }, select: { tourCompletion: true } })
    const prev = (existing?.tourCompletion as object | null) || {}
    return { ...prev, ...(next as object) }
  } catch {
    return next
  }
}

export const PATCH = route({ skipSubscriptionCheck: true }, async (req, { user }) => {
  const body = await req.json()
  const { userId, theme, language, timezone, emailNotifications, pushNotifications, country, curriculum, tourCompletion, tourMerge } = body
  const targetUserId = (userId && user.role === 'SUPER_ADMIN') ? userId : user.id

  const data: any = {}
  if (theme !== undefined) data.theme = theme
  if (language !== undefined) data.language = language
  if (timezone !== undefined) data.timezone = timezone
  if (emailNotifications !== undefined) data.emailNotifications = emailNotifications
  if (pushNotifications !== undefined) data.pushNotifications = pushNotifications
  if (country !== undefined) data.country = country
  if (curriculum !== undefined) data.curriculum = curriculum
  if (tourCompletion !== undefined) data.tourCompletion = tourMerge ? await mergeTourCompletion(targetUserId, tourCompletion) : tourCompletion

  if (Object.keys(data).length === 0) {
    return NextResponse.json(await prisma.userPreference.findUnique({ where: { userId: targetUserId } }))
  }

  const preferences = await prisma.userPreference.upsert({
    where: { userId: targetUserId },
    update: data,
    create: {
      userId: targetUserId,
      theme: data.theme || 'light',
      language: data.language || 'en',
      timezone: data.timezone || 'UTC',
      emailNotifications: data.emailNotifications !== undefined ? data.emailNotifications : true,
      pushNotifications: data.pushNotifications !== undefined ? data.pushNotifications : true,
      country: data.country || '',
      curriculum: data.curriculum || '',
      tourCompletion: data.tourCompletion,
    }
  })

  return NextResponse.json(preferences)
})
