import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  const packages = await prisma.package.findMany({
    where: { isActive: true },
    orderBy: { price: 'asc' },
  })
  return NextResponse.json({ packages })
}
