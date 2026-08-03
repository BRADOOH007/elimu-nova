import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { route } from '@/lib/api-middleware'

// GET /api/billing/invoices/[id] — fetch invoice details
export const GET = route({}, async (req, { user, params }) => {
  const { id } = params
  if (!id) return NextResponse.json({ error: 'Missing invoice id' }, { status: 400 })

  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: {
      subscription: {
        include: { school: { select: { name: true } } },
      },
      paymentMethod: true,
    },
  }).catch(() => null)

  if (!invoice) return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })

  return NextResponse.json(invoice)
})