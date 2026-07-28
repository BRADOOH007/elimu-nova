import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { route } from '@/lib/api-middleware'

export const PUT = route({ auth: 'SUPER_ADMIN' }, async (req, { params, user }) => {
  const body = await req.json()
  const setting = await prisma.systemSettings.update({
    where: { id: params.id },
    data: {
      ...(body.value !== undefined && { value: body.value }),
      ...(body.description !== undefined && { description: body.description }),
      ...(body.category !== undefined && { category: body.category }),
      ...(body.type !== undefined && { type: body.type }),
      ...(body.isPublic !== undefined && { isPublic: body.isPublic }),
      ...(body.isEditable !== undefined && { isEditable: body.isEditable }),
      updatedBy: user.id,
    },
    include: {
      updatedByUser: { select: { id: true, firstName: true, lastName: true, email: true } },
    },
  })

  return NextResponse.json(setting)
})

export const DELETE = route({ auth: 'SUPER_ADMIN' }, async (req, { params }) => {
  await prisma.systemSettings.delete({ where: { id: params.id } })
  return NextResponse.json({ message: 'Setting deleted' })
})
