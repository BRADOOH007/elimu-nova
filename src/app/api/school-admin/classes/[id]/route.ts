import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (session.user.role !== 'SCHOOL_ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const schoolAdmin = await prisma.schoolAdmin.findUnique({ where: { userId: session.user.id } })
    if (!schoolAdmin) return NextResponse.json({ error: 'School admin not found' }, { status: 404 })

    const cls = await prisma.class.findFirst({ where: { id, schoolId: schoolAdmin.schoolId } })
    if (!cls) return NextResponse.json({ error: 'Class not found' }, { status: 404 })

    const body = await request.json()
    const { name, description, subject, grade, teacherId } = body

    const updated = await prisma.class.update({
      where: { id },
      data: { name, description, subject, grade, teacherId: teacherId || null },
      include: {
        teacher: { include: { user: { select: { firstName: true, lastName: true, email: true } } } },
        students: { select: { id: true } }
      }
    })

    return NextResponse.json({
      id: updated.id,
      name: updated.name,
      description: updated.description,
      subject: updated.subject,
      grade: updated.grade,
      isActive: updated.isActive,
      studentCount: updated.students.length,
      teacherName: updated.teacher ? `${updated.teacher.user.firstName} ${updated.teacher.user.lastName}` : '',
      teacherEmail: updated.teacher?.user.email || '',
      teacherId: updated.teacherId,
      createdAt: updated.createdAt
    })
  } catch (error) {
    console.error('Error updating class:', error)
    return NextResponse.json({ error: 'Failed to update class' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (session.user.role !== 'SCHOOL_ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const schoolAdmin = await prisma.schoolAdmin.findUnique({ where: { userId: session.user.id } })
    if (!schoolAdmin) return NextResponse.json({ error: 'School admin not found' }, { status: 404 })

    const cls = await prisma.class.findFirst({ where: { id, schoolId: schoolAdmin.schoolId } })
    if (!cls) return NextResponse.json({ error: 'Class not found' }, { status: 404 })

    await prisma.class.delete({ where: { id } })
    return NextResponse.json({ message: 'Class deleted successfully' })
  } catch (error) {
    console.error('Error deleting class:', error)
    return NextResponse.json({ error: 'Failed to delete class' }, { status: 500 })
  }
}
