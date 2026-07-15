import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const teacher = await prisma.teacher.findFirst({
      where: { userId: session.user.id },
    });

    if (!teacher) {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });
    }

    const { schemeOfWorkId, studentIds, classId } = await req.json();

    if (!schemeOfWorkId) {
      return NextResponse.json({ error: 'Scheme of Work ID is required' }, { status: 400 });
    }

    const schemeOfWork = await prisma.schemeOfWork.findFirst({
      where: { id: schemeOfWorkId, teacherId: teacher.id },
    });

    if (!schemeOfWork) {
      return NextResponse.json({ error: 'Scheme of Work not found or does not belong to this teacher' }, { status: 404 });
    }

    let studentsToShareWith: string[] = [];

    if (classId) {
      const studentsInClass = await prisma.student.findMany({
        where: { classId: classId, schoolId: teacher.schoolId },
        select: { id: true },
      });
      studentsToShareWith = studentsInClass.map(s => s.id);
    }

    if (studentIds && Array.isArray(studentIds)) {
      studentsToShareWith = [...new Set([...studentsToShareWith, ...studentIds])];
    }

    if (studentsToShareWith.length === 0) {
      return NextResponse.json({ error: 'No students or class selected for sharing' }, { status: 400 });
    }

    const sharedRecords = await prisma.$transaction(
      studentsToShareWith.map(studentId =>
        prisma.sharedSchemeOfWork.upsert({
          where: {
            schemeOfWorkId_studentId: {
              schemeOfWorkId: schemeOfWork.id,
              studentId: studentId,
            },
          },
          update: {
            sharedAt: new Date(),
          },
          create: {
            schemeOfWorkId: schemeOfWork.id,
            studentId: studentId,
            teacherId: teacher.id,
            schoolId: teacher.schoolId as any,
          },
        })
      )
    );

    return NextResponse.json({ message: 'Scheme of work shared successfully', sharedCount: sharedRecords.length }, { status: 200 });

  } catch (error) {
    console.error('Error sharing scheme of work:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const student = await prisma.student.findFirst({
      where: { userId: session.user.id },
    });

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    const sharedSchemesOfWork = await prisma.sharedSchemeOfWork.findMany({
      where: { studentId: student.id },
      include: {
        schemeOfWork: {
          include: {
            teacher: {
              select: { user: { select: { firstName: true, lastName: true } } }
            }
          }
        }
      },
      orderBy: { sharedAt: 'desc' }
    });

    // Parse content for each shared scheme of work
    const parsedSharedSchemesOfWork = sharedSchemesOfWork.map(shared => {
      const sow = (shared as any).schemeOfWork
      return {
        ...shared,
        schemeOfWork: {
          ...sow,
          content: sow?.content ? JSON.parse(sow.content) : null
        }
      }
    });

    return NextResponse.json({ sharedSchemesOfWork: parsedSharedSchemesOfWork });

  } catch (error) {
    console.error('Error fetching shared schemes of work:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
