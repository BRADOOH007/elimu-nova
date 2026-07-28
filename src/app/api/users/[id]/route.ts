import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { route } from '@/lib/api-middleware'

export const GET = route({ auth: 'SUPER_ADMIN' }, async (req, { params }) => {
  const { id } = params

  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      schoolAdmin: {
        include: {
          school: {
            select: {
              id: true,
              name: true,
              address: true,
              phone: true,
              email: true
            }
          }
        }
      },
      teacher: {
        include: {
          school: {
            select: {
              id: true,
              name: true,
              address: true,
              phone: true,
              email: true
            }
          }
        }
      },
      student: {
        include: {
          school: {
            select: {
              id: true,
              name: true,
              address: true,
              phone: true,
              email: true
            }
          }
        }
      }
    }
  })

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  return NextResponse.json(user)
})

export const PUT = route({ auth: 'SUPER_ADMIN' }, async (req, { params }) => {
  const { id } = params
  const body = await req.json()
  const { 
    firstName, 
    lastName, 
    email, 
    phone, 
    role, 
    schoolId,
    isActive 
  } = body

  const existingUser = await prisma.user.findUnique({
    where: { id }
  })

  if (!existingUser) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  if (email && email !== existingUser.email) {
    const emailExists = await prisma.user.findUnique({
      where: { email }
    })

    if (emailExists) {
      return NextResponse.json({ error: 'Email already exists' }, { status: 400 })
    }
  }

  const schoolRoles = ['SCHOOL_ADMIN', 'TEACHER', 'STUDENT'] as const

  // Validate school requirement
  if (role && schoolRoles.includes(role as typeof schoolRoles[number]) && !schoolId) {
    return NextResponse.json({ error: 'School selection is required for this role' }, { status: 400 })
  }

  const currentUser = await prisma.user.findUnique({
    where: { id },
    include: {
      schoolAdmin: true,
      teacher: true,
      student: true
    }
  })

  if (!currentUser) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  const user = await prisma.$transaction(async (tx) => {
    if (role && role !== currentUser.role) {
      // Role changed — delete old role-specific record
      if (currentUser.schoolAdmin) await tx.schoolAdmin.delete({ where: { userId: id } })
      if (currentUser.teacher) await tx.teacher.delete({ where: { userId: id } })
      if (currentUser.student) await tx.student.delete({ where: { userId: id } })

      // Create new role-specific record
      if (schoolId) {
        if (role === 'SCHOOL_ADMIN') {
          await tx.schoolAdmin.create({ data: { userId: id, schoolId } })
        } else if (role === 'TEACHER') {
          await tx.teacher.create({ data: { userId: id, schoolId } })
        } else if (role === 'STUDENT') {
          await tx.student.create({ data: { userId: id, schoolId } })
        }
      }
    } else if (schoolId) {
      // Same role — update school assignment on existing record
      if (currentUser.schoolAdmin) {
        await tx.schoolAdmin.update({ where: { userId: id }, data: { schoolId } })
      } else if (currentUser.teacher) {
        await tx.teacher.update({ where: { userId: id }, data: { schoolId } })
      } else if (currentUser.student) {
        await tx.student.update({ where: { userId: id }, data: { schoolId } })
      }
    }

    const updatedUser = await tx.user.update({
      where: { id },
      data: {
        ...(firstName && { firstName }),
        ...(lastName && { lastName }),
        ...(email && { email }),
        ...(phone && { phone }),
        ...(role && { role }),
        ...(isActive !== undefined && { isActive })
      }
    })

    return updatedUser
  })

  const userWithRelations = await prisma.user.findUnique({
    where: { id },
    include: {
      schoolAdmin: {
        include: {
          school: {
            select: {
              id: true,
              name: true
            }
          }
        }
      },
      teacher: {
        include: {
          school: {
            select: {
              id: true,
              name: true
            }
          }
        }
      },
      student: {
        include: {
          school: {
            select: {
              id: true,
              name: true
            }
          }
        }
      }
    }
  })

  return NextResponse.json(userWithRelations)
})

export const DELETE = route({ auth: 'SUPER_ADMIN' }, async (req, { params, user }) => {
  const { id } = params

  const existingUser = await prisma.user.findUnique({
    where: { id }
  })

  if (!existingUser) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  if (existingUser.id === user.id) {
    return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 })
  }

  await prisma.user.delete({
    where: { id }
  })

  return NextResponse.json({ message: 'User deleted successfully' })
})
