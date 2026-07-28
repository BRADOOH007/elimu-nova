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

    const { searchParams } = new URL(req.url)
    const teacherId = searchParams.get('teacherId')

    // Build where clause
    const where: any = {
      schoolId: schoolAdmin.schoolId,
      isActive: true
    }

    // If teacherId is provided, filter by teacher
    if (teacherId) {
      where.teacherId = teacherId
    }

    // Get all active classes in the school
    const classes = await prisma.class.findMany({
      where,
      include: {
        teacher: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true
              }
            }
          }
        },
        students: {
          select: { id: true }
        }
      },
      orderBy: {
        name: 'asc'
      }
    })

    const formattedClasses = classes.map(cls => ({
      id: cls.id,
      name: cls.name,
      subject: cls.subject,
      grade: cls.grade,
      teacherName: `${cls.teacher.user.firstName} ${cls.teacher.user.lastName}`,
      studentCount: cls.students.length
    }))

    return NextResponse.json({ classes: formattedClasses })
})
