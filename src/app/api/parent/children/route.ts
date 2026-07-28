import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { route } from '@/lib/api-middleware'

const prismaClient = prisma as any

export const GET = route({ auth: 'PARENT' }, async (req, { user }) => {
  try {
    // Find parent record by user id
    const parent = await prismaClient.parent.findUnique({
      where: {
        userId: user.id
      },
      include: {
        students: {
          include: {
            student: {
              include: {
                user: true,
                class: true,
                school: true,
                analytics: true,
                studentProgress: {
                  include: {
                    skillMastery: true
                  }
                }
              }
            }
          }
        }
      }
    })

    if (!parent) {
      return NextResponse.json({ error: 'Parent not found' }, { status: 404 })
    }

    const children = parent.students.map((ps: any) => ps.student)
    return NextResponse.json({ children })
  } catch (error) {
    console.error('[GET_PARENT_CHILDREN]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
})
