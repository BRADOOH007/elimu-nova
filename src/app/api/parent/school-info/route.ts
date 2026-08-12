import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { route } from '@/lib/api-middleware'

export const GET = route({ auth: 'PARENT' }, async (req, { user }) => {
  const parent = await prisma.parent.findUnique({
    where: { userId: user.id },
    include: {
      students: {
        include: {
          student: {
            select: { school: { select: { id: true, name: true } } }
          }
        }
      }
    }
  })

  if (!parent) {
    return NextResponse.json({ school: null })
  }

  const school = parent.students.find(s => s.student.school)?.student.school || null

  return NextResponse.json({ school })
})
