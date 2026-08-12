import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { route } from '@/lib/api-middleware'

export const GET = route({ auth: 'STUDENT' }, async (req, { user }) => {
  const student = await prisma.student.findUnique({
    where: { userId: user.id },
    include: {
      user: { select: { firstName: true, lastName: true, email: true, phone: true, isActive: true, createdAt: true } },
      class: { select: { id: true, name: true, grade: true } },
      teacher: { include: { user: { select: { firstName: true, lastName: true } } } },
      school: { select: { id: true, name: true } },
    }
  })

  if (!student) {
    return NextResponse.json({ error: 'Student profile not found' }, { status: 404 })
  }

  return NextResponse.json({
    id: student.id,
    firstName: student.user.firstName,
    lastName: student.user.lastName,
    email: student.user.email,
    className: student.class?.name || null,
    grade: student.class?.grade || null,
    teacher: student.teacher?.user ? `${student.teacher.user.firstName} ${student.teacher.user.lastName}` : null,
    school: student.school?.name || null,
  })
})
