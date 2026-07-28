import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { route } from '@/lib/api-middleware'

export const GET = route({ auth: 'SUPER_ADMIN' }, async (req, { user, params }) => {
  const school = await prisma.school.findUnique({
    where: { id: params.id },
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
        include: {
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

  if (!school) {
    return NextResponse.json({ error: 'School not found' }, { status: 404 })
  }

  return NextResponse.json(school)
})

export const PUT = route({ auth: 'SUPER_ADMIN' }, async (req, { user, params }) => {
  const body = await req.json()
  const { name, address, phone, email, website, isActive } = body

  const existingSchool = await prisma.school.findUnique({
    where: { id: params.id }
  })

  if (!existingSchool) {
    return NextResponse.json({ error: 'School not found' }, { status: 404 })
  }

  if (name && name !== existingSchool.name) {
    const nameConflict = await prisma.school.findFirst({
      where: {
        name: { equals: name.trim(), mode: 'insensitive' },
        id: { not: params.id }
      }
    })

    if (nameConflict) {
      return NextResponse.json({
        error: 'School with this name already exists'
      }, { status: 400 })
    }
  }

  const updatedSchool = await prisma.school.update({
    where: { id: params.id },
    data: {
      ...(name && { name: name.trim() }),
      ...(address && { address: address.trim() }),
      ...(phone !== undefined && { phone: phone?.trim() || null }),
      ...(email !== undefined && { email: email?.trim() || null }),
      ...(website !== undefined && { website: website?.trim() || null }),
      ...(isActive !== undefined && { isActive })
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
        include: {
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

  return NextResponse.json(updatedSchool)
})

export const DELETE = route({ auth: 'SUPER_ADMIN' }, async (req, { user, params }) => {
  const existingSchool = await prisma.school.findUnique({
    where: { id: params.id },
    include: {
      students: true,
      teachers: true,
      subscriptions: {
        where: {
          status: 'ACTIVE'
        }
      }
    }
  })

  if (!existingSchool) {
    return NextResponse.json({ error: 'School not found' }, { status: 404 })
  }

  if (existingSchool.subscriptions.length > 0) {
    return NextResponse.json({
      error: 'Cannot delete school with active subscriptions. Please cancel subscriptions first.'
    }, { status: 400 })
  }

  if (existingSchool.students.length > 0 || existingSchool.teachers.length > 0) {
    return NextResponse.json({
      error: 'Cannot delete school with students or teachers. Please remove all users first.'
    }, { status: 400 })
  }

  await prisma.school.delete({
    where: { id: params.id }
  })

  return NextResponse.json({ message: 'School deleted successfully' })
})
