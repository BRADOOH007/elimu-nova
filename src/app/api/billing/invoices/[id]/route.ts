import { NextResponse } from 'next/server'
import { route } from '@/lib/api-middleware'

export const GET = route({ auth: 'SCHOOL_ADMIN' }, async (req, { params }) => {
  const { id } = params

  return NextResponse.json({ error: 'PDF generation not implemented yet', invoiceId: id }, { status: 501 })
})
