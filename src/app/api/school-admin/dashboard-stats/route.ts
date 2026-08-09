import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { cache } from '@/lib/redis'
import { CacheKeys, TTL } from '@/lib/cache-helpers'
import { route } from '@/lib/api-middleware'

export const GET = route({ auth: 'SCHOOL_ADMIN' }, async (req, { user }) => {
  const cacheKey = CacheKeys.dashboardStats(user.id)
    try {
      const cached = await cache.get(cacheKey)
      if (cached) return NextResponse.json(JSON.parse(cached))
    } catch { /* cache miss */ }

    const schoolAdmin = await prisma.schoolAdmin.findUnique({
      where: { userId: user.id },
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
      gradeGroups,
      teachersWithSubjects,
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
      prisma.student.groupBy({
        by: ['classId'],
        where: { schoolId, classId: { not: null } },
        _count: { _all: true }
      }),
      prisma.teacher.count({ where: { schoolId, subjects: { isEmpty: false } } }),
    ])

    const classGrades = await prisma.class.findMany({
      where: { schoolId, deletedAt: null },
      select: { id: true, grade: true }
    })
    const gradeMap = new Map<string, number>()
    for (const g of gradeGroups) {
      if (!g.classId) continue
      const cls = classGrades.find(c => c.id === g.classId)
      const key = cls?.grade || 'Unassigned'
      gradeMap.set(key, (gradeMap.get(key) || 0) + g._count._all)
    }
    const gradeBreakdown = Array.from(gradeMap.entries())
      .map(([grade, count]) => ({ grade, count }))
      .sort((a, b) => a.grade.localeCompare(b.grade, undefined, { numeric: true }))

    const submissionStats = await prisma.submission.findMany({
      where: { student: { schoolId } },
      select: { grade: true },
    })
    const totalSubmissions = submissionStats.length
    const gradedSubmissions = submissionStats.filter(s => s.grade !== null).length
    const cbcReadiness = totalSubmissions > 0
      ? Math.round((gradedSubmissions / totalSubmissions) * 100)
      : 100
    const pendingReviews = totalSubmissions - gradedSubmissions

    // Academic term tracking
    const now = new Date()
    const year = now.getFullYear()
    const terms = await prisma.academicCalendar.findMany({
      where: { schoolId, year },
      orderBy: { term: 'asc' },
    })

    // Fallback: Kenya standard term structure when no calendar rows exist yet
    const termDefaults = [
      { term: 1, termName: 'Term 1', start: new Date(year, 0, 5), end: new Date(year, 3, 4), weeksCount: 13, breaks: [{ name: 'Half-term Break', start: new Date(year, 1, 23), end: new Date(year, 1, 27) }], holidays: [] },
      { term: 2, termName: 'Term 2', start: new Date(year, 3, 28), end: new Date(year, 6, 25), weeksCount: 13, breaks: [{ name: 'Half-term Break', start: new Date(year, 5, 2), end: new Date(year, 5, 6) }], holidays: [] },
      { term: 3, termName: 'Term 3', start: new Date(year, 8, 2), end: new Date(year, 10, 1), weeksCount: 11, breaks: [{ name: 'Half-term Break', start: new Date(year, 9, 13), end: new Date(year, 9, 17) }], holidays: [] },
    ]
    const resolvedTerms = terms.length > 0
      ? terms.map(t => ({ term: t.term, termName: t.termName, start: t.startDate, end: t.endDate, weeksCount: t.weeksCount, breaks: (t.breaks as Array<{ name: string; start: string; end: string }> | null) || [], holidays: (t.holidays as Array<{ name: string; date: string }> | null) || [] }))
      : termDefaults

    const currentTerm = resolvedTerms.find(t => now >= t.start && now <= t.end)
    let termInfo = null
    if (currentTerm) {
      const weekNum = Math.min(
        Math.floor((now.getTime() - currentTerm.start.getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1,
        currentTerm.weeksCount
      )
      const upcomingBreak = currentTerm.breaks.find(b => new Date(b.start) > now)
      const upcomingHoliday = currentTerm.holidays.find(h => new Date(h.date) > now)
      const nextEvent = upcomingBreak?.name || upcomingHoliday?.name || 'End of Term'
      termInfo = {
        termName: currentTerm.termName,
        term: currentTerm.term,
        weekNumber: weekNum,
        weeksCount: currentTerm.weeksCount,
        nextEvent,
      }
    } else {
      // Between terms — show the nearest upcoming term
      const nextTerm = resolvedTerms.find(t => t.start > now)
      if (nextTerm) {
        termInfo = {
          termName: nextTerm.termName,
          term: nextTerm.term,
          weekNumber: 0,
          weeksCount: nextTerm.weeksCount,
          nextEvent: `${nextTerm.termName} begins ${nextTerm.start.toLocaleDateString()}`,
        }
      }
    }

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
      gradeBreakdown,
      subjectCoverage: {
        total: totalTeachers,
        assigned: teachersWithSubjects
      },
      cbcReadiness: {
        percent: cbcReadiness,
        total: totalSubmissions,
        pending: pendingReviews
      },
      termInfo,
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
})
