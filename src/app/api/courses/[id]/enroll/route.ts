import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const prismaAny = prisma as any;

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { studentId } = body;

    // Check if course exists
    const course = await prismaAny.course.findUnique({
      where: { id }
    });

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    // Enroll student
    const enrollment = await prismaAny.courseEnrollment.create({
      data: {
        courseId: id,
        studentId,
        status: 'ACTIVE'
      },
      include: {
        course: true,
        student: {
          include: {
            user: true
          }
        }
      }
    });

    return NextResponse.json({
      enrollment,
      message: 'Student enrolled successfully'
    });

  } catch (error) {
    console.error('Error enrolling student:', error);
    return NextResponse.json({ error: 'Failed to enroll student' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { studentId } = body;

    // Find enrollment
    const enrollment = await prismaAny.courseEnrollment.findFirst({
      where: {
        courseId: id,
        studentId
      }
    });

    if (!enrollment) {
      return NextResponse.json({ error: 'Enrollment not found' }, { status: 404 });
    }

    // Delete enrollment
    await prismaAny.courseEnrollment.delete({
      where: { id: enrollment.id }
    });

    return NextResponse.json({
      message: 'Student unenrolled successfully'
    });

  } catch (error) {
    console.error('Error unenrolling student:', error);
    return NextResponse.json({ error: 'Failed to unenroll student' }, { status: 500 });
  }
}
