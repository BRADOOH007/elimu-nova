import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is super admin
    if (session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get current date for calculations
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)

    // Fetch school statistics
    const [
      totalSchools,
      activeSchools,
      schoolsThisMonth,
      schoolsLastMonth,
      totalUsers,
      activeUsers,
      usersThisMonth,
      usersLastMonth,
      totalPackages,
      activePackages,
      packagesThisWeek,
      totalRevenueSubscriptions,
      revenueThisMonthSubscriptions,
      revenueLastMonthSubscriptions
    ] = await Promise.all([
      // Total schools
      prisma.school.count(),
      
      // Active schools
      prisma.school.count({
        where: { isActive: true }
      }),
      
      // Schools created this month
      prisma.school.count({
        where: {
          createdAt: {
            gte: startOfMonth
          }
        }
      }),
      
      // Schools created last month
      prisma.school.count({
        where: {
          createdAt: {
            gte: startOfLastMonth,
            lte: endOfLastMonth
          }
        }
      }),
      
      // Total users
      prisma.user.count(),
      
      // Active users
      prisma.user.count({
        where: { isActive: true }
      }),
      
      // Users created this month
      prisma.user.count({
        where: {
          createdAt: {
            gte: startOfMonth
          }
        }
      }),
      
      // Users created last month
      prisma.user.count({
        where: {
          createdAt: {
            gte: startOfLastMonth,
            lte: endOfLastMonth
          }
        }
      }),
      
      // Total packages
      prisma.package.count(),
      
      // Active packages
      prisma.package.count({
        where: { isActive: true }
      }),
      
      // Packages created this week
      prisma.package.count({
        where: {
          createdAt: {
            gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          }
        }
      }),
      
      // Total revenue (from active subscriptions)
      prisma.subscription.findMany({
        where: { status: 'ACTIVE' },
        include: { package: { select: { price: true } } }
      }),
      
      // Revenue this month
      prisma.subscription.findMany({
        where: {
          status: 'ACTIVE',
          createdAt: {
            gte: startOfMonth
          }
        },
        include: { package: { select: { price: true } } }
      }),
      
      // Revenue last month
      prisma.subscription.findMany({
        where: {
          status: 'ACTIVE',
          createdAt: {
            gte: startOfLastMonth,
            lte: endOfLastMonth
          }
        },
        include: { package: { select: { price: true } } }
      })
    ])

    // Calculate changes
    const schoolChange = schoolsLastMonth > 0 
      ? Math.round(((schoolsThisMonth - schoolsLastMonth) / schoolsLastMonth) * 100)
      : schoolsThisMonth > 0 ? 100 : 0

    const userChange = usersLastMonth > 0
      ? Math.round(((usersThisMonth - usersLastMonth) / usersLastMonth) * 100)
      : usersThisMonth > 0 ? 100 : 0

    // Calculate total revenue from subscriptions
    const totalRevenue = totalRevenueSubscriptions.reduce((sum, sub) => sum + sub.package.price, 0)
    const thisMonthRevenue = revenueThisMonthSubscriptions.reduce((sum, sub) => sum + sub.package.price, 0)
    const lastMonthRevenue = revenueLastMonthSubscriptions.reduce((sum, sub) => sum + sub.package.price, 0)

    const revenueChange = lastMonthRevenue > 0
      ? Math.round(((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100)
      : thisMonthRevenue > 0 ? 100 : 0

    // Format currency (USD)
    const formatCurrency = (amount: number) => {
      if (!amount) return '$0'
      return `$${amount.toLocaleString()}`
    }

    const stats = {
      schools: {
        total: totalSchools,
        active: activeSchools,
        change: schoolChange,
        changeText: schoolChange >= 0 
          ? `+${schoolsThisMonth} this month` 
          : `${schoolsThisMonth} this month`
      },
      users: {
        total: totalUsers,
        active: activeUsers,
        change: userChange,
        changeText: userChange >= 0 
          ? `+${userChange}% from last month` 
          : `${userChange}% from last month`
      },
      revenue: {
        total: formatCurrency(totalRevenue),
        thisMonth: formatCurrency(thisMonthRevenue),
        change: revenueChange,
        changeText: revenueChange >= 0 
          ? `+${revenueChange}% from last month` 
          : `${revenueChange}% from last month`
      },
      packages: {
        total: totalPackages,
        active: activePackages,
        change: packagesThisWeek,
        changeText: packagesThisWeek > 0 
          ? `${packagesThisWeek} new this week` 
          : 'No new packages'
      }
    }

    return NextResponse.json(stats, {
      headers: {
        'Cache-Control': 'public, max-age=30, s-maxage=60, stale-while-revalidate=120',
      },
    })
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
