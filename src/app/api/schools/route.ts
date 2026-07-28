import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { route } from '@/lib/api-middleware'

export const GET = route({ auth: 'SUPER_ADMIN' }, async (req, { user }) => {
  const { searchParams } = new URL(req.url)
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '10')
  const search = searchParams.get('search') || ''
  const status = searchParams.get('status') || ''
  const sortBy = searchParams.get('sortBy') || 'createdAt'
  const sortOrder = searchParams.get('sortOrder') || 'desc'

  const where: any = {}

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
      { address: { contains: search, mode: 'insensitive' } },
      { phone: { contains: search, mode: 'insensitive' } },
      { website: { contains: search, mode: 'insensitive' } }
    ]
  }

  if (status === 'active') {
    where.isActive = true
  } else if (status === 'inactive') {
    where.isActive = false
  }

  const orderBy: any = {}
  if (sortBy === 'name') {
    orderBy.name = sortOrder
  } else if (sortBy === 'updatedAt') {
    orderBy.updatedAt = sortOrder
  } else {
    orderBy.createdAt = sortOrder
  }

  const [schools, total] = await Promise.all([
    prisma.school.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy,
      include: {
        schoolAdmin: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        },
        teachers: {
          select: {
            id: true,
            user: {
              select: {
                firstName: true,
                lastName: true
              }
            }
          }
        },
        students: {
          select: {
            id: true
          }
        },
        subscriptions: {
          where: {
            status: 'ACTIVE'
          },
          include: {
            package: {
              select: {
                name: true,
                price: true
              }
            }
          }
        }
      }
    }),
    prisma.school.count({ where })
  ])

  return NextResponse.json({
    schools,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  })
})

export const POST = route({ auth: 'SUPER_ADMIN' }, async (req, { user }) => {
  const body = await req.json()
  const { name, address, phone, email, website } = body

  if (!name || !address) {
    return NextResponse.json({
      error: 'Missing required fields: name, address'
    }, { status: 400 })
  }

  const existingSchool = await prisma.school.findFirst({
    where: {
      name: { equals: name.trim(), mode: 'insensitive' }
    }
  })

  if (existingSchool) {
    return NextResponse.json({
      error: 'School with this name already exists'
    }, { status: 400 })
  }

  const newSchool = await prisma.school.create({
    data: {
      name: name.trim(),
      address: address.trim(),
      phone: phone?.trim() || null,
      email: email?.trim() || null,
      website: website?.trim() || null
    },
    include: {
      schoolAdmin: {
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true
            }
          }
        }
      },
      teachers: {
        select: {
          id: true,
          user: {
            select: {
              firstName: true,
              lastName: true
            }
          }
        }
      },
      students: {
        select: {
          id: true
        }
      },
      subscriptions: {
        where: {
          status: 'ACTIVE'
        },
        include: {
          package: {
            select: {
              name: true,
              price: true
            }
          }
        }
      }
    }
  })

  return NextResponse.json(newSchool, { status: 201 })
})
