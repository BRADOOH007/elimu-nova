import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { route } from '@/lib/api-middleware'

export const GET = route({ auth: 'SUPER_ADMIN' }, async () => {
  const [
    total,
    active,
    superAdmins,
    schoolAdmins,
    teachers,
    students,
    parents,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { isActive: true } }),
    prisma.user.count({ where: { role: 'SUPER_ADMIN' } }),
    prisma.user.count({ where: { role: 'SCHOOL_ADMIN' } }),
    prisma.user.count({ where: { role: 'TEACHER' } }),
    prisma.user.count({ where: { role: 'STUDENT' } }),
    prisma.user.count({ where: { role: 'PARENT' } }),
  ])

  return NextResponse.json({
    total,
    active,
    superAdmins,
    schoolAdmins,
    teachers,
    students,
    parents,
    educatorsAndStudents: teachers + students,
    administrators: superAdmins + schoolAdmins,
  })
})
