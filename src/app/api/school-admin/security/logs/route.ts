import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { route } from '@/lib/api-middleware'

export const GET = route({ auth: 'SCHOOL_ADMIN' }, async (req, { user }) => {
  const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const eventType = searchParams.get('eventType') || ''
    const severity = searchParams.get('severity') || ''
    const resolved = searchParams.get('resolved') || ''
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    // Get school admin's school ID
    const schoolAdmin = await prisma.schoolAdmin.findFirst({
      where: { userId: user.id },
      select: { schoolId: true }
    })
    
    if (!schoolAdmin) {
      return NextResponse.json({ error: 'School admin not found' }, { status: 404 })
    }

    const where: any = {
      schoolId: schoolAdmin.schoolId
    }
    
    // Search filter
    if (search) {
      where.OR = [
        { description: { contains: search, mode: 'insensitive' } },
        { ipAddress: { contains: search, mode: 'insensitive' } },
        { userAgent: { contains: search, mode: 'insensitive' } }
      ]
    }
    
    // Event type filter
    if (eventType && eventType !== 'all') {
      where.eventType = eventType
    }
    
    // Severity filter
    if (severity && severity !== 'all') {
      where.severity = severity
    }
    
    // Resolved filter
    if (resolved && resolved !== 'all') {
      where.resolved = resolved === 'true'
    }

    // Sort configuration
    const orderBy: any = {}
    if (sortBy === 'eventType') {
      orderBy.eventType = sortOrder
    } else if (sortBy === 'severity') {
      orderBy.severity = sortOrder
    } else if (sortBy === 'resolved') {
      orderBy.resolved = sortOrder
    } else {
      orderBy.createdAt = sortOrder
    }

    const [logs, total] = await Promise.all([
      prisma.securityLog.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy,
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true
            }
          },
          resolver: {
            select: {
              firstName: true,
              lastName: true,
              email: true
            }
          }
        }
      }),
      prisma.securityLog.count({ where })
    ])

    const pages = Math.ceil(total / limit)

    return NextResponse.json({
      logs,
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
      eventType, 
      severity = 'MEDIUM',
      description,
      ipAddress,
      userAgent,
      userId,
      metadata
    } = body

    // Get school admin's school ID
    const schoolAdmin = await prisma.schoolAdmin.findFirst({
      where: { userId: user.id },
      select: { schoolId: true }
    })
    
    if (!schoolAdmin) {
      return NextResponse.json({ error: 'School admin not found' }, { status: 404 })
    }

    // Validate required fields
    if (!eventType || !description) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Validate eventType is a valid SecurityEventType
    const validEventTypes = [
      'LOGIN_SUCCESS', 'LOGIN_FAILED', 'PASSWORD_CHANGE', 'PERMISSION_DENIED',
      'SUSPICIOUS_ACTIVITY', 'DATA_BREACH_ATTEMPT', 'UNAUTHORIZED_ACCESS',
      'SYSTEM_INTRUSION', 'MALWARE_DETECTED', 'POLICY_VIOLATION', 'ACCOUNT_LOCKED',
      'ACCOUNT_UNLOCKED', 'TWO_FACTOR_ENABLED', 'TWO_FACTOR_DISABLED', 'API_ABUSE',
      'BRUTE_FORCE_ATTEMPT', 'PHISHING_ATTEMPT', 'CUSTOM'
    ]
    
    if (!validEventTypes.includes(eventType)) {
      return NextResponse.json({ 
        error: 'Invalid eventType. Must be one of: ' + validEventTypes.join(', ') 
      }, { status: 400 })
    }

    // Validate severity is a valid SecuritySeverity
    const validSeverities = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']
    
    if (!validSeverities.includes(severity)) {
      return NextResponse.json({ 
        error: 'Invalid severity. Must be one of: ' + validSeverities.join(', ') 
      }, { status: 400 })
    }

    // Create security log
    const log = await prisma.securityLog.create({
      data: {
        eventType: eventType as any, // Cast to SecurityEventType enum
        severity: severity as any,   // Cast to SecuritySeverity enum
        description,
        ipAddress,
        userAgent,
        userId,
        schoolId: schoolAdmin.schoolId,
        metadata: metadata ? JSON.stringify(metadata) : null
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    })

    return NextResponse.json(log, { status: 201 })
})
