import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { route } from '@/lib/api-middleware'

export const GET = route({ auth: 'SCHOOL_ADMIN' }, async (req, { user, params }) => {
  const { id } = await params
  const schoolAdmin = await prisma.schoolAdmin.findUnique({
    where: { userId: user.id }
  })

  if (!schoolAdmin) {
    return NextResponse.json({ error: 'School admin not found' }, { status: 404 })
  }

    const teacher = await prisma.teacher.findFirst({
      where: {
        id,
        schoolId: schoolAdmin.schoolId
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            address: true,
            isActive: true,
            createdAt: true
          }
        },
        students: {
          select: { id: true }
        },
        classes: {
          select: {
            name: true,
            subject: true
          }
        }
      }
    })

    if (!teacher) {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 })
    }

    const formattedTeacher = {
      id: teacher.id,
      name: `${teacher.user.firstName} ${teacher.user.lastName}`,
      email: teacher.user.email,
      phone: teacher.user.phone,
      address: teacher.user.address,
      students: teacher.students.length,
      status: teacher.user.isActive ? 'Active' : 'Inactive',
      joinDate: teacher.user.createdAt.toISOString().split('T')[0],
      subjects: teacher.classes.map(cls => cls.subject).filter(Boolean)
    }

    return NextResponse.json({ teacher: formattedTeacher })
})

export const PUT = route({ auth: 'SCHOOL_ADMIN' }, async (req, { user, params }) => {
  const { id } = await params
  const schoolAdmin = await prisma.schoolAdmin.findUnique({
    where: { userId: user.id }
  })

    if (!schoolAdmin) {
      return NextResponse.json({ error: 'School admin not found' }, { status: 404 })
    }

    const body = await req.json()
    const { firstName, lastName, email, phone, address, isActive } = body

    // Check if teacher exists and belongs to the school
    const existingTeacher = await prisma.teacher.findFirst({
      where: {
        id,
        schoolId: schoolAdmin.schoolId
      },
      include: { user: true }
    })

    if (!existingTeacher) {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 })
    }

    // Update teacher's user information
    const updatedTeacher = await prisma.teacher.update({
      where: { id },
      data: {
        user: {
          update: {
            firstName: firstName || existingTeacher.user.firstName,
            lastName: lastName || existingTeacher.user.lastName,
            email: email || existingTeacher.user.email,
            phone: phone || existingTeacher.user.phone,
            address: address || existingTeacher.user.address,
            isActive: isActive !== undefined ? isActive : existingTeacher.user.isActive
          }
        }
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            address: true,
            isActive: true,
            createdAt: true
          }
        },
        students: {
          select: { id: true }
        },
        classes: {
          select: {
            name: true,
            subject: true
          }
        }
      }
    })

    const formattedTeacher = {
      id: updatedTeacher.id,
      name: `${updatedTeacher.user.firstName} ${updatedTeacher.user.lastName}`,
      email: updatedTeacher.user.email,
      phone: updatedTeacher.user.phone,
      address: updatedTeacher.user.address,
      students: updatedTeacher.students.length,
      status: updatedTeacher.user.isActive ? 'Active' : 'Inactive',
      joinDate: updatedTeacher.user.createdAt.toISOString().split('T')[0],
      subjects: updatedTeacher.classes.map(cls => cls.subject).filter(Boolean)
    }

    return NextResponse.json({ 
      message: 'Teacher updated successfully',
      teacher: formattedTeacher
    })
})

export const DELETE = route({ auth: 'SCHOOL_ADMIN' }, async (req, { user, params }) => {
  const { id } = await params
  const schoolAdmin = await prisma.schoolAdmin.findUnique({
    where: { userId: user.id }
  })

    if (!schoolAdmin) {
      return NextResponse.json({ error: 'School admin not found' }, { status: 404 })
    }

    // Check if teacher exists and belongs to the school
    const existingTeacher = await prisma.teacher.findFirst({
      where: {
        id,
        schoolId: schoolAdmin.schoolId
      },
      include: {
        students: true,
        classes: true
      }
    })

    if (!existingTeacher) {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 })
    }

    // Check if teacher has students or classes
    if (existingTeacher.students.length > 0) {
      return NextResponse.json({ 
        error: `Cannot delete teacher. This teacher has ${existingTeacher.students.length} student(s) assigned. Please reassign or remove students first.` 
      }, { status: 400 })
    }

    if (existingTeacher.classes.length > 0) {
      return NextResponse.json({ 
        error: `Cannot delete teacher. This teacher has ${existingTeacher.classes.length} class(es) assigned. Please reassign or remove classes first.` 
      }, { status: 400 })
    }

    // Delete teacher and associated user
    await prisma.teacher.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Teacher deleted successfully' })
})
