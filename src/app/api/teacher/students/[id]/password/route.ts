import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { route } from '@/lib/api-middleware';
import { extractEncryptedPassword } from '@/lib/password-encryption';

export const GET = route({ auth: 'TEACHER' }, async (req, { user, params }) => {
  try {
    const { id } = params;

    const teacher = await prisma.teacher.findUnique({
      where: { userId: user.id }
    });

    if (!teacher) {
      return NextResponse.json({ error: 'Teacher profile not found' }, { status: 404 });
    }

    const student = await prisma.student.findUnique({
      where: { 
        id: id,
        teacherId: teacher.id
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            password: true,
            address: true
          }
        }
      }
    });

    if (!student) {
      return NextResponse.json({ error: 'Student not found or access denied' }, { status: 404 });
    }

    const plainPassword = extractEncryptedPassword(student.user.address);

    return NextResponse.json({
      success: true,
      student: {
        id: student.id,
        email: student.user.email,
        name: `${student.user.firstName} ${student.user.lastName}`,
        hasPassword: !!student.user.password,
        plainPassword: plainPassword
      }
    }, {
      headers: { 'Cache-Control': 'no-store, must-revalidate' },
    });

  } catch (error) {
    console.error('Error fetching student password info:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch student password info'
    }, { status: 500 });
  }
});
