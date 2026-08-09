import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import type { Prisma } from '@prisma/client'
import { stripPasswordFromAddress } from '@/lib/password-encryption'
import { route } from '@/lib/api-middleware'

export const GET = route({ auth: 'SCHOOL_ADMIN' }, async (req, { user, params }) => {
  const { id } = await params
  const schoolAdmin = await prisma.schoolAdmin.findUnique({
    where: { userId: user.id }
  })

    if (!schoolAdmin) {
      return NextResponse.json({ error: 'School admin not found' }, { status: 404 })
    }

    const student = await prisma.student.findFirst({
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
        teacher: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true
              }
            }
          }
        },
        class: {
          select: {
            name: true,
            subject: true,
            grade: true
          }
        }
      }
    })

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }

    const formattedStudent = {
      id: student.id,
      name: `${student.user.firstName} ${student.user.lastName}`,
      email: student.user.email,
      phone: student.user.phone,
      address: stripPasswordFromAddress(student.user.address),
      teacher: student.teacher ? `${student.teacher.user.firstName} ${student.teacher.user.lastName}` : '',
      class: student.class?.name,
      grade: student.class?.grade,
      status: student.user.isActive ? 'Active' : 'Inactive',
      joinDate: student.user.createdAt.toISOString().split('T')[0]
    }

    return NextResponse.json({ student: formattedStudent })
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
    const { firstName, lastName, email, phone, address, classId, subjects, isActive } = body

    // Check if student exists and belongs to the school
    const existingStudent = await prisma.student.findFirst({
      where: {
        id,
        schoolId: schoolAdmin.schoolId
      },
      include: { user: true }
    })

    if (!existingStudent) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }

    // When the class changes, derive the new teacherId from that class so the
    // student appears in the correct teacher's roster/dashboard immediately.
    let teacherId: string | null | undefined = undefined
    if (classId !== undefined) {
      teacherId = null
      if (classId) {
        const cls = await prisma.class.findFirst({
          where: { id: classId, schoolId: schoolAdmin.schoolId },
          select: { teacherId: true },
        })
        teacherId = cls?.teacherId ?? null
      }
    }

    const updateData: Prisma.StudentUpdateInput = {
      subjects: subjects !== undefined ? subjects : existingStudent.subjects,
      user: {
        update: {
          firstName: firstName || existingStudent.user.firstName,
          lastName: lastName || existingStudent.user.lastName,
          email: email || existingStudent.user.email,
          phone: phone !== undefined ? phone : existingStudent.user.phone,
          address: address !== undefined
            ? (existingStudent.user.address?.startsWith('PWD_ENC:')
              ? existingStudent.user.address.split('\n---\n')[0] + '\n---\n' + address
              : address)
            : existingStudent.user.address,
          isActive: isActive !== undefined ? isActive : existingStudent.user.isActive
        }
      },
    }

    if (classId !== undefined) {
      updateData.class = classId
        ? { connect: { id: classId } }
        : { disconnect: true }
    }
    if (teacherId !== undefined) {
      updateData.teacher = teacherId
        ? { connect: { id: teacherId } }
        : { disconnect: true }
    }

    // Update student's user information
    const updatedStudent = await prisma.student.update({
      where: { id },
      data: updateData,
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
        teacher: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true
              }
            }
          }
        },
        class: {
          select: {
            name: true,
            subject: true,
            grade: true
          }
        }
      }
    })

    const formattedStudent = {
      id: updatedStudent.id,
      name: `${updatedStudent.user.firstName} ${updatedStudent.user.lastName}`,
      email: updatedStudent.user.email,
      phone: updatedStudent.user.phone,
      address: stripPasswordFromAddress(updatedStudent.user.address),
      teacher: updatedStudent.teacher ? `${updatedStudent.teacher.user.firstName} ${updatedStudent.teacher.user.lastName}` : '',
      class: updatedStudent.class?.name,
      grade: updatedStudent.class?.grade,
      status: updatedStudent.user.isActive ? 'Active' : 'Inactive',
      joinDate: updatedStudent.user.createdAt.toISOString().split('T')[0]
    }

    return NextResponse.json({ 
      message: 'Student updated successfully',
      student: formattedStudent
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

    // Check if student exists and belongs to the school
    const existingStudent = await prisma.student.findFirst({
      where: {
        id,
        schoolId: schoolAdmin.schoolId
      }
    })

    if (!existingStudent) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }

    // Delete student and associated user
    await prisma.student.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Student deleted successfully' })
})
