import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { route } from '@/lib/api-middleware'

export const PATCH = route({ auth: 'PARENT' }, async (req, { user, params }) => {
  try {
    const { id } = await params
    const parent = await prisma.parent.findUnique({ where: { userId: user.id } })
    if (!parent) return NextResponse.json({ error: 'Parent not found' }, { status: 404 })

    const meeting = await prisma.meeting.findUnique({ where: { id } })
    if (!meeting) return NextResponse.json({ error: 'Meeting not found' }, { status: 404 })
    if (meeting.schoolId !== (parent as any).schoolId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { status } = await req.json()
    const updated = await prisma.meeting.update({ where: { id }, data: { status } as any })

    return NextResponse.json({ meeting: updated })
  } catch (error) {
    console.error('[PARENT_MEETINGS_PATCH]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
})
