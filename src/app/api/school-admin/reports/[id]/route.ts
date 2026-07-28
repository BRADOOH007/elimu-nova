import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { route } from '@/lib/api-middleware'

export const GET = route({ auth: 'SCHOOL_ADMIN' }, async (req, { user, params }) => {
  const { id } = await params
  const schoolAdmin = await prisma.schoolAdmin.findUnique({
    where: { userId: user.id },
    select: { schoolId: true }
  })

    if (!schoolAdmin) {
      return NextResponse.json({ error: 'School admin not found' }, { status: 404 })
    }

    const report = await prisma.report.findFirst({
      where: {
        id,
        schoolId: schoolAdmin.schoolId
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

    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 })
    }

    return NextResponse.json(report)
})

export const PUT = route({ auth: 'SCHOOL_ADMIN' }, async (req, { user, params }) => {
  const { id } = await params
  const schoolAdmin = await prisma.schoolAdmin.findUnique({
    where: { userId: user.id },
    select: { schoolId: true }
  })

    if (!schoolAdmin) {
      return NextResponse.json({ error: 'School admin not found' }, { status: 404 })
    }

    // Check if report exists and belongs to school
    const existingReport = await prisma.report.findFirst({
      where: {
        id,
        schoolId: schoolAdmin.schoolId
      }
    })

    if (!existingReport) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 })
    }

    const body = await req.json()
    const {
      title,
      description,
      type,
      content,
      filters,
      isPublic,
      scheduledAt,
      expiresAt
    } = body

    // Update report
    const report = await prisma.report.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(type && { type }),
        ...(content && { content }),
        ...(filters !== undefined && { filters: filters ? JSON.stringify(filters) : null }),
        ...(isPublic !== undefined && { isPublic }),
        ...(scheduledAt !== undefined && { scheduledAt: scheduledAt ? new Date(scheduledAt) : null }),
        ...(expiresAt !== undefined && { expiresAt: expiresAt ? new Date(expiresAt) : null })
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

    return NextResponse.json(report)
})

export const DELETE = route({ auth: 'SCHOOL_ADMIN' }, async (req, { user, params }) => {
  const { id } = await params
  const schoolAdmin = await prisma.schoolAdmin.findUnique({
    where: { userId: user.id },
    select: { schoolId: true }
  })

    if (!schoolAdmin) {
      return NextResponse.json({ error: 'School admin not found' }, { status: 404 })
    }

    // Check if report exists and belongs to school
    const existingReport = await prisma.report.findFirst({
      where: {
        id,
        schoolId: schoolAdmin.schoolId
      }
    })

    if (!existingReport) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 })
    }

    // Delete report
    await prisma.report.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Report deleted successfully' })
})
