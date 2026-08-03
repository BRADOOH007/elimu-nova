import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { route } from '@/lib/api-middleware'

// GET /api/users/lookup?role=TEACHER&schoolId=xxx&search=...
// Returns users optionally filtered by role and school for notification targeting.
export const GET = route({}, async (req, { user }) => {
  const { searchParams } = new URL(req.url)
  const role = searchParams.get('role') || ''
  const schoolId = searchParams.get('schoolId') || ''
  const search = searchParams.get('search') || ''
  const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 200)

  // Determine effective school scope
  let effectiveSchoolId = schoolId
  if (!effectiveSchoolId && (user.role === 'SCHOOL_ADMIN' || user.role === 'TEACHER')) {
    const admin = await prisma.schoolAdmin.findUnique({ where: { userId: user.id } })
    const teacher = await prisma.teacher.findUnique({ where: { userId: user.id } })
    effectiveSchoolId = admin?.schoolId || teacher?.schoolId || ''
  }

  // Build where clause
  const where: any = { isActive: true }

  if (role) where.role = role
  if (search) {
    where.OR = [
      { firstName: { contains: search, mode: 'insensitive' } },
      { lastName: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
    ]
  }

  const users = await prisma.user.findMany({
    where,
    take: limit,
    orderBy: { firstName: 'asc' },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      role: true,
      ...(effectiveSchoolId ? {
        schoolAdmin: { where: { schoolId: effectiveSchoolId }, select: { id: true } },
        teacher: { where: { schoolId: effectiveSchoolId }, select: { id: true } },
        student: { where: { schoolId: effectiveSchoolId }, select: { id: true } },
        parent: { where: { schoolId: effectiveSchoolId }, select: { id: true } },
      } : {}),
    },
  })

  // If scoped to a school, filter to only users belonging to that school
  let filtered = users
  if (effectiveSchoolId) {
    filtered = users.filter(u => {
      const rel = (u as any).schoolAdmin || (u as any).teacher || (u as any).student || (u as any).parent
      return rel && rel.length > 0
    })
  }

  const mapped = filtered.map(u => ({
    id: u.id,
    name: `${u.firstName} ${u.lastName}`.trim(),
    email: u.email,
    role: u.role,
  }))

  return NextResponse.json({ users: mapped })
})