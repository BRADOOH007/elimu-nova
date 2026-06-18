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

    // Find parent record by user id
    const parent = await prismaClient.parent.findUnique({
      where: {
        userId: session.user.id
      },
      include: {
        students: {
          include: {
            student: {
              include: {
                user: true,
                class: true,
                analytics: true
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
}
