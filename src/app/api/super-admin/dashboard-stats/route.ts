import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { route } from '@/lib/api-middleware'

export const GET = route({ auth: 'SUPER_ADMIN' }, async (req, { user }) => {
  try {

    // Get comprehensive platform statistics
    const [
      totalUsers,
      totalSchools,
      totalSubscriptions,
      totalRevenue,
      activeUsers,
      activeSchools,
      recentUsers,
      recentSchools
    ] = await Promise.all([
      prisma.user.count(),
      prisma.school.count(),
      prisma.subscription.count(),
      prisma.subscription.aggregate({
        _sum: { amount: true },
        where: { isFreemium: { not: true } }
      }),
      prisma.user.count({
        where: { isActive: true }
      }),
      prisma.school.count({
        where: {
          subscriptions: {
            some: {
              status: 'ACTIVE'
            }
          }
        }
      }),
      prisma.user.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
          }
        }
      }),
      prisma.school.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
          }
        }
      })
    ])

    // Calculate growth percentages
    const userGrowth = recentUsers > 0 ? Math.round((recentUsers / totalUsers) * 100) : 0
    const schoolGrowth = recentSchools > 0 ? Math.round((recentSchools / totalSchools) * 100) : 0

    const stats = {
      users: {
        total: totalUsers,
        active: activeUsers,
        recent: recentUsers,
        growth: userGrowth,
        changeText: `+${userGrowth}% this month`
      },
      schools: {
        total: totalSchools,
        active: activeSchools,
        recent: recentSchools,
        growth: schoolGrowth,
        changeText: `+${schoolGrowth}% this month`
      },
      subscriptions: {
        total: totalSubscriptions,
        active: activeSchools,
        change: 0,
        changeText: `${totalSubscriptions} active`
      },
      revenue: {
        total: `$${(totalRevenue._sum.amount || 0).toLocaleString()}`,
        thisMonth: `$${(totalRevenue._sum.amount || 0).toLocaleString()}`,
        change: 0,
        changeText: 'Total revenue'
      }
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Super Admin Dashboard Stats Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard statistics' },
      { status: 500 }
    )
  }
})