import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { route } from '@/lib/api-middleware'

export const GET = route({ auth: 'SCHOOL_ADMIN' }, async (_req, { user }) => {
  const admin = await prisma.schoolAdmin.findUnique({ where: { userId: user.id } })
  if (!admin) return NextResponse.json({ error: 'Not authorized' }, { status: 403 })

  const cutoff = new Date(Date.now() - 72 * 60 * 60 * 1000)
  const result = await (prisma as any).activity.deleteMany({
    where: {
      schoolId: admin.schoolId,
      createdAt: { lt: cutoff },
    },
  })

  return NextResponse.json({ purged: result.count, cutoff: cutoff.toISOString() })
})
