import { NextResponse } from 'next/server'
import { prisma, withRetry } from '@/lib/prisma'
import { stripPasswordFromAddress } from '@/lib/password-encryption'
import { route } from '@/lib/api-middleware'

export const PUT = route({ auth: 'TEACHER' }, async (req, { user, params }) => {
  const { id } = params
  const teacher = await withRetry(() => prisma.teacher.findUnique({ where: { userId: user.id } }))
  if (!teacher) return NextResponse.json({ error: 'Teacher not found' }, { status: 404 })

  const body = await req.json()
  const { firstName, lastName, email, phone, address, classId, isActive, subjects } = body

  const existingStudent = await prisma.student.findFirst({
    where: { id, teacherId: teacher.id, deletedAt: null },
    include: { user: true }
  })
  if (!existingStudent) return NextResponse.json({ error: 'Student not found' }, { status: 404 })

  const updatedStudent = await prisma.student.update({
    where: { id },
    data: {
      classId: classId !== undefined ? (classId || null) : existingStudent.classId,
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
          isActive: isActive !== undefined ? isActive : existingStudent.user.isActive,
        }
      }
    },
    include: {
      user: { select: { firstName: true, lastName: true, email: true, phone: true, address: true, isActive: true, createdAt: true } },
      class: { select: { id: true, name: true, subject: true, grade: true } }
    }
  })

  return NextResponse.json({
    message: 'Student updated successfully',
    student: {
      id: updatedStudent.id,
      name: `${updatedStudent.user.firstName} ${updatedStudent.user.lastName}`,
      email: updatedStudent.user.email,
      phone: updatedStudent.user.phone,
      address: stripPasswordFromAddress(updatedStudent.user.address),
      classId: updatedStudent.classId,
      class: updatedStudent.class,
      status: updatedStudent.user.isActive ? 'Active' : 'Inactive',
      joinDate: updatedStudent.user.createdAt.toISOString(),
      subjects: updatedStudent.subjects,
    }
  })
})

export const DELETE = route({ auth: 'TEACHER' }, async (req, { user, params }) => {
  const { id } = params
  const teacher = await withRetry(() => prisma.teacher.findUnique({ where: { userId: user.id } }))
  if (!teacher) return NextResponse.json({ error: 'Teacher not found' }, { status: 404 })

  const existingStudent = await prisma.student.findFirst({
    where: { id, teacherId: teacher.id, deletedAt: null }
  })
  if (!existingStudent) return NextResponse.json({ error: 'Student not found' }, { status: 404 })

  await prisma.student.update({
    where: { id },
    data: { deletedAt: new Date() }
  })

  return NextResponse.json({ message: 'Student deleted successfully' })
})
