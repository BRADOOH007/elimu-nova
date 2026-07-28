import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { route } from '@/lib/api-middleware'

export const GET = route({ auth: 'SCHOOL_ADMIN' }, async (req, { user, params }) => {
  const { id } = await params
  const schoolAdmin = await prisma.schoolAdmin.findFirst({
    where: { userId: user.id },
    select: { schoolId: true }
  })
    
    if (!schoolAdmin) {
      return NextResponse.json({ error: 'School admin not found' }, { status: 404 })
    }

    const log = await prisma.securityLog.findFirst({
      where: {
        id,
        schoolId: schoolAdmin.schoolId
      },
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
    })

    if (!log) {
      return NextResponse.json({ error: 'Security log not found' }, { status: 404 })
    }

    return NextResponse.json(log)
})

export const PUT = route({ auth: 'SCHOOL_ADMIN' }, async (req, { user, params }) => {
  const { id } = await params
    const body = await req.json()
    const { 
      resolved,
      description,
      severity
    } = body

    // Get school admin's school ID
    const schoolAdmin = await prisma.schoolAdmin.findFirst({
      where: { userId: user.id },
      select: { schoolId: true }
    })
    
    if (!schoolAdmin) {
      return NextResponse.json({ error: 'School admin not found' }, { status: 404 })
    }

    // Check if log exists and belongs to this school
    const existingLog = await prisma.securityLog.findFirst({
      where: {
        id,
        schoolId: schoolAdmin.schoolId
      }
    })

    if (!existingLog) {
      return NextResponse.json({ error: 'Security log not found' }, { status: 404 })
    }

    // Update log
    const log = await prisma.securityLog.update({
      where: { id },
      data: {
        ...(resolved !== undefined && { 
          resolved,
          ...(resolved && { 
            resolvedBy: user.id,
            resolvedAt: new Date()
          })
        }),
        ...(description && { description }),
        ...(severity && { severity })
      },
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
    })

    return NextResponse.json(log)
})

export const DELETE = route({ auth: 'SCHOOL_ADMIN' }, async (req, { user, params }) => {
  const { id } = await params

    // Get school admin's school ID
    const schoolAdmin = await prisma.schoolAdmin.findFirst({
      where: { userId: user.id },
      select: { schoolId: true }
    })
    
    if (!schoolAdmin) {
      return NextResponse.json({ error: 'School admin not found' }, { status: 404 })
    }

    // Check if log exists and belongs to this school
    const existingLog = await prisma.securityLog.findFirst({
      where: {
        id,
        schoolId: schoolAdmin.schoolId
      }
    })

    if (!existingLog) {
      return NextResponse.json({ error: 'Security log not found' }, { status: 404 })
    }

    // Delete log
    await prisma.securityLog.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Security log deleted successfully' })
})
