import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { route } from '@/lib/api-middleware'

export const GET = route({ auth: 'SUPER_ADMIN' }, async (req, { user }) => {
  try {
    const { searchParams } = new URL(req.url)
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

    const payingWhere = { isFreemium: { not: true } } as any

    // Revenue summary (exclude freemium)
    const activeRevenue = await prisma.subscription.aggregate({
      where: { status: 'ACTIVE', ...payingWhere },
      _sum: { amount: true },
    })

    return NextResponse.json({
      subscriptions,
      packages,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      summary: {
        totalActive: await prisma.subscription.count({ where: { status: 'ACTIVE', ...payingWhere } }),
        monthlyRevenue: activeRevenue._sum.amount || 0,
      },
    })
  } catch (error) {
    console.error('[GET_SUPER_BILLING]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
})
