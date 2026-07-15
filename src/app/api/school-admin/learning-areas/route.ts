import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { COMPREHENSIVE_SUBJECTS } from '@/lib/subjects'

async function getSchoolAdmin(userId: string) {
  return prisma.schoolAdmin.findUnique({
    where: { userId },
    include: { school: true }
  })
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || session.user.role !== 'SCHOOL_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const admin = await getSchoolAdmin(session.user.id)
    if (!admin?.schoolId) {
      return NextResponse.json({ error: 'School admin profile not found' }, { status: 404 })
    }

    const [learningAreas, totalTeacherCount, totalStudentCount, allCourses] = await Promise.all([
      prisma.learningArea.findMany({
        where: { schoolId: admin.schoolId },
        orderBy: { name: 'asc' }
      }),
      prisma.teacher.count({ where: { schoolId: admin.schoolId } }),
      prisma.student.count({ where: { schoolId: admin.schoolId } }),
      prisma.course.findMany({
        where: { schoolId: admin.schoolId },
        include: {
          teacherAssignments: {
            include: { teacher: { include: { user: { select: { firstName: true, lastName: true } } } } }
          },
          enrollments: {
            include: { student: { include: { user: { select: { firstName: true, lastName: true } } } } }
          }
        }
      })
    ])

    // Map courses by title (acting as learning area assignment container)
    const courseMap = new Map<string, typeof allCourses[0]>()
    for (const course of allCourses) {
      courseMap.set(course.title.toLowerCase(), course)
    }

    // Attach assigned teachers and students to each learning area
    const learningAreasWithAssignments = learningAreas.map(area => {
      const course = courseMap.get(area.name.toLowerCase())
      return {
        ...area,
        assignedTeachers: course
          ? course.teacherAssignments.map(ta => ({
              id: ta.teacher.id,
              name: `${ta.teacher.user.firstName} ${ta.teacher.user.lastName}`
            }))
          : [],
        assignedStudents: course
          ? course.enrollments.map(e => ({
              id: e.student.id,
              name: `${e.student.user.firstName} ${e.student.user.lastName}`
            }))
          : [],
      }
    })

    return NextResponse.json({
      learningAreas: learningAreasWithAssignments,
      catalogSubjects: COMPREHENSIVE_SUBJECTS,
      stats: {
        active: learningAreas.filter(area => area.isActive).length,
        inactive: learningAreas.filter(area => !area.isActive).length,
        teacherCount: totalTeacherCount,
        studentCount: totalStudentCount
      }
    })
  } catch (error) {
    console.error('Error fetching learning areas:', error)
    return NextResponse.json({ error: 'Failed to fetch learning areas' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || session.user.role !== 'SCHOOL_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const admin = await getSchoolAdmin(session.user.id)
    if (!admin?.schoolId) {
      return NextResponse.json({ error: 'School admin profile not found' }, { status: 404 })
    }

    const body = await request.json()
    const name = String(body.name || '').trim()
    const description = String(body.description || '').trim()

    if (!name) {
      return NextResponse.json({ error: 'Learning area name is required' }, { status: 400 })
    }

    const learningArea = await prisma.learningArea.create({
      data: {
        name,
        description: description || null,
        schoolId: admin.schoolId,
        isActive: body.isActive ?? true
      }
    })

    return NextResponse.json({ learningArea, message: 'Learning area created' }, { status: 201 })
  } catch (error) {
    console.error('Error creating learning area:', error)
    return NextResponse.json({ error: 'Failed to create learning area' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || session.user.role !== 'SCHOOL_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const admin = await getSchoolAdmin(session.user.id)
    if (!admin?.schoolId) {
      return NextResponse.json({ error: 'School admin profile not found' }, { status: 404 })
    }

    const body = await request.json()
    const id = String(body.id || '')
    if (!id) {
      return NextResponse.json({ error: 'Learning area id is required' }, { status: 400 })
    }

    const existing = await prisma.learningArea.findFirst({
      where: { id, schoolId: admin.schoolId }
    })

    if (!existing) {
      return NextResponse.json({ error: 'Learning area not found' }, { status: 404 })
    }

    const learningArea = await prisma.learningArea.update({
      where: { id },
      data: {
        ...(body.name !== undefined && { name: String(body.name).trim() }),
        ...(body.description !== undefined && { description: String(body.description || '').trim() || null }),
        ...(body.isActive !== undefined && { isActive: Boolean(body.isActive) })
      }
    })

    return NextResponse.json({ learningArea, message: 'Learning area updated' })
  } catch (error) {
    console.error('Error updating learning area:', error)
    return NextResponse.json({ error: 'Failed to update learning area' }, { status: 500 })
  }
}

/** Find or create a course that serves as assignment container for a learning area */
async function ensureCourse(learningAreaName: string, schoolId: string) {
  const title = learningAreaName
  let course = await prisma.course.findFirst({
    where: { title: { equals: title, mode: 'insensitive' }, schoolId }
  })
  if (!course) {
    course = await prisma.course.create({
      data: {
        title,
        description: `Auto-created for learning area: ${title}`,
        gradeLevel: 'All',
        type: 'OTHER',
        schoolId,
      }
    })
  }
  return course
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || session.user.role !== 'SCHOOL_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const admin = await getSchoolAdmin(session.user.id)
    if (!admin?.schoolId) {
      return NextResponse.json({ error: 'School admin profile not found' }, { status: 404 })
    }

    const body = await request.json()
    const { action, learningAreaId, teacherId, studentId } = body

    if (!action || !learningAreaId) {
      return NextResponse.json({ error: 'action and learningAreaId are required' }, { status: 400 })
    }

    const area = await prisma.learningArea.findFirst({
      where: { id: learningAreaId, schoolId: admin.schoolId }
    })
    if (!area) {
      return NextResponse.json({ error: 'Learning area not found' }, { status: 404 })
    }

    const course = await ensureCourse(area.name, admin.schoolId)

    if (action === 'assign-teacher') {
      if (!teacherId) {
        return NextResponse.json({ error: 'teacherId is required' }, { status: 400 })
      }
      const teacher = await prisma.teacher.findFirst({
        where: { id: teacherId, schoolId: admin.schoolId }
      })
      if (!teacher) {
        return NextResponse.json({ error: 'Teacher not found in this school' }, { status: 404 })
      }

      await prisma.teacherCourseAssignment.upsert({
        where: { teacherId_courseId: { teacherId, courseId: course.id } },
        update: {},
        create: { teacherId, courseId: course.id, isPrimary: true }
      })

      return NextResponse.json({ message: 'Teacher assigned to learning area' })
    }

    if (action === 'assign-student') {
      if (!studentId) {
        return NextResponse.json({ error: 'studentId is required' }, { status: 400 })
      }
      const student = await prisma.student.findFirst({
        where: { id: studentId, schoolId: admin.schoolId }
      })
      if (!student) {
        return NextResponse.json({ error: 'Student not found in this school' }, { status: 404 })
      }

      await prisma.courseEnrollment.upsert({
        where: { studentId_courseId: { studentId, courseId: course.id } },
        update: { status: 'ACTIVE' },
        create: { studentId, courseId: course.id }
      })

      return NextResponse.json({ message: 'Student assigned to learning area' })
    }

    return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
  } catch (error) {
    console.error('Error in learning area assignment:', error)
    return NextResponse.json({ error: 'Failed to process assignment' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || session.user.role !== 'SCHOOL_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const admin = await getSchoolAdmin(session.user.id)
    if (!admin?.schoolId) {
      return NextResponse.json({ error: 'School admin profile not found' }, { status: 404 })
    }

    const body = await request.json()
    const { action, learningAreaId, teacherId, studentId } = body

    if (!action || !learningAreaId) {
      return NextResponse.json({ error: 'action and learningAreaId are required' }, { status: 400 })
    }

    const area = await prisma.learningArea.findFirst({
      where: { id: learningAreaId, schoolId: admin.schoolId }
    })
    if (!area) {
      return NextResponse.json({ error: 'Learning area not found' }, { status: 404 })
    }

    const course = await prisma.course.findFirst({
      where: { title: { equals: area.name, mode: 'insensitive' }, schoolId: admin.schoolId }
    })
    if (!course) {
      return NextResponse.json({ error: 'No course found for this learning area' }, { status: 404 })
    }

    if (action === 'remove-teacher') {
      if (!teacherId) {
        return NextResponse.json({ error: 'teacherId is required' }, { status: 400 })
      }
      await prisma.teacherCourseAssignment.deleteMany({
        where: { teacherId, courseId: course.id }
      })
      return NextResponse.json({ message: 'Teacher removed from learning area' })
    }

    if (action === 'remove-student') {
      if (!studentId) {
        return NextResponse.json({ error: 'studentId is required' }, { status: 400 })
      }
      await prisma.courseEnrollment.deleteMany({
        where: { studentId, courseId: course.id }
      })
      return NextResponse.json({ message: 'Student removed from learning area' })
    }

    return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
  } catch (error) {
    console.error('Error in learning area removal:', error)
    return NextResponse.json({ error: 'Failed to remove assignment' }, { status: 500 })
  }
}
