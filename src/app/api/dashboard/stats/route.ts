import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { route } from '@/lib/api-middleware'

export const GET = route({ auth: 'SUPER_ADMIN' }, async (req, { user }) => {
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)

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
    prisma.school.count(),
    prisma.school.count({ where: { isActive: true } }),
    prisma.school.count({ where: { createdAt: { gte: startOfMonth } } }),
    prisma.school.count({ where: { createdAt: { gte: startOfLastMonth, lte: endOfLastMonth } } }),
    prisma.user.count(),
    prisma.user.count({ where: { isActive: true } }),
    prisma.user.count({ where: { createdAt: { gte: startOfMonth } } }),
    prisma.user.count({ where: { createdAt: { gte: startOfLastMonth, lte: endOfLastMonth } } }),
    prisma.package.count(),
    prisma.package.count({ where: { isActive: true } }),
    prisma.package.count({ where: { createdAt: { gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) } } }),
    prisma.subscription.findMany({ where: { status: 'ACTIVE' }, include: { package: { select: { price: true } } } }),
    prisma.subscription.findMany({ where: { status: 'ACTIVE', createdAt: { gte: startOfMonth } }, include: { package: { select: { price: true } } } }),
    prisma.subscription.findMany({ where: { status: 'ACTIVE', createdAt: { gte: startOfLastMonth, lte: endOfLastMonth } }, include: { package: { select: { price: true } } } })
  ])

  const schoolChange = schoolsLastMonth > 0
    ? Math.round(((schoolsThisMonth - schoolsLastMonth) / schoolsLastMonth) * 100)
    : schoolsThisMonth > 0 ? 100 : 0

  const userChange = usersLastMonth > 0
    ? Math.round(((usersThisMonth - usersLastMonth) / usersLastMonth) * 100)
    : usersThisMonth > 0 ? 100 : 0

  const totalRevenue = totalRevenueSubscriptions.reduce((sum, sub) => sum + sub.package.price, 0)
  const thisMonthRevenue = revenueThisMonthSubscriptions.reduce((sum, sub) => sum + sub.package.price, 0)
  const lastMonthRevenue = revenueLastMonthSubscriptions.reduce((sum, sub) => sum + sub.package.price, 0)

  const revenueChange = lastMonthRevenue > 0
    ? Math.round(((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100)
    : thisMonthRevenue > 0 ? 100 : 0

  const formatCurrency = (amount: number) => {
    if (!amount) return '$0'
    return `$${amount.toLocaleString()}`
  }

  const stats = {
    schools: {
      total: totalSchools,
      active: activeSchools,
      change: schoolChange,
      changeText: schoolChange >= 0 ? `+${schoolsThisMonth} this month` : `${schoolsThisMonth} this month`
    },
    users: {
      total: totalUsers,
      active: activeUsers,
      change: userChange,
      changeText: userChange >= 0 ? `+${userChange}% from last month` : `${userChange}% from last month`
    },
    revenue: {
      total: formatCurrency(totalRevenue),
      thisMonth: formatCurrency(thisMonthRevenue),
      change: revenueChange,
      changeText: revenueChange >= 0 ? `+${revenueChange}% from last month` : `${revenueChange}% from last month`
    },
    packages: {
      total: totalPackages,
      active: activePackages,
      change: packagesThisWeek,
      changeText: packagesThisWeek > 0 ? `${packagesThisWeek} new this week` : 'No new packages'
    }
  }

  return NextResponse.json(stats, {
    headers: {
      'Cache-Control': 'public, max-age=30, s-maxage=60, stale-while-revalidate=120',
    },
  })
})
