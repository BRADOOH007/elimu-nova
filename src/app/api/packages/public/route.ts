import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { route } from '@/lib/api-middleware'

export const dynamic = 'force-dynamic'

export const GET = route({ auth: 'none' }, async () => {
  const packages = await prisma.package.findMany({
    where: { isActive: true },
    orderBy: { price: 'asc' },
  })
  return NextResponse.json({ packages })
})
