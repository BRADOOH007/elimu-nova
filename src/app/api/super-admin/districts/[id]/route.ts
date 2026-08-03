import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { route } from '@/lib/api-middleware'

export const dynamic = 'force-dynamic'

export const GET = route({ auth: 'SUPER_ADMIN' }, async (_req, { params }) => {
  const district = await prisma.district.findUnique({
    where: { id: (await params).id },
    include: {
      schools: {
        include: {
          _count: {
            select: { teachers: true, students: true, classes: true },
          },
        },
      },
    },
  })

  if (!district) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  return NextResponse.json(district)
})

export const PATCH = route({ auth: 'SUPER_ADMIN' }, async (req, { params }) => {
  const body = await req.json()
  const { name, code, address, phone, email, isActive } = body

  try {
    const district = await prisma.district.update({
      where: { id: (await params).id },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(code !== undefined && { code: code?.trim() || null }),
        ...(address !== undefined && { address: address?.trim() || null }),
        ...(phone !== undefined && { phone: phone?.trim() || null }),
        ...(email !== undefined && { email: email?.trim() || null }),
        ...(isActive !== undefined && { isActive }),
      },
    })
    return NextResponse.json(district)
  } catch (err: any) {
    if (err?.code === 'P2025') {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    if (err?.code === 'P2002') {
      return NextResponse.json(
        { error: 'A district with that name or code already exists' },
        { status: 409 }
      )
    }
    return NextResponse.json({ error: 'Failed to update district' }, { status: 500 })
  }
})

export const DELETE = route({ auth: 'SUPER_ADMIN' }, async (_req, { params }) => {
  try {
    await prisma.district.delete({ where: { id: (await params).id } })
    return NextResponse.json({ success: true })
  } catch (err: any) {
    if (err?.code === 'P2025') {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    return NextResponse.json({ error: 'Failed to delete district' }, { status: 500 })
  }
})
