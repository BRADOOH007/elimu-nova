import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const lessonPlan = await prisma.lessonPlan.findUnique({
      where: { id },
      include: {
        teacher: { include: { user: { select: { firstName: true, lastName: true } } } }
      }
    })
    if (!lessonPlan) return NextResponse.json({ error: 'Lesson plan not found' }, { status: 404 })

    return NextResponse.json(lessonPlan)
  } catch (error) {
    console.error('Error fetching lesson plan:', error)
    return NextResponse.json({ error: 'Failed to fetch lesson plan' }, { status: 500 })
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

    const existing = await prisma.lessonPlan.findFirst({ where: { id, teacherId: teacher.id } })
    if (!existing) return NextResponse.json({ error: 'Lesson plan not found' }, { status: 404 })

    const body = await request.json()
    const { title, subject, grade, content, schemeOfWorkId } = body

    const updated = await prisma.lessonPlan.update({
      where: { id },
      data: { title, subject, grade, content, schemeOfWorkId }
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error updating lesson plan:', error)
    return NextResponse.json({ error: 'Failed to update lesson plan' }, { status: 500 })
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

    const existing = await prisma.lessonPlan.findFirst({ where: { id, teacherId: teacher.id } })
    if (!existing) return NextResponse.json({ error: 'Lesson plan not found' }, { status: 404 })

    await prisma.lessonPlan.delete({ where: { id } })
    return NextResponse.json({ message: 'Lesson plan deleted successfully' })
  } catch (error) {
    console.error('Error deleting lesson plan:', error)
    return NextResponse.json({ error: 'Failed to delete lesson plan' }, { status: 500 })
  }
}
