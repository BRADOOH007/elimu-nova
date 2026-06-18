import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const prismaAny = prisma as any;

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get query parameters
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');
    const gradeLevel = searchParams.get('gradeLevel');
    const schoolId = searchParams.get('schoolId');

    // Build where clause
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

    // Fetch courses
    const courses = await prismaAny.course.findMany({
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

    // Format response
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

  } catch (error) {
    console.error('Error fetching courses:', error);
    return NextResponse.json({ error: 'Failed to fetch courses' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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

    // Create course
    const course = await prismaAny.course.create({
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

  } catch (error) {
    console.error('Error creating course:', error);
    return NextResponse.json({ error: 'Failed to create course' }, { status: 500 });
  }
}
