import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { route } from '@/lib/api-middleware'
import bcrypt from 'bcryptjs'

export const PUT = route({ auth: 'SCHOOL_ADMIN' }, async (req, { user }, { params }) => {
  const schoolAdmin = await prisma.schoolAdmin.findUnique({
    where: { userId: user.id },
    include: { school: true },
  })
  if (!schoolAdmin) return NextResponse.json({ error: 'School admin not found' }, { status: 404 })

  const teacherId = (params as any)?.id
  if (!teacherId) return NextResponse.json({ error: 'Teacher ID required' }, { status: 400 })

  const body = await req.json()
  const { firstName, lastName, email, phone, address, isActive, departmentHod, subjectAssignments } = body

  const schoolId = schoolAdmin.schoolId
  const teacher = await prisma.teacher.findFirst({
    where: { id: teacherId, schoolId },
  })
  if (!teacher) return NextResponse.json({ error: 'Teacher not found' }, { status: 404 })

  // Update user record
  if (firstName || lastName || email || isActive !== undefined) {
    await prisma.user.update({
      where: { id: teacher.userId },
      data: {
        ...(firstName !== undefined && { firstName }),
        ...(lastName !== undefined && { lastName }),
        ...(email !== undefined && { email }),
        ...(isActive !== undefined && { isActive }),
        ...(phone !== undefined && { phone: phone || null }),
        ...(address !== undefined && { address: address || null }),
      },
    })
  }

  // Update teacher record
  await prisma.teacher.update({
    where: { id: teacherId },
    data: {
      ...(departmentHod !== undefined && { departmentHod: departmentHod || null }),
    },
  })

  // Sync subject assignments — wipe and rebuild
  if (subjectAssignments !== undefined) {
    await (prisma as any).teacherSubjectAssignment.deleteMany({ where: { teacherId } })

    const rows: Array<{ classId: string; subject: string }> = Array.isArray(subjectAssignments) ? subjectAssignments : []
    for (const row of rows) {
      if (row.classId && row.subject) {
        await (prisma as any).teacherSubjectAssignment.create({
          data: { teacherId, classId: row.classId, subject: row.subject },
        })
      }
    }
  }

  return NextResponse.json({ message: 'Teacher updated successfully' })
})
