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
    const page   = parseInt(searchParams.get('page')   || '1')
    const limit  = parseInt(searchParams.get('limit')  || '20')
    const search = searchParams.get('search') || ''

    const where = search
      ? { OR: [{ name: { contains: search, mode: 'insensitive' as const } }, { address: { contains: search, mode: 'insensitive' as const } }] }
      : {}

    const [schools, total] = await Promise.all([
      prisma.school.findMany({
        where,
        include: {
          schoolAdmin: { include: { user: true } },
          _count: { select: { teachers: true, students: true } },
          subscriptions: { where: { status: 'ACTIVE' }, take: 1 },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.school.count({ where }),
    ])

    return NextResponse.json({ schools, pagination: { page, limit, total, pages: Math.ceil(total / limit) } })
  } catch (error) {
    console.error('[GET_SUPER_SCHOOLS]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireSuperAdmin()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { name, address, phone, email, website } = await request.json()
    if (!name || !address) return NextResponse.json({ error: 'Name and address required' }, { status: 400 })

    const school = await prisma.school.create({
      data: { name, address, phone, email, website },
    })
    return NextResponse.json(school, { status: 201 })
  } catch (error) {
    console.error('[POST_SUPER_SCHOOLS]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
