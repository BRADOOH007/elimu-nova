import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { route } from '@/lib/api-middleware'

export const GET = route({ auth: ['SUPER_ADMIN'] }, async () => {
  const now = new Date()

  // Revenue last 30 days
  const revenue30d: { date: string; revenue: number }[] = []
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i)
    const next = new Date(d.getTime() + 86400000)
    const result = await prisma.invoice.aggregate({
      _sum: { totalAmount: true },
      where: { status: 'PAID', paidDate: { gte: d, lt: next } },
    })
    revenue30d.push({ date: d.toISOString().slice(0, 10), revenue: result._sum.totalAmount || 0 })
  }

  // School signups last 12 weeks
  const schoolSignups: { week: string; count: number }[] = []
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i * 7)
    const next = new Date(d.getTime() + 604800000)
    const count = await prisma.school.count({ where: { createdAt: { gte: d, lt: next } } })
    schoolSignups.push({ week: d.toISOString().slice(0, 10), count })
  }

  // User growth last 30 days
  const userGrowth: { date: string; count: number }[] = []
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i)
    const count = await prisma.user.count({ where: { createdAt: { lte: d } } })
    userGrowth.push({ date: d.toISOString().slice(0, 10), count })
  }

  return NextResponse.json({ revenue30d, schoolSignups, userGrowth })
})
