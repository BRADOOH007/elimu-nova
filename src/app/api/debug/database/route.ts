import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    // Allow access for debugging (can be restricted later)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const debug = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      user: {
        id: session.user.id,
        role: session.user.role,
        email: session.user.email
      },
      tests: {} as any
    }

    // Test 1: Basic database connection
    try {
      console.log('Testing basic database connection...')
      const result = await prisma.$queryRaw`SELECT 1 as test`
      debug.tests.basicConnection = {
        success: true,
        result: result
      }
      console.log('✅ Basic database connection successful')
    } catch (error) {
      console.error('❌ Basic database connection failed:', error)
      debug.tests.basicConnection = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    }

    // Test 2: Count all tables
    try {
      console.log('Testing table counts...')
      const [users, schools, teachers, students, packages, subscriptions] = await Promise.all([
        prisma.user.count(),
        prisma.school.count(),
        prisma.teacher.count(),
        prisma.student.count(),
        prisma.package.count(),
        prisma.subscription.count()
      ])

      debug.tests.tableCounts = {
        success: true,
        counts: {
          users,
          schools,
          teachers,
          students,
          packages,
          subscriptions
        }
      }
      console.log('✅ Table counts successful:', { users, schools, teachers, students, packages, subscriptions })
    } catch (error) {
      console.error('❌ Table counts failed:', error)
      debug.tests.tableCounts = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }

    // Test 3: Test user's specific data
    try {
      console.log(`Testing user-specific data for ${session.user.id}...`)
      const userData = await prisma.user.findUnique({
        where: { id: session.user.id },
        include: {
          teacher: {
            include: {
              school: { select: { name: true } }
            }
          },
          student: {
            include: {
              school: { select: { name: true } }
            }
          },
          schoolAdmin: {
            include: {
              school: { select: { name: true } }
            }
          }
        }
      })

      debug.tests.userData = {
        success: true,
        data: userData
      }
      console.log('✅ User data retrieval successful')
    } catch (error) {
      console.error('❌ User data retrieval failed:', error)
      debug.tests.userData = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }

    // Test 4: Test dashboard-specific queries
    try {
      console.log('Testing dashboard queries...')
      
      if (session.user.role === 'SCHOOL_ADMIN') {
        const schoolAdmin = await prisma.schoolAdmin.findUnique({
          where: { userId: session.user.id }
        })

        if (schoolAdmin?.schoolId) {
          const [teacherCount, studentCount, school] = await Promise.all([
            prisma.teacher.count({ where: { schoolId: schoolAdmin.schoolId } }),
            prisma.student.count({ where: { schoolId: schoolAdmin.schoolId } }),
            prisma.school.findUnique({ 
              where: { id: schoolAdmin.schoolId },
              include: {
                subscriptions: {
                  include: { package: true },
                  orderBy: { createdAt: 'desc' },
                  take: 1
                }
              }
            })
          ])

          debug.tests.dashboardQueries = {
            success: true,
            schoolId: schoolAdmin.schoolId,
            data: {
              teacherCount,
              studentCount,
              school: school ? {
                name: school.name,
                subscription: school.subscriptions[0] || null
              } : null
            }
          }
        }
      } else if (session.user.role === 'TEACHER') {
        const teacher = await prisma.teacher.findUnique({
          where: { userId: session.user.id },
          include: {
            school: { select: { name: true } },
            students: { take: 5 }
          }
        })

        debug.tests.dashboardQueries = {
          success: true,
          data: {
            teacher: teacher ? {
              schoolId: teacher.schoolId,
              schoolName: teacher.school?.name,
              studentCount: teacher.students.length
            } : null
          }
        }
      }

      console.log('✅ Dashboard queries successful')
    } catch (error) {
      console.error('❌ Dashboard queries failed:', error)
      debug.tests.dashboardQueries = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }

    // Test 5: Environment variables check
    debug.tests.environment = {
      hasDatabase: !!process.env.DATABASE_URL,
      hasNextAuth: !!process.env.NEXTAUTH_SECRET,
      hasNextAuthUrl: !!process.env.NEXTAUTH_URL,
      nodeEnv: process.env.NODE_ENV,
      databaseUrlPrefix: process.env.DATABASE_URL?.substring(0, 20) + '...' || 'Not set'
    }

    return NextResponse.json(debug)
  } catch (error) {
    console.error('❌ Debug endpoint failed:', error)
    return NextResponse.json({
      error: 'Debug endpoint failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}