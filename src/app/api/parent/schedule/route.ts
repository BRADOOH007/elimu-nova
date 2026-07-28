import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { route } from '@/lib/api-middleware'

const prismaClient = prisma as any

export const GET = route({ auth: 'PARENT' }, async (req, { user }) => {
  try {
    const { searchParams } = new URL(req.url)
    const studentId = searchParams.get('studentId')

    const parent = await prismaClient.parent.findUnique({
      where: {
        userId: user.id
      },
      include: { students: { include: { student: true } } }
    })

    if (!parent) {
      return NextResponse.json({ error: 'Parent not found' }, { status: 404 })
    }

    const studentIds = parent.students.map((ps: any) => ps.student.id)

    let schedules
    if (studentId) {
      if (!studentIds.includes(studentId)) {
        return NextResponse.json({ error: 'Student not linked to parent' }, { status: 403 })
      }
      const student = await prisma.student.findUnique({
        where: { id: studentId },
        include: {
          class: {
            include: {
              schedules: {
                include: {
                  teacher: {
                    include: {
                      user: { select: { firstName: true, lastName: true } }
                    }
                  }
                },
                orderBy: { startTime: 'asc' }
              }
            }
          }
        }
      })
      schedules = student?.class?.schedules
    } else {
      // Get all schedules for all linked students
      const students = await prisma.student.findMany({
        where: { id: { in: studentIds } },
        include: {
          class: {
            include: {
              schedules: {
                include: {
                  teacher: {
                    include: {
                      user: { select: { firstName: true, lastName: true } }
                    }
                  }
                },
                orderBy: { startTime: 'asc' }
              }
            }
          }
        }
      })
      schedules = students.flatMap((s) => s.class?.schedules || [])
    }

    return NextResponse.json({ schedules })
  } catch (error) {
    console.error('[GET_PARENT_SCHEDULE]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
})
