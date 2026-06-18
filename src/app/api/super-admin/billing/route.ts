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

    const [subscriptions, packages, total] = await Promise.all([
      prisma.subscription.findMany({
        include: {
          school: { select: { id: true, name: true } },
          package: { select: { id: true, name: true, price: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.package.findMany({ where: { isActive: true }, orderBy: { price: 'asc' } }),
      prisma.subscription.count(),
    ])

    // Revenue summary
    const activeRevenue = await prisma.subscription.aggregate({
      where: { status: 'ACTIVE' },
      _sum: { amount: true },
    })

    return NextResponse.json({
      subscriptions,
      packages,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      summary: {
        totalActive: await prisma.subscription.count({ where: { status: 'ACTIVE' } }),
        monthlyRevenue: activeRevenue._sum.amount || 0,
      },
    })
  } catch (error) {
    console.error('[GET_SUPER_BILLING]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
