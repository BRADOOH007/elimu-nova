import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (session.user.role !== 'SCHOOL_ADMIN' && session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const curriculum = await prisma.curriculum.findUnique({ where: { id } })
    if (!curriculum) return NextResponse.json({ error: 'Curriculum not found' }, { status: 404 })

    await prisma.curriculum.delete({ where: { id } })
    return NextResponse.json({ message: 'Curriculum deleted successfully' })
  } catch (error) {
    console.error('Error deleting curriculum:', error)
    return NextResponse.json({ error: 'Failed to delete curriculum' }, { status: 500 })
  }
}
