import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { route } from '@/lib/api-middleware'

export const GET = route({ auth: 'SCHOOL_ADMIN' }, async (req, { user }) => {
  const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const policyType = searchParams.get('policyType') || ''
    const isActive = searchParams.get('isActive') || ''
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    const where: any = {}
    
    // Search filter
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ]
    }
    
    // Policy type filter
    if (policyType && policyType !== 'all') {
      where.policyType = policyType
    }
    
    // Active filter
    if (isActive && isActive !== 'all') {
      where.isActive = isActive === 'true'
    }

    // Sort configuration
    const orderBy: any = {}
    if (sortBy === 'name') {
      orderBy.name = sortOrder
    } else if (sortBy === 'policyType') {
      orderBy.policyType = sortOrder
    } else if (sortBy === 'isActive') {
      orderBy.isActive = sortOrder
    } else if (sortBy === 'priority') {
      orderBy.priority = sortOrder
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
              firstName: true,
              lastName: true,
              email: true
            }
          },
          updatedByUser: {
            select: {
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

export const POST = route({ auth: 'SCHOOL_ADMIN' }, async (req, { user }) => {
  const body = await req.json()
    const { 
      name, 
      description,
      policyType,
      rules,
      isActive = true,
      priority = 0
    } = body

    // Validate required fields
    if (!name || !policyType || !rules) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Validate policyType is a valid SecurityPolicyType
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

    // Create policy
    const policy = await prisma.securityPolicy.create({
      data: {
        name,
        description,
        policyType: policyType as any, // Cast to SecurityPolicyType enum
        rules: typeof rules === 'string' ? rules : JSON.stringify(rules),
        isActive,
        priority,
        createdBy: user.id,
        updatedBy: user.id
      },
      include: {
        createdByUser: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        },
        updatedByUser: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    })

    return NextResponse.json(policy, { status: 201 })
})
