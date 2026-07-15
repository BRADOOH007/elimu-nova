import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { cache } from '@/lib/redis'
import { CacheKeys, TTL } from '@/lib/cache-helpers'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'SCHOOL_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const cacheKey = CacheKeys.dashboardStats(session.user.id)
    try {
      const cached = await cache.get(cacheKey)
      if (cached) return NextResponse.json(JSON.parse(cached))
    } catch { /* cache miss */ }

    const schoolAdmin = await prisma.schoolAdmin.findUnique({
      where: { userId: session.user.id },
      include: { school: { select: { id: true, name: true, address: true, phone: true, email: true, isActive: true } } }
    })

    if (!schoolAdmin || !schoolAdmin.school) {
      return NextResponse.json({ error: 'School admin record not found' }, { status: 404 })
    }

    const schoolId = schoolAdmin.schoolId

    const [
      totalTeachers, activeTeachers,
      totalStudents, activeStudents,
      totalClasses,
      subscription,
      recentTeachers,
      recentStudents,
      recentActivities,
      upcomingMeetings,
    ] = await Promise.all([
      prisma.teacher.count({ where: { schoolId } }),
      prisma.teacher.count({ where: { schoolId, user: { isActive: true } } }),
      prisma.student.count({ where: { schoolId } }),
      prisma.student.count({ where: { schoolId, user: { isActive: true } } }),
      prisma.class.count({ where: { teacher: { schoolId } } }),
      prisma.subscription.findFirst({
        where: { schoolId },
        include: { package: true },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.teacher.findMany({
        where: { schoolId },
        include: {
          user: { select: { firstName: true, lastName: true, email: true, isActive: true, createdAt: true } },
          students: { select: { id: true } }
        },
        orderBy: { user: { createdAt: 'desc' } },
        take: 5
      }),
      prisma.student.findMany({
        where: { schoolId },
        include: {
          user: { select: { firstName: true, lastName: true, email: true, isActive: true, createdAt: true } },
          teacher: { include: { user: { select: { firstName: true, lastName: true } } } }
        },
        orderBy: { user: { createdAt: 'desc' } },
        take: 5
      }),
      prisma.activity.findMany({
        where: { schoolId },
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          user: { select: { firstName: true, lastName: true, email: true, role: true } }
        }
      }),
      prisma.meeting.findMany({
        where: { schoolId, status: { notIn: ['COMPLETED', 'CANCELLED'] }, date: { gte: new Date() } },
        orderBy: { date: 'asc' },
        take: 5,
        include: {
          creator: { select: { firstName: true, lastName: true } }
        }
      }),
    ])

    const monthlyRevenue = subscription?.amount || 0

    const responseData = {
      stats: {
        totalTeachers: { value: totalTeachers, change: `${activeTeachers} active` },
        activeTeachers: { value: activeTeachers, change: `${Math.round((activeTeachers / Math.max(totalTeachers, 1)) * 100)}% active` },
        totalStudents: { value: totalStudents, change: `${activeStudents} active` },
        activeStudents: { value: activeStudents, change: `${Math.round((activeStudents / Math.max(totalStudents, 1)) * 100)}% active` },
        totalClasses: { value: totalClasses, change: totalClasses > 0 ? `${Math.round(totalStudents / Math.max(totalClasses, 1))} avg students/class` : 'No classes' },
        activeClasses: { value: totalClasses, change: totalClasses > 0 ? `${Math.round(totalStudents / Math.max(totalClasses, 1))} avg students/class` : 'No active classes' },
        monthlyRevenue: { value: monthlyRevenue, change: subscription ? `${subscription.package.name} plan` : 'No subscription' }
      },
      schoolInfo: {
        id: schoolAdmin.school.id,
        name: schoolAdmin.school.name,
        address: schoolAdmin.school.address,
        phone: schoolAdmin.school.phone,
        email: schoolAdmin.school.email,
        isActive: schoolAdmin.school.isActive,
        subscription: subscription ? {
          id: subscription.id,
          status: subscription.status,
          packageName: subscription.package.name,
          amount: subscription.amount,
          startDate: subscription.startDate,
          endDate: subscription.endDate,
          daysRemaining: Math.max(0, Math.ceil((subscription.endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
        } : null
      },
      recentTeachers: recentTeachers.map(teacher => ({
        id: teacher.id,
        name: `${teacher.user.firstName} ${teacher.user.lastName}`,
        email: teacher.user.email,
        students: teacher.students?.length || 0,
        status: teacher.user.isActive ? 'Active' : 'Inactive',
        joinDate: teacher.user.createdAt.toLocaleDateString(),
        isActive: teacher.user.isActive,
        joinedAt: teacher.user.createdAt
      })),
      recentStudents: recentStudents.map(student => ({
        id: student.id,
        name: `${student.user.firstName} ${student.user.lastName}`,
        email: student.user.email,
        teacher: student.teacher ? `${student.teacher.user.firstName} ${student.teacher.user.lastName}` : 'No teacher',
        status: student.user.isActive ? 'Active' : 'Inactive',
        joinDate: student.user.createdAt.toLocaleDateString(),
        isActive: student.user.isActive,
        joinedAt: student.user.createdAt
      })),
      recentActivities: recentActivities.map(a => ({
        id: a.id,
        type: a.type,
        action: a.type,
        description: a.description,
        metadata: a.metadata,
        user: a.user ? { name: `${a.user.firstName} ${a.user.lastName}`, email: a.user.email, role: a.user.role } : null,
        createdAt: a.createdAt.toISOString()
      })),
      upcomingMeetings: upcomingMeetings.map(m => ({
        id: m.id,
        title: m.title,
        description: m.description,
        date: m.date.toISOString(),
        time: m.time,
        duration: m.duration,
        location: m.location,
        status: m.status,
        creator: m.creator ? `${m.creator.firstName} ${m.creator.lastName}` : 'Unknown',
      })),
    }

    try { await cache.set(cacheKey, JSON.stringify(responseData), TTL.MEDIUM) } catch { /* non-fatal */ }

    return NextResponse.json(responseData)
  } catch (error) {
    console.error('Error fetching school admin dashboard stats:', error)
    return NextResponse.json({ error: 'Failed to fetch dashboard statistics' }, { status: 500 })
  }
}
