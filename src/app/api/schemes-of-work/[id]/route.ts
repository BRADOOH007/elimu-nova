import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const scheme = await prisma.schemeOfWork.findUnique({
      where: { id },
      include: {
        teacher: { include: { user: { select: { firstName: true, lastName: true } } } },
        lessonPlans: { select: { id: true, title: true } }
      }
    })
    if (!scheme) return NextResponse.json({ error: 'Scheme of work not found' }, { status: 404 })

    return NextResponse.json(scheme)
  } catch (error) {
    console.error('Error fetching scheme of work:', error)
    return NextResponse.json({ error: 'Failed to fetch scheme of work' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const teacher = await prisma.teacher.findUnique({ where: { userId: session.user.id } })
    if (!teacher) return NextResponse.json({ error: 'Teacher not found' }, { status: 404 })

    const existing = await prisma.schemeOfWork.findFirst({ where: { id, teacherId: teacher.id } })
    if (!existing) return NextResponse.json({ error: 'Scheme of work not found' }, { status: 404 })

    const body = await request.json()
    const { title, subject, grade, term, content, duration, objectives } = body

    const updated = await prisma.schemeOfWork.update({
      where: { id },
      data: { title, subject, grade, term, content, duration: duration ? parseInt(duration) : undefined, objectives }
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error updating scheme of work:', error)
    return NextResponse.json({ error: 'Failed to update scheme of work' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const teacher = await prisma.teacher.findUnique({ where: { userId: session.user.id } })
    if (!teacher) return NextResponse.json({ error: 'Teacher not found' }, { status: 404 })

    const existing = await prisma.schemeOfWork.findFirst({ where: { id, teacherId: teacher.id } })
    if (!existing) return NextResponse.json({ error: 'Scheme of work not found' }, { status: 404 })

    await prisma.schemeOfWork.delete({ where: { id } })
    return NextResponse.json({ message: 'Scheme of work deleted successfully' })
  } catch (error) {
    console.error('Error deleting scheme of work:', error)
    return NextResponse.json({ error: 'Failed to delete scheme of work' }, { status: 500 })
  }
}
