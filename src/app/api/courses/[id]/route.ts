import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const prismaAny = prisma as any;

async function canAccessCourse(session: any, courseId: string, write = false): Promise<boolean> {
  if (session.user.role === 'SUPER_ADMIN') return true;

  if (session.user.role === 'SCHOOL_ADMIN') {
    const schoolAdmin = await prisma.schoolAdmin.findUnique({
      where: { userId: session.user.id },
      select: { schoolId: true }
    });

    if (!schoolAdmin?.schoolId) return false;

    const course = await prismaAny.course.findUnique({
      where: { id: courseId },
      select: { schoolId: true }
    });

    return course?.schoolId === schoolAdmin.schoolId;
  }

  if (session.user.role === 'TEACHER') {
    const teacher = await prisma.teacher.findUnique({
      where: { userId: session.user.id },
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

  if (!write && session.user.role === 'STUDENT') {
    const student = await prisma.student.findUnique({
      where: { userId: session.user.id },
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

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Fetch course
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

    if (!await canAccessCourse(session, id)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({ course });

  } catch (error) {
    console.error('Error fetching course:', error);
    return NextResponse.json({ error: 'Failed to fetch course' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();

    if (!await canAccessCourse(session, id, true)) {
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

  } catch (error) {
    console.error('Error updating course:', error);
    return NextResponse.json({ error: 'Failed to update course' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    if (!await canAccessCourse(session, id, true)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await prismaAny.course.delete({
      where: { id }
    });

    return NextResponse.json({ message: 'Course deleted successfully' });

  } catch (error) {
    console.error('Error deleting course:', error);
    return NextResponse.json({ error: 'Failed to delete course' }, { status: 500 });
  }
}
