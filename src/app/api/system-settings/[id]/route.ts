import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

async function checkAuth() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id || session.user.role !== 'SUPER_ADMIN') {
    return null
  }
  return session.user.id
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await checkAuth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const setting = await prisma.systemSettings.update({
      where: { id: (await params).id },
      data: {
        ...(body.value !== undefined && { value: body.value }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.category !== undefined && { category: body.category }),
        ...(body.type !== undefined && { type: body.type }),
        ...(body.isPublic !== undefined && { isPublic: body.isPublic }),
        ...(body.isEditable !== undefined && { isEditable: body.isEditable }),
        updatedBy: userId,
      },
      include: {
        updatedByUser: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    })

    return NextResponse.json(setting)
  } catch (error) {
    console.error('Error updating system setting:', error)
    return NextResponse.json({ error: 'Failed to update setting' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await checkAuth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await prisma.systemSettings.delete({ where: { id: (await params).id } })
    return NextResponse.json({ message: 'Setting deleted' })
  } catch (error) {
    console.error('Error deleting system setting:', error)
    return NextResponse.json({ error: 'Failed to delete setting' }, { status: 500 })
  }
}
