import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || session.user.role !== 'PARENT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const parent = await prisma.parent.findUnique({ where: { userId: session.user.id } })
    if (!parent) return NextResponse.json({ error: 'Parent not found' }, { status: 404 })

    const { searchParams } = new URL(request.url)
    const includePast = searchParams.get('includePast') === 'true'

    const meetings = await prisma.meeting.findMany({
      where: {
        schoolId: parent.schoolId,
        ...(includePast ? {} : { date: { gte: new Date() }, status: { in: ['SCHEDULED', 'IN_PROGRESS'] as any } }),
      },
      include: {
        creator: { select: { firstName: true, lastName: true, email: true } },
      },
      orderBy: { date: 'asc' },
      take: 50,
    })

    return NextResponse.json({ meetings })
  } catch (error) {
    console.error('[PARENT_MEETINGS_GET]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || session.user.role !== 'PARENT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const parent = await prisma.parent.findUnique({ where: { userId: session.user.id } })
    if (!parent) return NextResponse.json({ error: 'Parent not found' }, { status: 404 })

    const { title, description, date, time, duration, location } = await request.json()

    if (!title || !date || !time) {
      return NextResponse.json({ error: 'Title, date, and time are required' }, { status: 400 })
    }

    const meeting = await prisma.meeting.create({
      data: {
        schoolId: parent.schoolId,
        createdBy: session.user.id,
        title,
        description: description || '',
        date: new Date(date),
        time,
        duration: duration || 30,
        location: location || '',
        status: 'SCHEDULED',
      } as any,
    })

    return NextResponse.json({ meeting }, { status: 201 })
  } catch (error) {
    console.error('[PARENT_MEETINGS_POST]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
