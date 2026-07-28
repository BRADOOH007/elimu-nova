import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { route } from '@/lib/api-middleware'

export const GET = route({ auth: 'SUPER_ADMIN' }, async (req) => {
  const { searchParams } = new URL(req.url)
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '10')
  const search = searchParams.get('search') || ''
  const policyType = searchParams.get('policyType') || ''
  const isActive = searchParams.get('isActive') || ''
  const sortBy = searchParams.get('sortBy') || 'createdAt'
  const sortOrder = searchParams.get('sortOrder') || 'desc'

  const where: any = {}
  
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } }
    ]
  }
  
  if (policyType && policyType !== 'all-types') {
    where.policyType = policyType
  }

  if (isActive && isActive !== 'all-status') {
    where.isActive = isActive === 'active'
  }

  const orderBy: any = {}
  if (sortBy === 'name') {
    orderBy.name = sortOrder
  } else if (sortBy === 'policyType') {
    orderBy.policyType = sortOrder
  } else if (sortBy === 'priority') {
    orderBy.priority = sortOrder
  } else if (sortBy === 'updatedAt') {
    orderBy.updatedAt = sortOrder
  } else {
    orderBy.createdAt = sortOrder
  }

  const [policies, total] = await Promise.all([
    prisma.securityPolicy.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy,
      include: {
        createdByUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        updatedByUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    }),
    prisma.securityPolicy.count({ where })
  ])

  const pages = Math.ceil(total / limit)

  return NextResponse.json({
    policies,
    pagination: {
      page,
      limit,
      total,
      pages
    }
  })
})

export const POST = route({ auth: 'SUPER_ADMIN' }, async (req, { user }) => {
  const body = await req.json()
  const { 
    name,
    description,
    policyType,
    rules,
    isActive,
    priority
  } = body

  if (!name || !policyType || !rules) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const validPolicyTypes = [
    'AUTHENTICATION', 'AUTHORIZATION', 'PASSWORD', 'SESSION',
    'API_RATE_LIMITING', 'IP_WHITELIST', 'IP_BLACKLIST', 'FILE_UPLOAD',
    'DATA_ACCESS', 'AUDIT_LOGGING'
  ]
  
  if (!validPolicyTypes.includes(policyType)) {
    return NextResponse.json({ 
      error: 'Invalid policyType. Must be one of: ' + validPolicyTypes.join(', ') 
    }, { status: 400 })
  }

  try {
    JSON.parse(rules)
  } catch {
    return NextResponse.json({ error: 'Invalid rules JSON format' }, { status: 400 })
  }

  const policy = await prisma.securityPolicy.create({
    data: {
      name,
      description,
      policyType: policyType as any,
      rules,
      isActive: isActive !== false,
      priority: priority || 0,
      createdBy: user.id,
      updatedBy: user.id
    },
    include: {
      createdByUser: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true
        }
      },
      updatedByUser: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true
        }
      }
    }
  })

  return NextResponse.json(policy, { status: 201 })
})
