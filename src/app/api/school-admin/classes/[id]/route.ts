import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { route } from '@/lib/api-middleware'

export const PUT = route({ auth: 'SCHOOL_ADMIN' }, async (req, { user, params }) => {
  const { id } = await params
  const schoolAdmin = await prisma.schoolAdmin.findUnique({ where: { userId: user.id } })
    if (!schoolAdmin) return NextResponse.json({ error: 'School admin not found' }, { status: 404 })

    const cls = await prisma.class.findFirst({ where: { id, schoolId: schoolAdmin.schoolId } })
    if (!cls) return NextResponse.json({ error: 'Class not found' }, { status: 404 })

    const body = await req.json()
    const { name, description, subject, grade, teacherId } = body

    // When the class teacher changes, propagate to all students already in the
    // class so they show up in the new teacher's roster/dashboard immediately.
    if (teacherId && teacherId !== cls.teacherId) {
      await prisma.student.updateMany({
        where: { classId: id },
        data: { teacherId },
      })
    }

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
})

export const DELETE = route({ auth: 'SCHOOL_ADMIN' }, async (req, { user, params }) => {
  const { id } = await params
  const schoolAdmin = await prisma.schoolAdmin.findUnique({ where: { userId: user.id } })
    if (!schoolAdmin) return NextResponse.json({ error: 'School admin not found' }, { status: 404 })

    const cls = await prisma.class.findFirst({ where: { id, schoolId: schoolAdmin.schoolId } })
    if (!cls) return NextResponse.json({ error: 'Class not found' }, { status: 404 })

    await prisma.class.delete({ where: { id } })
    return NextResponse.json({ message: 'Class deleted successfully' })
})
