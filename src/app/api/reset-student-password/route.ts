import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { checkRateLimit, getClientIdentifier, rateLimitAuth } from '@/lib/rate-limit';
import { route } from '@/lib/api-middleware';

export const POST = route({ auth: ['TEACHER', 'SCHOOL_ADMIN', 'SUPER_ADMIN'] }, async (req, { user }) => {
  const rl = await checkRateLimit(`reset-pw:${getClientIdentifier(req)}`, rateLimitAuth)
  if (!rl.allowed) {
    return NextResponse.json({ error: 'Too many attempts. Try again later.' }, { status: 429 })
  }

  const { email, newPassword } = await req.json();

  if (!email || !newPassword || newPassword.length < 8) {
    return NextResponse.json({ error: 'Email and a password of at least 8 characters are required' }, { status: 400 });
  }

  const targetUser = await prisma.user.findUnique({
    where: { email },
    include: {
      student: true
    }
  });

  if (!targetUser) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  if (targetUser.role !== 'STUDENT') {
    return NextResponse.json({ error: 'User is not a student' }, { status: 403 });
  }

  if (!targetUser.student) {
    return NextResponse.json({ error: 'Student profile not found' }, { status: 404 });
  }

  if (user.role === 'TEACHER') {
    const teacher = await prisma.teacher.findUnique({
      where: { userId: user.id }
    });

    if (!teacher || targetUser.student.teacherId !== teacher.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
  } else if (user.role === 'SCHOOL_ADMIN') {
    const schoolAdmin = await prisma.schoolAdmin.findUnique({
      where: { userId: user.id }
    });

    if (!schoolAdmin || targetUser.student.schoolId !== schoolAdmin.schoolId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
  } else if (user.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const hashedPassword = await bcrypt.hash(newPassword, 12);

  await prisma.user.update({
    where: { id: targetUser.id },
    data: {
      password: hashedPassword
    }
  });

  return NextResponse.json({
    success: true,
    message: 'Password reset successfully',
    email: targetUser.email,
    name: `${targetUser.firstName} ${targetUser.lastName}`
  });
})
