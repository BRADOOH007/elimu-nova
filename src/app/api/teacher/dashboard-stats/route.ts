import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { cache } from '@/lib/redis'
import { CacheKeys, TTL } from '@/lib/cache-helpers'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check cache first
    const cacheKey = CacheKeys.dashboardStats(session.user.id)
    try {
      const cached = await cache.get(cacheKey)
      if (cached) return NextResponse.json(JSON.parse(cached))
    } catch { /* cache miss — continue */ }

    console.log('🔍 Looking for teacher with userId:', session.user.id)
    
    // Get teacher profile
    let teacher = await prisma.teacher.findUnique({
      where: { userId: session.user.id },
      include: {
        user: true,
        school: true,
        students: true,
        lessonPlans: true,
        assignments: {
          include: {
            submissions: true
          }
        }
      }
    })

    // If no teacher profile exists, create one for independent teaching
    if (!teacher) {
      console.log('🆕 Creating independent teacher profile for userId:', session.user.id)
      teacher = await prisma.teacher.create({
        data: {
          userId: session.user.id,
          // schoolId is optional and will be undefined for independent teachers
        },
        include: {
          user: true,
          school: true,
          students: true,
          lessonPlans: true,
          assignments: {
            include: {
              submissions: true
            }
          }
        }
      })
      console.log('✅ Created independent teacher profile')
    }

    if (!teacher) {
      console.log('❌ Failed to create or find teacher profile')
      return NextResponse.json({ error: 'Failed to create teacher profile' }, { status: 500 })
    }

    console.log('✅ Found teacher:', teacher.user.email)

    // Calculate stats
    const totalStudents = teacher.students.length
    const activeLessonPlans = teacher.lessonPlans.length
    const totalAssignments = teacher.assignments.length
    
    // Calculate pending assignments (not graded yet)
    const pendingAssignments = teacher.assignments.filter(assignment => 
      assignment.submissions.every(submission => submission.status !== 'GRADED')
    ).length

    // Calculate completed assignments this week
    const startOfWeek = new Date()
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay())
    startOfWeek.setHours(0, 0, 0, 0)

    const completedThisWeek = teacher.assignments.filter(assignment => 
      assignment.submissions.some(submission => 
        submission.status === 'GRADED' && 
        submission.submittedAt && 
        submission.submittedAt >= startOfWeek
      )
    ).length

    // Generate some sample recent activities for independent teachers
    const recentActivities = [
      {
        id: '1',
        type: 'CONTENT_CREATED',
        action: 'Created',
        description: 'Welcome to your independent teaching workspace!',
        time: new Date().toISOString(),
        user: `${teacher.user.firstName} ${teacher.user.lastName}`,
        metadata: { activityType: 'welcome' }
      }
    ]

    const stats = {
      totalStudents: {
        value: totalStudents,
        change: totalStudents > 0 ? `+${totalStudents} students` : 'No students yet',
        changeType: totalStudents > 0 ? 'positive' : 'neutral' as const
      },
      activeLessonPlans: {
        value: activeLessonPlans,
        change: activeLessonPlans > 0 ? `${activeLessonPlans} active plans` : 'Create your first lesson plan',
        changeType: activeLessonPlans > 0 ? 'positive' : 'neutral' as const
      },
      pendingAssignments: {
        value: pendingAssignments,
        change: pendingAssignments > 0 ? `${pendingAssignments} pending` : 'No pending assignments',
        changeType: pendingAssignments > 0 ? 'warning' : 'positive' as const
      },
      completedThisWeek: {
        value: completedThisWeek,
        change: completedThisWeek > 0 ? `${completedThisWeek} completed` : 'No completions this week',
        changeType: completedThisWeek > 0 ? 'positive' : 'neutral' as const
      }
    }

    const responseData = { stats, recentActivities }

    // Write to cache (2 min TTL — stats update on teacher activity)
    try { await cache.set(cacheKey, JSON.stringify(responseData), TTL.MEDIUM) } catch { /* non-fatal */ }

    return NextResponse.json(responseData)

  } catch (error) {
    console.error('Error fetching teacher dashboard stats:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch dashboard stats',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}