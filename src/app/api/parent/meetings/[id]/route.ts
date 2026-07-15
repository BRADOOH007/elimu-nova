import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || session.user.role !== 'PARENT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const parent = await prisma.parent.findUnique({ where: { userId: session.user.id } })
    if (!parent) return NextResponse.json({ error: 'Parent not found' }, { status: 404 })

    const meeting = await prisma.meeting.findUnique({ where: { id } })
    if (!meeting) return NextResponse.json({ error: 'Meeting not found' }, { status: 404 })
    if (meeting.schoolId !== parent.schoolId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { status } = await request.json()
    const updated = await prisma.meeting.update({ where: { id }, data: { status } as any })

    return NextResponse.json({ meeting: updated })
  } catch (error) {
    console.error('[PARENT_MEETINGS_PATCH]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
