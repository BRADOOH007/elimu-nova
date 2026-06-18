import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const prismaClient = prisma as any

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get('studentId')

    const parent = await prismaClient.parent.findUnique({
      where: {
        userId: session.user.id
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
              schedules: { orderBy: { startTime: 'asc' } }
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
            include: { schedules: { orderBy: { startTime: 'asc' } } }
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
}
