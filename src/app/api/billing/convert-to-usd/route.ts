import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { route } from '@/lib/api-middleware'

export const POST = route({ auth: 'SUPER_ADMIN' }, async (req, { user }) => {
  const { searchParams } = new URL(req.url)
  const rateParam = searchParams.get('rate')
  const dryRun = (searchParams.get('dryRun') || 'true').toLowerCase() === 'true'
  const rate = rateParam ? parseFloat(rateParam) : 1 / 130
  if (!rate || rate <= 0) return NextResponse.json({ error: 'Invalid rate' }, { status: 400 })

  const [packages, subscriptions, invoices] = await Promise.all([
    prisma.package.findMany({}),
    prisma.subscription.findMany({}),
    prisma.invoice.findMany({}),
  ])

  const converted = {
    packages: packages.map(p => ({ id: p.id, from: p.price, to: +(p.price * rate).toFixed(2) })),
    subscriptions: subscriptions.map(s => ({ id: s.id, from: s.amount, to: +(s.amount * rate).toFixed(2) })),
    invoices: invoices.map(i => ({ id: i.id, from: i.totalAmount, to: +(i.totalAmount * rate).toFixed(2), amountTo: +(i.amount * rate).toFixed(2), taxTo: +(i.taxAmount * rate).toFixed(2) })),
    rate,
    dryRun,
  }

  if (!dryRun) {
    await prisma.$transaction([
      ...converted.packages.map(p => prisma.package.update({ where: { id: p.id }, data: { price: p.to } })),
      ...converted.subscriptions.map(s => prisma.subscription.update({ where: { id: s.id }, data: { amount: s.to } })),
      ...converted.invoices.map(i => prisma.invoice.update({ where: { id: i.id }, data: { totalAmount: i.to, amount: i.amountTo, taxAmount: i.taxTo } })),
    ])
  }

  return NextResponse.json(converted)
})
