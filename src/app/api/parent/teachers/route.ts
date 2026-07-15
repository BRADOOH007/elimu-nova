import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const parent = await prisma.parent.findUnique({
      where: { userId: session.user.id },
      include: {
        students: {
          include: {
            student: {
              include: {
                teacher: {
                  include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } }
                }
              }
            }
          }
        }
      }
    })

    if (!parent) {
      return NextResponse.json({ teachers: [] })
    }

    const seen = new Set<string>()
    const teachers = parent.students
      .map(ps => ps.student.teacher)
      .filter((t): t is NonNullable<typeof t> => t !== null)
      .filter(t => {
        if (seen.has(t.user.id)) return false
        seen.add(t.user.id)
        return true
      })
      .map(t => ({
        id: t.user.id,
        name: `${t.user.firstName} ${t.user.lastName}`,
        email: t.user.email,
      }))

    return NextResponse.json({ teachers })
  } catch (error) {
    console.error('[GET_PARENT_TEACHERS]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
