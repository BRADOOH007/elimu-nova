import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { route } from '@/lib/api-middleware'

const prismaClient = prisma as any

export const GET = route({ auth: 'PARENT' }, async (req, { user }) => {
  try {
    // Get search params
    const { searchParams } = new URL(req.url)
    const studentId = searchParams.get('studentId')

    // Find parent record
    const parent = await prismaClient.parent.findUnique({
      where: {
        userId: user.id
      },
      include: {
        students: {
          include: {
            student: true
          }
        }
      }
    })

    if (!parent) {
      return NextResponse.json({ error: 'Parent not found' }, { status: 404 })
    }

    // Get student ids linked to parent
    const studentIds = parent.students.map((ps: any) => ps.student.id)

    let assignments
    if (studentId) {
      if (!studentIds.includes(studentId)) {
        return NextResponse.json({ error: 'Student not linked to parent' }, { status: 403 })
      }
      // Get assignments for specific student
      assignments = await prisma.assignment.findMany({
        where: {
          students: {
            some: {
              id: studentId
            }
          }
        },
        include: {
          teacher: { include: { user: true } },
          submissions: {
            where: {
              studentId: studentId
            }
          }
        },
        orderBy: {
          dueDate: 'desc'
        }
      })
    } else {
      // Get assignments for all students
      assignments = await prisma.assignment.findMany({
        where: {
          students: {
            some: {
              id: {
                in: studentIds
              }
            }
          }
        },
        include: {
          teacher: { include: { user: true } },
          submissions: {
            where: {
              studentId: {
                in: studentIds
              }
            },
            include: {
              student: { include: { user: true } }
            }
          }
        },
        orderBy: {
          dueDate: 'desc'
        }
      })
    }

    return NextResponse.json({ assignments })
  } catch (error) {
    console.error('[GET_PARENT_ASSIGNMENTS]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
})
