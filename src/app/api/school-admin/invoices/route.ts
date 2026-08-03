import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { route } from '@/lib/api-middleware'

export const GET = route({ auth: 'SCHOOL_ADMIN' }, async (req, { user }) => {
  const schoolAdmin = await prisma.schoolAdmin.findUnique({
    where: { userId: user.id },
    include: { school: true }
  })

    if (!schoolAdmin?.schoolId) {
      return NextResponse.json({ error: 'School not found' }, { status: 404 })
    }

    const schoolId = schoolAdmin.schoolId

    // Get subscription for pricing info
    const subscription = await prisma.subscription.findFirst({
      where: { schoolId },
      include: { package: true },
      orderBy: { createdAt: 'desc' }
    })

    let invoices: any[] = []
    if (subscription) {
      const realInvoices = await prisma.invoice.findMany({
        where: { subscriptionId: subscription.id },
        orderBy: { createdAt: 'desc' },
        take: 100,
      })
      invoices = realInvoices.map(inv => ({
        id: inv.id,
        invoiceNumber: inv.invoiceNumber,
        date: inv.createdAt.toISOString(),
        amount: inv.totalAmount,
        status: inv.status.toLowerCase(),
        period: inv.createdAt.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
        downloadUrl: `/api/billing/invoices/${inv.id}/pdf`,
      }))
    }

    return NextResponse.json({ success: true, invoices })
})