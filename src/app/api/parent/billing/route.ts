import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { route } from '@/lib/api-middleware'

export const GET = route({ auth: 'PARENT' }, async (_req, { user }) => {
  try {
    const parent = await prisma.parent.findUnique({
      where: { userId: user.id },
      include: {
        students: {
          include: { student: { select: { schoolId: true } } },
          take: 1,
        }
      }
    })

    const schoolId = parent?.students?.[0]?.student?.schoolId

    let billing = null
    let invoices: any[] = []

    if (schoolId) {
      const subscription = await prisma.subscription.findFirst({
        where: { schoolId, status: { in: ['ACTIVE', 'TRIAL', 'EXPIRED'] } },
        orderBy: { createdAt: 'desc' },
        include: {
          package: { select: { id: true, name: true, price: true } },
          school: { select: { name: true } },
        }
      })

      if (subscription) {
        billing = {
          status: subscription.status,
          planName: subscription.package?.name || subscription.type || 'Unknown',
          amount: subscription.amount,
          startDate: subscription.startDate,
          endDate: subscription.endDate,
        }
      }

      invoices = await prisma.invoice.findMany({
        where: { subscriptionId: subscription?.id } as any,
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          invoiceNumber: true,
          amount: true,
          status: true,
          dueDate: true,
          paidAt: true,
          createdAt: true,
        } as any
      })
    }

    return NextResponse.json({ billing, invoices })
  } catch (error) {
    console.error('[GET_PARENT_BILLING]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
})
