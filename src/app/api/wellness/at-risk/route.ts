import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { mentalHealthService } from '@/lib/mental-health-checkin'
import { route } from '@/lib/api-middleware'

export const GET = route({ auth: ['TEACHER', 'SCHOOL_ADMIN', 'SUPER_ADMIN'] }, async (req, { user }) => {
  let schoolId: string | undefined

  if (user.role === 'TEACHER') {
    const teacher = await prisma.teacher.findUnique({ where: { userId: user.id } })
    if (!teacher?.schoolId) return NextResponse.json({ error: 'No school association' }, { status: 400 })
    schoolId = teacher.schoolId
  } else if (user.role === 'SCHOOL_ADMIN') {
    const admin = await prisma.schoolAdmin.findUnique({ where: { userId: user.id } })
    if (!admin?.schoolId) return NextResponse.json({ error: 'No school association' }, { status: 400 })
    schoolId = admin.schoolId
  } else {
    const { searchParams } = new URL(req.url)
    schoolId = searchParams.get('schoolId') || undefined
  }

  if (!schoolId) return NextResponse.json({ error: 'schoolId required' }, { status: 400 })
  const students = await mentalHealthService.getAtRiskStudents(schoolId)
  return NextResponse.json({ students })
})
