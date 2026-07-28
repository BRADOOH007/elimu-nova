import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { route } from '@/lib/api-middleware'

export const GET = route({ auth: 'SUPER_ADMIN' }, async (req, { user }) => {
  const schools = await prisma.school.findMany({
    select: {
      id: true,
      name: true,
      address: true
    },
    orderBy: {
      name: 'asc'
    }
  })

  return NextResponse.json(schools)
})
