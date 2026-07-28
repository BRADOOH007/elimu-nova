import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { route } from '@/lib/api-middleware';

const prismaAny = prisma as any;

async function canAccessCourse(user: any, courseId: string, write = false): Promise<boolean> {
  if (user.role === 'SUPER_ADMIN') return true;

  if (user.role === 'SCHOOL_ADMIN') {
    const schoolAdmin = await prisma.schoolAdmin.findUnique({
      where: { userId: user.id },
      select: { schoolId: true }
    });

    if (!schoolAdmin?.schoolId) return false;

    const course = await prismaAny.course.findUnique({
      where: { id: courseId },
      select: { schoolId: true }
    });

    return course?.schoolId === schoolAdmin.schoolId;
  }

  if (user.role === 'TEACHER') {
    const teacher = await prisma.teacher.findUnique({
      where: { userId: user.id },
      select: { id: true }
    });

    if (!teacher?.id) return false;

    const assignment = await prismaAny.teacherCourseAssignment.findUnique({
      where: {
        teacherId_courseId: {
          teacherId: teacher.id,
          courseId
        }
      }
    });

    return !!assignment;
  }

  if (!write && user.role === 'STUDENT') {
    const student = await prisma.student.findUnique({
      where: { userId: user.id },
      select: { id: true }
    });

    if (!student?.id) return false;

    const enrollment = await prismaAny.courseEnrollment.findUnique({
      where: {
        studentId_courseId: {
          studentId: student.id,
          courseId
        }
      }
    });

    return !!enrollment;
  }

  return false;
}

export const GET = route({}, async (req, { user, params }) => {
  const { id } = params;

  const course = await prismaAny.course.findUnique({
    where: { id },
    include: {
      curriculum: true,
      school: true,
      lessons: {
        orderBy: {
          order: 'asc'
        }
      },
      assignments: {
        include: {
          assignment: true
        },
        orderBy: {
          order: 'asc'
        }
      },
      enrollments: {
        include: {
          student: {
            include: {
              user: true
            }
          }
        }
      },
      teacherAssignments: {
        include: {
          teacher: {
            include: {
              user: true
            }
          }
        }
      },
      _count: {
        select: {
          enrollments: true,
          lessons: true,
          assignments: true
        }
      }
    }
  });

  if (!course) {
    return NextResponse.json({ error: 'Course not found' }, { status: 404 });
  }

  if (!await canAccessCourse(user, id)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  return NextResponse.json({ course });
});

export const PUT = route({}, async (req, { user, params }) => {
  const { id } = params;
  const body = await req.json();

  if (!await canAccessCourse(user, id, true)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const updatedCourse = await prismaAny.course.update({
    where: { id },
    data: body,
    include: {
      curriculum: true,
      school: true,
      lessons: true,
      assignments: true,
      teacherAssignments: true,
      enrollments: true
    }
  });

  return NextResponse.json({
    course: updatedCourse,
    message: 'Course updated successfully'
  });
});

export const DELETE = route({}, async (req, { user, params }) => {
  const { id } = params;

  if (!await canAccessCourse(user, id, true)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  await prismaAny.course.delete({
    where: { id }
  });

  return NextResponse.json({ message: 'Course deleted successfully' });
});
