import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { route } from '@/lib/api-middleware'

export const GET = route({ auth: ['SUPER_ADMIN', 'SCHOOL_ADMIN'] }, async (req, { user }) => {
  const { searchParams } = new URL(req.url)
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '10')
  const search = searchParams.get('search') || ''
  const status = searchParams.get('status') || ''
  const type = searchParams.get('type') || ''
  const sortBy = searchParams.get('sortBy') || 'createdAt'
  const sortOrder = searchParams.get('sortOrder') || 'desc'

  const where: any = {}

  if (user.role === 'SCHOOL_ADMIN') {
    const schoolAdmin = await prisma.schoolAdmin.findFirst({
      where: { userId: user.id },
      select: { schoolId: true }
    })

    if (!schoolAdmin) {
      return NextResponse.json({ error: 'School admin not found' }, { status: 404 })
    }

    where.schoolId = schoolAdmin.schoolId
  }

  if (search) {
    where.OR = [
      { school: { name: { contains: search, mode: 'insensitive' } } },
      { package: { name: { contains: search, mode: 'insensitive' } } },
      { transactionId: { contains: search, mode: 'insensitive' } },
      { paymentMethod: { contains: search, mode: 'insensitive' } },
      { notes: { contains: search, mode: 'insensitive' } }
    ]
  }

  if (status && status !== 'all') {
    where.status = status
  }

  if (type && type !== 'all') {
    where.type = type
  }

  const orderBy: any = {}
  if (sortBy === 'amount') {
    orderBy.amount = sortOrder
  } else if (sortBy === 'status') {
    orderBy.status = sortOrder
  } else if (sortBy === 'startDate') {
    orderBy.startDate = sortOrder
  } else if (sortBy === 'endDate') {
    orderBy.endDate = sortOrder
  } else if (sortBy === 'type') {
    orderBy.type = sortOrder
  } else if (sortBy === 'paymentMethod') {
    orderBy.paymentMethod = sortOrder
  } else {
    orderBy.createdAt = sortOrder
  }

  const [subscriptions, total] = await Promise.all([
    prisma.subscription.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy,
      include: {
        school: {
          select: {
            id: true,
            name: true,
            address: true,
            phone: true,
            email: true,
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
            }
          }
        },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        package: {
          select: {
            id: true,
            name: true,
            description: true,
            price: true,
            duration: true,
            features: true
          }
        }
      } as any
    }),
    prisma.subscription.count({ where })
  ])

  const pages = Math.ceil(total / limit)

  let billingMetrics = {}

  if (user.role === 'SUPER_ADMIN') {
    const totalRevenue = await prisma.subscription.aggregate({
      _sum: { amount: true },
      where: { status: 'ACTIVE' as any, isFreemium: { not: true } }
    })

    const currentMonth = new Date()
    const monthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1)
    const monthlyRevenue = await prisma.subscription.aggregate({
      _sum: { amount: true },
      where: {
        status: 'ACTIVE' as any,
        isFreemium: { not: true },
        createdAt: { gte: monthStart }
      }
    })

    const payingWhere = { isFreemium: { not: true } } as any
    const [activeSubscriptions, trialSubscriptions, totalSubscriptions] = await Promise.all([
      prisma.subscription.count({ where: { status: 'ACTIVE' as any, ...payingWhere } }),
      prisma.subscription.count({ where: { status: 'TRIAL' as any, ...payingWhere } }),
      prisma.subscription.count({ where: payingWhere })
    ])

    const conversionRate = (activeSubscriptions + trialSubscriptions) > 0
      ? Math.round((activeSubscriptions / (activeSubscriptions + trialSubscriptions)) * 100)
      : 0

    const [successfulPayments, pendingPayments] = await Promise.all([
      prisma.invoice.count({ where: { status: 'PAID' } }),
      prisma.invoice.count({ where: { status: 'PENDING' } })
    ])

    const totalPayments = successfulPayments + pendingPayments
    const paymentSuccessRate = totalPayments > 0
      ? Math.round((successfulPayments / totalPayments) * 100)
      : 100

    billingMetrics = {
      totalRevenue: totalRevenue._sum.amount || 0,
      monthlyRevenue: monthlyRevenue._sum.amount || 0,
      activeSubscriptions,
      totalSubscriptions,
      trialSubscriptions,
      conversionRate,
      successfulPayments,
      pendingPayments,
      paymentSuccessRate
    }
  }

  return NextResponse.json({
    subscriptions,
    pagination: {
      page,
      limit,
      total,
      pages
    },
    ...billingMetrics
  })
})

export const POST = route({ auth: ['SUPER_ADMIN', 'SCHOOL_ADMIN'] }, async (req, { user }) => {
  const body = await req.json()
  let {
    schoolId,
    packageId,
    startDate,
    endDate,
    amount,
    status = 'ACTIVE',
    type = 'SUBSCRIPTION',
    paymentMethod = 'MANUAL',
    transactionId,
    notes
  } = body

  const isFreemium = type === 'FREEMIUM'

  if (user.role === 'SCHOOL_ADMIN') {
    const schoolAdmin = await prisma.schoolAdmin.findFirst({
      where: { userId: user.id },
      select: { schoolId: true }
    })

    if (!schoolAdmin) {
      return NextResponse.json({ error: 'School admin not found' }, { status: 404 })
    }

    schoolId = schoolAdmin.schoolId
  }

  if (!schoolId || !packageId || !startDate || !endDate || !amount) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const school = await prisma.school.findUnique({
    where: { id: schoolId }
  })

  if (!school) {
    return NextResponse.json({ error: 'School not found' }, { status: 404 })
  }

  const packageData = await prisma.package.findUnique({
    where: { id: packageId }
  })

  if (!packageData) {
    return NextResponse.json({ error: 'Package not found' }, { status: 404 })
  }

  const subscription = await prisma.subscription.create({
    data: {
      schoolId,
      packageId,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      amount,
      status,
      type,
      paymentMethod,
      transactionId,
      isFreemium,
      notes
    },
    include: {
      school: {
        select: {
          id: true,
          name: true,
          address: true,
          phone: true,
          email: true,
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
          }
        }
      },
      package: {
        select: {
          id: true,
          name: true,
          description: true,
          price: true,
          duration: true,
          features: true
        }
      }
    }
  })

  return NextResponse.json(subscription, { status: 201 })
})
