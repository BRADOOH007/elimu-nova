import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { route } from '@/lib/api-middleware'

export const GET = route({ auth: 'SCHOOL_ADMIN' }, async (req, { user }) => {
  const schoolAdmin = await prisma.schoolAdmin.findUnique({
    where: { userId: user.id }
  })

    if (!schoolAdmin) {
      return NextResponse.json({ error: 'School admin not found' }, { status: 404 })
    }

    // Get all active teachers in the school
    const teachers = await prisma.teacher.findMany({
      where: {
        schoolId: schoolAdmin.schoolId,
        user: { isActive: true }
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        students: {
          select: { id: true }
        }
      },
      orderBy: {
        user: { firstName: 'asc' }
      }
    })

    const formattedTeachers = teachers.map(teacher => ({
      id: teacher.id,
      userId: teacher.user.id,
      name: `${teacher.user.firstName} ${teacher.user.lastName}`,
      email: teacher.user.email,
      studentCount: teacher.students.length
    }))

    return NextResponse.json({ teachers: formattedTeachers })
})
