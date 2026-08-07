import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { route } from '@/lib/api-middleware'

export const GET = route({ auth: 'STUDENT' }, async (req, { user }) => {
  try {
    const student = await prisma.student.findUnique({
      where: { userId: user.id },
      select: {
        id: true, schoolId: true, teacherId: true,
        user: { select: { schoolId: true } },
        teacher: { select: { id: true, user: { select: { firstName: true, lastName: true } } } },
      },
    })

    if (!student) return NextResponse.json({ teachers: [], isSchoolStudent: false, assignedTeacher: null })

    const isSchoolStudent = !!(student.schoolId || student.user?.schoolId)
    const assignedTeacher = student.teacher
      ? { id: student.teacher.id, name: `${student.teacher.user?.firstName || ''} ${student.teacher.user?.lastName || ''}`.trim() }
      : null

    let teachers: Array<{ id: string; name: string; subject: string }> = []

    if (isSchoolStudent) {
      const schoolTeachers = await prisma.teacher.findMany({
        where: { schoolId: student.schoolId || student.user?.schoolId || undefined },
        select: { id: true, user: { select: { firstName: true, lastName: true } }, subjects: true },
        take: 50,
      })
      teachers = schoolTeachers.map(t => ({
        id: t.id,
        name: `${t.user?.firstName || ''} ${t.user?.lastName || ''}`.trim(),
        subject: Array.isArray(t.subjects) ? t.subjects[0] || '' : '',
      }))
      // Sort — assigned teacher first
      if (assignedTeacher) {
        teachers = [
          assignedTeacher,
          ...teachers.filter(t => t.id !== assignedTeacher.id),
        ].map(t => ({ id: t.id, name: t.name, subject: t.subject || '' }))
      }
    } else if (assignedTeacher) {
      teachers = [{ id: assignedTeacher.id, name: assignedTeacher.name, subject: '' }]
    }

    return NextResponse.json({ teachers, isSchoolStudent, assignedTeacher })
  } catch {
    return NextResponse.json({ teachers: [], isSchoolStudent: false, assignedTeacher: null })
  }
})
