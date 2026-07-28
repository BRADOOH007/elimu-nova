import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { route } from '@/lib/api-middleware'

export const GET = route({ auth: 'SUPER_ADMIN' }, async (req, { params, user }) => {
  const { id } = params

  const log = await prisma.securityLog.findUnique({
    where: { id },
    include: {
      user: {
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
          name: true
        }
      },
      resolver: {
        select: {
          id: true,
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

export const PUT = route({ auth: 'SUPER_ADMIN' }, async (req, { params, user }) => {
  const { id } = params
  const body = await req.json()
  const { resolved } = body

  const existingLog = await prisma.securityLog.findUnique({
    where: { id }
  })

  if (!existingLog) {
    return NextResponse.json({ error: 'Security log not found' }, { status: 404 })
  }

  const log = await prisma.securityLog.update({
    where: { id },
    data: {
      resolved: resolved || false,
      ...(resolved && { 
        resolvedBy: user.id,
        resolvedAt: new Date()
      })
    },
    include: {
      user: {
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
          name: true
        }
      },
      resolver: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true
        }
      }
    }
  })

  return NextResponse.json(log)
})
