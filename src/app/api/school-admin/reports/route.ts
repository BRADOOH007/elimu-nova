import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { route } from '@/lib/api-middleware'

export const GET = route({ auth: 'SCHOOL_ADMIN' }, async (req, { user }) => {
  const schoolAdmin = await prisma.schoolAdmin.findUnique({
    where: { userId: user.id },
    select: { schoolId: true }
  })

    if (!schoolAdmin) {
      return NextResponse.json({ error: 'School admin not found' }, { status: 404 })
    }

    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'
    const search = searchParams.get('search') || ''
    const type = searchParams.get('type') || ''
    const status = searchParams.get('status') || ''

    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {
      schoolId: schoolAdmin.schoolId
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ]
    }

    if (type) {
      where.type = type
    }

    if (status) {
      where.status = status
    }

    // Get reports with pagination
    const [reports, total] = await Promise.all([
      prisma.report.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          generatedByUser: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          }
        }
      }),
      prisma.report.count({ where })
    ])

    const totalPages = Math.ceil(total / limit)

    return NextResponse.json({
      reports,
      pagination: {
        page,
        limit,
        total,
        totalPages
      }
    })
})

export const POST = route({ auth: 'SCHOOL_ADMIN' }, async (req, { user }) => {
  const schoolAdmin = await prisma.schoolAdmin.findUnique({
    where: { userId: user.id },
    select: { schoolId: true }
  })

    if (!schoolAdmin) {
      return NextResponse.json({ error: 'School admin not found' }, { status: 404 })
    }

    const body = await req.json()
    const {
      title,
      description,
      type,
      content,
      filters,
      isPublic = false,
      scheduledAt,
      expiresAt
    } = body

    // Generate sample content based on type
    const generateSampleContent = (reportType: string) => {
      const baseContent = {
        generatedAt: new Date().toISOString(),
        reportType: reportType,
        schoolId: schoolAdmin.schoolId,
        summary: {
          totalRecords: Math.floor(Math.random() * 1000) + 100,
          dateRange: {
            from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            to: new Date().toISOString().split('T')[0]
          }
        }
      }

      switch (reportType) {
        case 'ANALYTICS':
          return {
            ...baseContent,
            metrics: {
              totalUsers: Math.floor(Math.random() * 500) + 100,
              activeUsers: Math.floor(Math.random() * 300) + 50,
              pageViews: Math.floor(Math.random() * 10000) + 1000,
              bounceRate: (Math.random() * 0.5 + 0.2).toFixed(2),
              avgSessionDuration: Math.floor(Math.random() * 300) + 60
            },
            charts: [
              { type: 'line', title: 'User Growth Over Time', data: [] },
              { type: 'bar', title: 'Page Views by Section', data: [] }
            ]
          }
        case 'FINANCIAL':
          return {
            ...baseContent,
            revenue: {
              total: Math.floor(Math.random() * 100000) + 10000,
              monthly: Math.floor(Math.random() * 10000) + 1000,
              growth: (Math.random() * 20 - 5).toFixed(1) + '%'
            },
            expenses: {
              total: Math.floor(Math.random() * 80000) + 8000,
              breakdown: {
                salaries: Math.floor(Math.random() * 40000) + 4000,
                utilities: Math.floor(Math.random() * 5000) + 500,
                maintenance: Math.floor(Math.random() * 3000) + 300
              }
            }
          }
        case 'ACADEMIC':
          return {
            ...baseContent,
            students: {
              total: Math.floor(Math.random() * 1000) + 100,
              byGrade: {
                'Grade 1': Math.floor(Math.random() * 50) + 10,
                'Grade 2': Math.floor(Math.random() * 50) + 10,
                'Grade 3': Math.floor(Math.random() * 50) + 10
              }
            },
            performance: {
              averageScore: (Math.random() * 20 + 70).toFixed(1),
              passRate: (Math.random() * 20 + 75).toFixed(1) + '%',
              topSubjects: ['Mathematics', 'Science', 'English']
            }
          }
        case 'USER_ACTIVITY':
          return {
            ...baseContent,
            activity: {
              totalLogins: Math.floor(Math.random() * 5000) + 500,
              uniqueUsers: Math.floor(Math.random() * 200) + 50,
              peakHours: ['9:00 AM', '2:00 PM', '7:00 PM'],
              mostActivePages: ['Dashboard', 'Students', 'Teachers']
            }
          }
        case 'SYSTEM_HEALTH':
          return {
            ...baseContent,
            system: {
              uptime: '99.9%',
              responseTime: Math.floor(Math.random() * 100) + 50 + 'ms',
              errorRate: (Math.random() * 0.5).toFixed(2) + '%',
              storage: {
                used: Math.floor(Math.random() * 50) + 20 + 'GB',
                available: Math.floor(Math.random() * 100) + 50 + 'GB'
              }
            }
          }
        default:
          return baseContent
      }
    }

    // Create report
    const report = await prisma.report.create({
      data: {
        title,
        description,
        type,
        content: JSON.stringify(generateSampleContent(type)),
        filters: filters ? JSON.stringify(filters) : null,
        isPublic,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        schoolId: schoolAdmin.schoolId,
        generatedBy: user.id,
        status: 'COMPLETED'
      },
      include: {
        generatedByUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    })

    return NextResponse.json(report, { status: 201 })
})
