import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { route } from '@/lib/api-middleware'

export const GET = route({ auth: 'SUPER_ADMIN' }, async (req, { user }) => {
  try {
    const { searchParams } = new URL(req.url)
    const page   = parseInt(searchParams.get('page')   || '1')
    const limit  = parseInt(searchParams.get('limit')  || '20')
    const search = searchParams.get('search') || ''

    const where = search
      ? { OR: [{ name: { contains: search, mode: 'insensitive' as const } }, { address: { contains: search, mode: 'insensitive' as const } }] }
      : {}

    const [schools, total] = await Promise.all([
      prisma.school.findMany({
        where,
        include: {
          schoolAdmin: { include: { user: true } },
          _count: { select: { teachers: true, students: true } },
          subscriptions: { where: { status: 'ACTIVE' }, take: 1 },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.school.count({ where }),
    ])

    return NextResponse.json({ schools, pagination: { page, limit, total, pages: Math.ceil(total / limit) } })
  } catch (error) {
    console.error('[GET_SUPER_SCHOOLS]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
})

export const POST = route({ auth: 'SUPER_ADMIN' }, async (req, { user }) => {
  try {
    const { name, address, phone, email, website } = await req.json()
    if (!name || !address) return NextResponse.json({ error: 'Name and address required' }, { status: 400 })

    const school = await prisma.school.create({
      data: { name, address, phone, email, website },
    })
    return NextResponse.json(school, { status: 201 })
  } catch (error) {
    console.error('[POST_SUPER_SCHOOLS]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
})
