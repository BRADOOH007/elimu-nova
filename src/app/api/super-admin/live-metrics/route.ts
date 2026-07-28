import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const [
      totalSchools,
      totalUsers,
      activeUsers24h,
      totalRevenue,
      pendingInvoices
    ] = await Promise.all([
      prisma.school.count(),
      prisma.user.count(),
      prisma.user.count({ where: { createdAt: { gte: new Date(Date.now() - 86400000) } } }),
      prisma.subscription.aggregate({ _sum: { amount: true } }),
      prisma.invoice.count({ where: { status: 'PENDING' } }),
    ])

    return NextResponse.json({
      schools: totalSchools,
      users: totalUsers,
      active24h: activeUsers24h,
      revenue: totalRevenue._sum.amount || 0,
      pendingInvoices,
      timestamp: Date.now(),
    })
  } catch (e) {
    console.error('[LiveMetrics] Failed to fetch:', e)
    return NextResponse.json({ error: 'Failed to fetch metrics' }, { status: 500 })
  }
}
