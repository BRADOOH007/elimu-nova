import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { route } from '@/lib/api-middleware'

export const GET = route({ auth: 'SUPER_ADMIN' }, async (req, { user }) => {
  try {
    const { searchParams } = new URL(req.url)
    const page  = parseInt(searchParams.get('page')  || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    const [settings, total] = await Promise.all([
      (prisma as any).systemSettings.findMany({
        include: {
          updatedByUser: { select: { firstName: true, lastName: true, email: true } },
        },
        orderBy: { category: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      (prisma as any).systemSettings.count(),
    ])

    return NextResponse.json({ settings, pagination: { page, limit, total, pages: Math.ceil(total / limit) } })
  } catch (error) {
    console.error('[GET_SYSTEM_SETTINGS]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
})

export const POST = route({ auth: 'SUPER_ADMIN' }, async (req, { user }) => {
  try {
    const { key, value, type, category, description } = await req.json()
    if (!key || !value) return NextResponse.json({ error: 'key and value required' }, { status: 400 })

    const setting = await (prisma as any).systemSettings.upsert({
      where: { key },
      update: { value, updatedById: user.id },
      create: { key, value, type: type || 'string', category: category || 'general', description, updatedById: user.id },
    })
    return NextResponse.json(setting)
  } catch (error) {
    console.error('[POST_SYSTEM_SETTINGS]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
})

export const DELETE = route({ auth: 'SUPER_ADMIN' }, async (req, { user }) => {
  try {
    const { id } = await req.json()
    await (prisma as any).systemSettings.delete({ where: { id } })
    return NextResponse.json({ message: 'Setting deleted' })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
})
