import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { route } from '@/lib/api-middleware'

export const GET = route({ auth: ['SUPER_ADMIN'] }, async () => {
  const now = new Date()

  // Revenue last 30 days
  const revenueDays: { d: Date; next: Date }[] = []
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i)
    revenueDays.push({ d, next: new Date(d.getTime() + 86400000) })
  }
  const revenue30d = await Promise.all(
    revenueDays.map(async ({ d, next }) => {
      const result = await prisma.invoice.aggregate({
        _sum: { totalAmount: true },
        where: {
          status: 'PAID',
          paidDate: { gte: d, lt: next },
          subscription: { isFreemium: { not: true } }
        },
      })
      return { date: d.toISOString().slice(0, 10), revenue: result._sum.totalAmount || 0 }
    })
  )

  // School signups last 12 weeks
  const signupWeeks: { d: Date; next: Date }[] = []
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i * 7)
    signupWeeks.push({ d, next: new Date(d.getTime() + 604800000) })
  }
  const schoolSignups = await Promise.all(
    signupWeeks.map(async ({ d, next }) => ({
      week: d.toISOString().slice(0, 10),
      count: await prisma.school.count({ where: { createdAt: { gte: d, lt: next } } }),
    }))
  )

  // User growth last 30 days
  const growthDays = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (29 - i))
    return d
  })
  const userGrowth = await Promise.all(
    growthDays.map(async d => ({
      date: d.toISOString().slice(0, 10),
      count: await prisma.user.count({ where: { createdAt: { lte: d } } }),
    }))
  )

  return NextResponse.json({ revenue30d, schoolSignups, userGrowth })
})
