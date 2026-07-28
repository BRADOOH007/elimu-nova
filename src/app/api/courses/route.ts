import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { route } from '@/lib/api-middleware';

export const GET = route({ auth: ['TEACHER', 'SCHOOL_ADMIN', 'SUPER_ADMIN'] }, async (req, { user }) => {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type');
  const gradeLevel = searchParams.get('gradeLevel');
  const schoolId = searchParams.get('schoolId');

  let where: any = {};

  if (type) {
    where.type = type;
  }

  if (gradeLevel) {
    where.gradeLevel = gradeLevel;
  }

  if (schoolId) {
    where.schoolId = schoolId;
  }

  const courses = await prisma.course.findMany({
    where,
    include: {
      curriculum: true,
      school: true,
      lessons: true,
      assignments: {
        include: {
          assignment: true
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
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  const formattedCourses = courses.map((course: any) => ({
    id: course.id,
    title: course.title,
    description: course.description,
    type: course.type,
    gradeLevel: course.gradeLevel,
    difficulty: course.difficulty,
    duration: course.duration,
    objectives: course.objectives,
    isActive: course.isActive,
    schoolId: course.schoolId,
    curriculumId: course.curriculumId,
    createdAt: course.createdAt,
    updatedAt: course.updatedAt,
    curriculum: course.curriculum,
    school: course.school,
    lessons: course.lessons,
    assignments: course.assignments,
    enrollments: course.enrollments.map((enrollment: any) => ({
      id: enrollment.id,
      studentId: enrollment.studentId,
      student: {
        id: enrollment.student.id,
        name: `${enrollment.student.user.firstName} ${enrollment.student.user.lastName}`
      },
      enrolledAt: enrollment.enrolledAt,
      progress: enrollment.progress,
      status: enrollment.status
    })),
    teacherAssignments: course.teacherAssignments.map((ta: any) => ({
      id: ta.id,
      teacherId: ta.teacherId,
      teacher: {
        id: ta.teacher.id,
        name: `${ta.teacher.user.firstName} ${ta.teacher.user.lastName}`
      },
      isPrimary: ta.isPrimary,
      assignedAt: ta.assignedAt
    })),
    stats: {
      totalEnrollments: course._count.enrollments,
      totalLessons: course._count.lessons,
      totalAssignments: course._count.assignments
    }
  }));

  return NextResponse.json({
    courses: formattedCourses,
    total: formattedCourses.length
  });
});

export const POST = route({ auth: ['TEACHER', 'SCHOOL_ADMIN', 'SUPER_ADMIN'] }, async (req, { user }) => {
  const body = await req.json();
  const {
    title,
    description,
    type,
    gradeLevel,
    difficulty,
    duration,
    objectives,
    schoolId,
    curriculumId,
    teacherIds
  } = body;

  const course = await prisma.course.create({
    data: {
      title,
      description,
      type,
      gradeLevel,
      difficulty,
      duration,
      objectives,
      schoolId: schoolId || null,
      curriculumId: curriculumId || null,
      ...(teacherIds && {
        teacherAssignments: {
          createMany: {
            data: teacherIds.map((id: string, index: number) => ({
              teacherId: id,
              isPrimary: index === 0
            }))
          }
        }
      })
    },
    include: {
      curriculum: true,
      school: true,
      lessons: true,
      assignments: true,
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

  return NextResponse.json({
    course,
    message: 'Course created successfully'
  });
});
