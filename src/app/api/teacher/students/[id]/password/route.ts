import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/** Extract the stored plain password from the address field */
function extractStoredPassword(address: string | null): string | null {
  if (!address) return null;
  const match = address.match(/^PWD:([^\n]+)/);
  return match ? match[1] : null;
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Get teacher profile
    const teacher = await prisma.teacher.findUnique({
      where: { userId: session.user.id }
    });

    if (!teacher) {
      return NextResponse.json({ error: 'Teacher profile not found' }, { status: 404 });
    }

    // Get student and verify they belong to this teacher
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

    const storedPassword = extractStoredPassword(student.user.address);

    return NextResponse.json({
      success: true,
      student: {
        id: student.id,
        email: student.user.email,
        name: `${student.user.firstName} ${student.user.lastName}`,
        hasPassword: !!student.user.password,
        passwordSet: !!student.user.password,
        // Return stored plain password if available
        plainPassword: storedPassword
      }
    });

  } catch (error) {
    console.error('Error fetching student password info:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch student password info', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
