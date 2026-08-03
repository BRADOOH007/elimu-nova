import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { route } from '@/lib/api-middleware'

export const dynamic = 'force-dynamic'

export const GET = route({ auth: 'SUPER_ADMIN' }, async () => {
  const districts = await prisma.district.findMany({
    include: {
      schools: {
        select: {
          id: true,
          name: true,
          isActive: true,
          _count: {
            select: {
              teachers: true,
              students: true,
              classes: true,
            },
          },
        },
      },
    },
    orderBy: { name: 'asc' },
  })

  const result = districts.map((d) => ({
    id: d.id,
    name: d.name,
    code: d.code,
    address: d.address,
    phone: d.phone,
    email: d.email,
    isActive: d.isActive,
    createdAt: d.createdAt,
    schoolCount: d.schools.length,
    totalTeachers: d.schools.reduce((sum, s) => sum + s._count.teachers, 0),
    totalStudents: d.schools.reduce((sum, s) => sum + s._count.students, 0),
    totalClasses: d.schools.reduce((sum, s) => sum + s._count.classes, 0),
    schools: d.schools,
  }))

  return NextResponse.json(result)
})

export const POST = route({ auth: 'SUPER_ADMIN' }, async (req) => {
  const body = await req.json()
  const { name, code, address, phone, email } = body

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return NextResponse.json({ error: 'District name is required' }, { status: 400 })
  }

  try {
    const district = await prisma.district.create({
      data: {
        name: name.trim(),
        code: code?.trim() || null,
        address: address?.trim() || null,
        phone: phone?.trim() || null,
        email: email?.trim() || null,
      },
    })
    return NextResponse.json(district, { status: 201 })
  } catch (err: any) {
    if (err?.code === 'P2002') {
      return NextResponse.json(
        { error: 'A district with that name or code already exists' },
        { status: 409 }
      )
    }
    return NextResponse.json({ error: 'Failed to create district' }, { status: 500 })
  }
})
