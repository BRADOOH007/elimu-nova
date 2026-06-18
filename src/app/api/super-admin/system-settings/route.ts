import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

async function requireSuperAdmin() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id || session.user.role !== 'SUPER_ADMIN') return null
  return session
}

export async function GET(request: NextRequest) {
  try {
    const session = await requireSuperAdmin()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const page  = parseInt(searchParams.get('page')  || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    const [settings, total] = await Promise.all([
      (prisma as any).systemSettings.findMany({
        include: {
          updatedBy: { select: { firstName: true, lastName: true, email: true } },
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
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireSuperAdmin()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { key, value, type, category, description } = await request.json()
    if (!key || !value) return NextResponse.json({ error: 'key and value required' }, { status: 400 })

    const setting = await (prisma as any).systemSettings.upsert({
      where: { key },
      update: { value, updatedById: session.user.id },
      create: { key, value, type: type || 'string', category: category || 'general', description, updatedById: session.user.id },
    })
    return NextResponse.json(setting)
  } catch (error) {
    console.error('[POST_SYSTEM_SETTINGS]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await requireSuperAdmin()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await request.json()
    await (prisma as any).systemSettings.delete({ where: { id } })
    return NextResponse.json({ message: 'Setting deleted' })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
