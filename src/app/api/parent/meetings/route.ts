import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { route } from '@/lib/api-middleware'

export const GET = route({ auth: 'PARENT' }, async (req, { user }) => {
  try {
    const parent = await prisma.parent.findUnique({
      where: { userId: user.id },
      include: {
        students: {
          include: { student: { select: { schoolId: true } } },
        },
      },
    })
    if (!parent) return NextResponse.json({ error: 'Parent not found' }, { status: 404 })

    // Derive schoolId from the parent's children (if any belong to a school)
    const childSchoolId = parent.students
      .map(ps => ps.student.schoolId)
      .find(Boolean)

    const { searchParams } = new URL(req.url)
    const includePast = searchParams.get('includePast') === 'true'

    const meetings = await prisma.meeting.findMany({
      where: {
        ...(childSchoolId
          ? { schoolId: childSchoolId }
          : { createdBy: user.id }),
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
})

export const POST = route({ auth: 'PARENT' }, async (req, { user }) => {
  try {
    const parent = await prisma.parent.findUnique({
      where: { userId: user.id },
      include: {
        students: {
          include: { student: { select: { schoolId: true } } },
        },
      },
    })
    if (!parent) return NextResponse.json({ error: 'Parent not found' }, { status: 404 })

    const { title, description, date, time, duration, location } = await req.json()

    if (!title || !date || !time) {
      return NextResponse.json({ error: 'Title, date, and time are required' }, { status: 400 })
    }

    const childSchoolId = parent.students
      .map(ps => ps.student.schoolId)
      .find(Boolean)

    const meeting = await prisma.meeting.create({
      data: {
        schoolId: childSchoolId || null,
        createdBy: user.id,
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
})
