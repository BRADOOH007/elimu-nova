import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { email, newPassword } = await req.json();

    if (!email || !newPassword || newPassword.length < 8) {
      return NextResponse.json({ error: 'Email and a password of at least 8 characters are required' }, { status: 400 });
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        student: true
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (user.role !== 'STUDENT') {
      return NextResponse.json({ error: 'User is not a student' }, { status: 403 });
    }

    if (!user.student) {
      return NextResponse.json({ error: 'Student profile not found' }, { status: 404 });
    }

    if (session.user.role === 'TEACHER') {
      const teacher = await prisma.teacher.findUnique({
        where: { userId: session.user.id }
      });

      if (!teacher || user.student.teacherId !== teacher.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    } else if (session.user.role === 'SCHOOL_ADMIN') {
      const schoolAdmin = await prisma.schoolAdmin.findUnique({
        where: { userId: session.user.id }
      });

      if (!schoolAdmin || user.student.schoolId !== schoolAdmin.schoolId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    } else if (session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update the user's password
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Password reset successfully',
      email: user.email,
      name: `${user.firstName} ${user.lastName}`
    });

  } catch (error) {
    console.error('Error resetting password:', error);
    return NextResponse.json({ 
      error: 'Failed to reset password', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
