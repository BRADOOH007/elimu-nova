import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { route } from '@/lib/api-middleware'
import { generateUsername } from '@/lib/bulk-import'

async function uniqueUsername(first: string, last: string): Promise<string> {
  let u = generateUsername(first, last)
  let attempts = 0
  while (await prisma.user.findUnique({ where: { username: u } })) {
    attempts++
    u = generateUsername(first, last, `${Date.now().toString(36)}${attempts}`)
  }
  return u
}

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
      // Role changed — don't delete old role record (FK constraints on related data).
      // Just update the user's role and create/update the new role record if needed.
      // Old role data stays orphaned, which is safe and non-destructive.

      if (schoolId && ['SCHOOL_ADMIN', 'TEACHER', 'STUDENT'].includes(role)) {
        if (role === 'SCHOOL_ADMIN') {
          if (currentUser.schoolAdmin) {
            await tx.schoolAdmin.update({ where: { userId: id }, data: { schoolId } })
          } else {
            await tx.schoolAdmin.create({ data: { userId: id, schoolId } })
          }
        } else if (role === 'TEACHER') {
          if (currentUser.teacher) {
            await tx.teacher.update({ where: { userId: id }, data: { schoolId } })
          } else {
            await tx.teacher.create({ data: { userId: id, schoolId } })
          }
        } else if (role === 'STUDENT') {
          if (currentUser.student) {
            await tx.student.update({ where: { userId: id }, data: { schoolId } })
          } else {
            await tx.student.create({ data: { userId: id, schoolId } })
          }
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

    const nameChanged = (firstName && firstName !== existingUser.firstName) ||
                        (lastName && lastName !== existingUser.lastName)
    let newUsername: string | undefined
    if (nameChanged) {
      const newFirst = firstName || existingUser.firstName
      const newLast = lastName || existingUser.lastName
      newUsername = await uniqueUsername(newFirst, newLast)
    }

    const updatedUser = await tx.user.update({
      where: { id },
      data: {
        ...(firstName && { firstName }),
        ...(lastName && { lastName }),
        ...(email && { email }),
        ...(phone && { phone }),
        ...(role && { role }),
        ...(newUsername && { username: newUsername }),
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
