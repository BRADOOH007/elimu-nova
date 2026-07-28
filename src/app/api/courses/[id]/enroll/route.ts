import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { route } from '@/lib/api-middleware';

const prismaAny = prisma as any;

export const POST = route({}, async (req, { user, params }) => {
  const { id } = params;
  const body = await req.json();
  const { studentId } = body;

  const course = await prismaAny.course.findUnique({
    where: { id }
  });

  if (!course) {
    return NextResponse.json({ error: 'Course not found' }, { status: 404 });
  }

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
});

export const DELETE = route({}, async (req, { user, params }) => {
  const { id } = params;
  const body = await req.json();
  const { studentId } = body;

  const enrollment = await prismaAny.courseEnrollment.findFirst({
    where: {
      courseId: id,
      studentId
    }
  });

  if (!enrollment) {
    return NextResponse.json({ error: 'Enrollment not found' }, { status: 404 });
  }

  await prismaAny.courseEnrollment.delete({
    where: { id: enrollment.id }
  });

  return NextResponse.json({
    message: 'Student unenrolled successfully'
  });
});
