import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

async function requireSuperAdmin() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id || session.user.role !== 'SUPER_ADMIN') return null
  return session
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireSuperAdmin()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const id = (await params).id
    const school = await prisma.school.findUnique({
      where: { id },
      include: {
        _count: { select: { teachers: true, students: true, classes: true } },
        schoolAdmin: { include: { user: { select: { firstName: true, lastName: true, email: true } } } },
      }
    })
    if (!school) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const teachers = await prisma.teacher.findMany({
      where: { schoolId: id },
      include: {
        user: { select: { firstName: true, lastName: true, email: true, isActive: true } },
        _count: { select: { students: true } }
      }
    })

    const subscriptions = await prisma.subscription.findMany({
      where: { schoolId: id },
      include: { package: { select: { name: true } } },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({
      school: {
        ...school,
        admin: school.schoolAdmin?.user ? { name: `${school.schoolAdmin.user.firstName} ${school.schoolAdmin.user.lastName}`, email: school.schoolAdmin.user.email } : null
      },
      teachers: teachers.map(t => ({
        id: t.id, name: `${t.user.firstName} ${t.user.lastName}`, email: t.user.email,
        isActive: t.user.isActive, _count: { students: t._count.students }
      })),
      subscriptions: subscriptions.map(s => ({
        id: s.id, package: s.package, status: s.status, startDate: s.startDate,
        endDate: s.endDate, amount: s.amount
      }))
    })
  } catch (error) {
    console.error('Error fetching school:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireSuperAdmin()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const data = await request.json()
    const school = await prisma.school.update({ where: { id: (await params).id }, data })
    return NextResponse.json(school)
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireSuperAdmin()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    await prisma.school.update({ where: { id: (await params).id }, data: { isActive: false } })
    return NextResponse.json({ message: 'School deactivated' })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
