import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const prismaAny = prisma as any;

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

    await prismaAny.course.delete({
      where: { id }
    });

    return NextResponse.json({ message: 'Course deleted successfully' });

  } catch (error) {
    console.error('Error deleting course:', error);
    return NextResponse.json({ error: 'Failed to delete course' }, { status: 500 });
  }
}
