import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { route } from '@/lib/api-middleware'

export const GET = route({ auth: 'SUPER_ADMIN' }, async (req, { user, params }) => {
  const report = await prisma.report.findUnique({
    where: { id: params.id },
    include: {
      generatedByUser: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true
        }
      },
      school: {
        select: {
          id: true,
          name: true,
          email: true,
          address: true,
          phone: true
        }
      }
    }
  })

  if (!report) {
    return NextResponse.json({ error: 'Report not found' }, { status: 404 })
  }

  return NextResponse.json(report)
})

export const PUT = route({ auth: 'SUPER_ADMIN' }, async (req, { user, params }) => {
  const body = await req.json()
  const {
    title,
    description,
    type,
    status,
    content,
    filters,
    isPublic,
    scheduledAt,
    expiresAt
  } = body

  if (!title || !type) {
    return NextResponse.json(
      { error: 'Title and type are required' },
      { status: 400 }
    )
  }

  const report = await prisma.report.update({
    where: { id: params.id },
    data: {
      title,
      description,
      type,
      status,
      content,
      filters,
      isPublic,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      updatedAt: new Date()
    },
    include: {
      generatedByUser: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true
        }
      },
      school: {
        select: {
          id: true,
          name: true,
          email: true,
          address: true,
          phone: true
        }
      }
    }
  })

  return NextResponse.json(report)
})

export const DELETE = route({ auth: 'SUPER_ADMIN' }, async (req, { user, params }) => {
  await prisma.report.delete({
    where: { id: params.id }
  })

  return NextResponse.json({ success: true })
})
