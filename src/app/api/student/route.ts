import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { route } from '@/lib/api-middleware';

export const GET = route({ auth: 'STUDENT' }, async (req, { user }) => {
  console.log('Student API: GET request received');
  console.log('Student API: Session check', { hasSession: true, userId: user.id, role: user.role });

  // Get teacher information
  console.log('Student API: Looking up teacher for user', user.id);
  const teacher = await prisma.teacher.findFirst({
    where: { userId: user.id }
  });

  if (!teacher) {
    console.log('Student API: Teacher not found for user', user.id);
    return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });
  }

  console.log('Student API: Found teacher', teacher.id);

  // Fetch students for this teacher
  console.log('Student API: Fetching students for teacher', teacher.id);
  const students = await prisma.student.findMany({
    where: { teacherId: teacher.id },
    include: {
      user: {
        select: {
          firstName: true,
          lastName: true,
          email: true
        }
      },
      class: {
        select: {
          id: true,
          name: true,
          grade: true
        }
      }
    },
    orderBy: {
      id: 'desc'
    }
  });

  console.log('Student API: Found students', students.length);

  const formattedStudents = students.map(student => ({
    id: student.id,
    user: student.user,
    class: student.class
  }));

  return NextResponse.json({
    success: true,
    students: formattedStudents
  });
})
