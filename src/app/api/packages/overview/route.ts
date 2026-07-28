import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { route } from '@/lib/api-middleware'

// GET - Fetch packages overview with subscription counts
export const GET = route({ auth: 'SUPER_ADMIN' }, async () => {

    const packages = await prisma.package.findMany({
      where: {
        isActive: true
      },
      include: {
        subscriptions: {
          where: {
            status: 'ACTIVE'
          },
          include: {
            school: {
              select: {
                id: true,
                name: true,
                students: {
                  select: {
                    id: true
                  }
                }
              }
            }
          }
        },
        _count: {
          select: {
            subscriptions: {
              where: {
                status: 'ACTIVE'
              }
            }
          }
        }
      },
      orderBy: {
        price: 'asc'
      }
    })

    // Format packages with additional metrics
    const formattedPackages = packages.map(pkg => {
      const activeSubscriptions = pkg.subscriptions
      const totalSchools = activeSubscriptions.length
      const totalStudents = activeSubscriptions.reduce((sum, sub) => {
        return sum + (sub.school?.students.length || 0)
      }, 0)
      
      // Calculate revenue
      const monthlyRevenue = totalSchools * pkg.price
      
      // Calculate utilization rate (students vs max capacity)
      const totalCapacity = totalSchools * pkg.maxStudents
      const utilizationRate = totalCapacity > 0 ? (totalStudents / totalCapacity) * 100 : 0

      return {
        id: pkg.id,
        name: pkg.name,
        description: pkg.description,
        price: pkg.price,
        duration: pkg.duration,
        maxTeachers: pkg.maxTeachers,
        maxStudents: pkg.maxStudents,
        features: pkg.features,
        isActive: pkg.isActive,
        createdAt: pkg.createdAt,
        updatedAt: pkg.updatedAt,
        metrics: {
          activeSubscriptions: totalSchools,
          totalStudents: totalStudents,
          monthlyRevenue: monthlyRevenue,
          utilizationRate: Math.round(utilizationRate),
          totalCapacity: totalCapacity
        },
        schools: activeSubscriptions.map(sub => ({
          id: sub.school?.id || '',
          name: sub.school?.name || '',
          studentCount: sub.school?.students.length || 0,
          startDate: sub.startDate,
          endDate: sub.endDate
        }))
      }
    })

    // Calculate summary statistics
    const totalPackages = packages.length
    const totalActiveSubscriptions = packages.reduce((sum, pkg) => sum + pkg._count.subscriptions, 0)
    const totalMonthlyRevenue = formattedPackages.reduce((sum, pkg) => sum + pkg.metrics.monthlyRevenue, 0)
    const averageUtilization = formattedPackages.length > 0 
      ? Math.round(formattedPackages.reduce((sum, pkg) => sum + pkg.metrics.utilizationRate, 0) / formattedPackages.length)
      : 0

    const overview = {
      packages: formattedPackages,
      summary: {
        totalPackages,
        totalActiveSubscriptions,
        totalMonthlyRevenue,
        averageUtilization,
        totalSchools: totalActiveSubscriptions,
        totalStudents: formattedPackages.reduce((sum, pkg) => sum + pkg.metrics.totalStudents, 0)
      }
    }

    return NextResponse.json(overview)
})
