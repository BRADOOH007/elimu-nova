import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { route } from '@/lib/api-middleware';

export const GET = route({ skipSubscriptionCheck: true }, async (req, { user }) => {
  const teacher = await prisma.teacher.findFirst({
    where: { userId: user.id }
  });

  if (!teacher) {
    return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });
  }

  const classes = await prisma.class.findMany({
    where: { teacherId: teacher.id },
    select: {
      id: true,
      name: true,
      subject: true,
      grade: true,
      description: true,
      createdAt: true
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  return NextResponse.json({
    success: true,
    classes: classes
  });
});
