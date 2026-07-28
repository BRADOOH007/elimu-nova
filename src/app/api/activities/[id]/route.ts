import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { route } from '@/lib/api-middleware'

export const DELETE = route({ auth: 'TEACHER' }, async (req, { params }) => {
  const { id } = params

  const activity = await prisma.activity.findUnique({ where: { id } })
  if (!activity) return NextResponse.json({ error: 'Activity not found' }, { status: 404 })

  await prisma.activity.delete({ where: { id } })
  return NextResponse.json({ message: 'Activity deleted successfully' })
})
