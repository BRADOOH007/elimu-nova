import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { route } from '@/lib/api-middleware'

export const GET = route({ auth: 'SUPER_ADMIN' }, async (req, { user }) => {
  const { searchParams } = new URL(req.url)
  const limit = parseInt(searchParams.get('limit') || '5')

  const recentSchools = await prisma.school.findMany({
    take: limit,
    orderBy: {
      createdAt: 'desc'
    },
    include: {
      schoolAdmin: {
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true
            }
          }
        }
      },
      students: {
        select: {
          id: true
        }
      },
      subscriptions: {
        where: {
          status: 'ACTIVE'
        },
        include: {
          package: {
            select: {
              price: true
            }
          }
        }
      }
    }
  })

  const formattedSchools = recentSchools.map((school: any) => {
    const adminName = school.schoolAdmin?.user
      ? `${school.schoolAdmin.user.firstName} ${school.schoolAdmin.user.lastName}`
      : 'No Admin'

    const studentCount = school.students.length

    const monthlyRevenue = school.subscriptions.reduce((sum: number, sub: any) => sum + (sub.package?.price || 0), 0)
    const formattedRevenue = monthlyRevenue > 0
      ? `$${monthlyRevenue.toLocaleString()}`
      : '$0'

    return {
      id: school.id,
      name: school.name,
      admin: adminName,
      students: studentCount,
      status: school.isActive ? 'Active' : 'Inactive',
      revenue: formattedRevenue,
      createdAt: school.createdAt,
      email: school.email,
      address: school.address
    }
  })

  return NextResponse.json(formattedSchools)
})
