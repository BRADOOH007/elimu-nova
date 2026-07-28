import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { route } from '@/lib/api-middleware'

export const DELETE = route({ auth: ['SCHOOL_ADMIN', 'SUPER_ADMIN'] }, async (req, { user, params }) => {
  const { id } = params

  const curriculum = await prisma.curriculum.findUnique({ where: { id } })
  if (!curriculum) return NextResponse.json({ error: 'Curriculum not found' }, { status: 404 })

  await prisma.curriculum.delete({ where: { id } })
  return NextResponse.json({ message: 'Curriculum deleted successfully' })
})
