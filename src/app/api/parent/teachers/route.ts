import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { route } from '@/lib/api-middleware'

export const GET = route({ auth: 'PARENT' }, async (req, { user }) => {
  try {
    const parent = await prisma.parent.findUnique({
      where: { userId: user.id },
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
        id: t.id,
        name: `${t.user.firstName} ${t.user.lastName}`,
        email: t.user.email,
      }))

    return NextResponse.json({ teachers })
  } catch (error) {
    console.error('[GET_PARENT_TEACHERS]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
})
