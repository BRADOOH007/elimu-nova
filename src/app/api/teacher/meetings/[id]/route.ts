import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { route } from '@/lib/api-middleware'

export const GET = route({ auth: 'TEACHER' }, async (req, { user, params }) => {
  try {
    const { id } = params

    const meeting = await prisma.meeting.findUnique({
      where: { id },
      include: {
        creator: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    })

    if (!meeting) {
      return NextResponse.json({ error: 'Meeting not found' }, { status: 404 })
    }

    // Role-based access control
    const role = user.role
    if (role === 'TEACHER') {
      // Teacher can view meetings at their school or meetings they created
      const teacher = await prisma.teacher.findUnique({ where: { userId: user.id } })
      if (!teacher) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
      if (meeting.createdBy !== user.id && meeting.schoolId !== teacher.schoolId) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 })
      }
    } else if (role === 'PARENT') {
      // Parent can view meetings at their child's school or meetings they created
      const parent = await prisma.parent.findUnique({
        where: { userId: user.id },
        include: { students: { include: { student: { select: { schoolId: true } } } } },
      })
      if (!parent) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
      const childSchoolIds = parent.students.map(ps => ps.student.schoolId).filter(Boolean)
      if (meeting.createdBy !== user.id && !childSchoolIds.includes(meeting.schoolId)) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 })
      }
    } else if (role === 'SCHOOL_ADMIN') {
      // School admin can view meetings at their school
      const admin = await prisma.schoolAdmin.findUnique({ where: { userId: user.id } })
      if (!admin || meeting.schoolId !== admin.schoolId) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 })
      }
    } else {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    return NextResponse.json({
      meeting: {
        id: meeting.id,
        title: meeting.title,
        description: meeting.description,
        date: meeting.date.toISOString().split('T')[0],
        time: meeting.time,
        duration: meeting.duration,
        location: meeting.location,
        status: meeting.status,
        attendees: meeting.attendees,
        createdBy: {
          name: `${meeting.creator.firstName} ${meeting.creator.lastName}`,
          email: meeting.creator.email
        }
      }
    })
  } catch (error) {
    console.error('Error fetching meeting:', error)
    return NextResponse.json({ error: 'Failed to fetch meeting' }, { status: 500 })
  }
})
