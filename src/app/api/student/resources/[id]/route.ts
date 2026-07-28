import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { route } from '@/lib/api-middleware'

export const DELETE = route({ auth: 'STUDENT' }, async (request, { params }) => {
  const { id } = params

  const resource = await prisma.resource.findUnique({ where: { id } })
  if (!resource) return NextResponse.json({ error: 'Resource not found' }, { status: 404 })

  await prisma.resource.delete({ where: { id } })
  return NextResponse.json({ message: 'Resource deleted successfully' })
})
