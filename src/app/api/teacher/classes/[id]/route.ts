import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get teacher profile
    const teacher = await prisma.teacher.findUnique({
      where: { userId: session.user.id }
    });

    if (!teacher) {
      return NextResponse.json({ error: 'Teacher profile not found' }, { status: 404 });
    }

    // Get class with students
    const classData = await prisma.class.findUnique({
      where: { 
        id: (await params).id,
        teacherId: teacher.id
      },
      include: {
        students: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        },
        _count: {
          select: {
            students: true
          }
        }
      }
    });

    if (!classData) {
      return NextResponse.json({ error: 'Class not found' }, { status: 404 });
    }

    // Format response
    const formattedClass = {
      id: classData.id,
      name: classData.name,
      subject: classData.subject,
      grade: classData.grade,
      description: classData.description,
      studentCount: classData._count.students,
      createdAt: classData.createdAt,
      isActive: classData.isActive,
      students: classData.students.map(student => ({
        id: student.id,
        name: `${student.user.firstName} ${student.user.lastName}`,
        email: student.user.email
      }))
    };

    return NextResponse.json({ class: formattedClass });

  } catch (error) {
    console.error('Error fetching class:', error);
    return NextResponse.json({ error: 'Failed to fetch class' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { name, subject, grade, description, isActive } = body;

    // Get teacher profile
    const teacher = await prisma.teacher.findUnique({
      where: { userId: session.user.id }
    });

    if (!teacher) {
      return NextResponse.json({ error: 'Teacher profile not found' }, { status: 404 });
    }

    // Check if class exists and belongs to teacher
    const existingClass = await prisma.class.findUnique({
      where: { id: (await params).id }
    });

    if (!existingClass || existingClass.teacherId !== teacher.id) {
      return NextResponse.json({ error: 'Class not found or access denied' }, { status: 404 });
    }

    // If renaming, check no other class has that name already
    if (name && name.trim().toLowerCase() !== existingClass.name.toLowerCase()) {
      const duplicate = await prisma.class.findFirst({
        where: {
          teacherId: teacher.id,
          name: { equals: name.trim(), mode: 'insensitive' },
          NOT: { id: existingClass.id },
        }
      })
      if (duplicate) {
        return NextResponse.json(
          { error: `A class named "${duplicate.name}" already exists.` },
          { status: 409 }
        )
      }
    }

    // Update class
    const updatedClass = await prisma.class.update({
      where: { id: (await params).id },
      data: {
        name,
        subject,
        grade,
        description: description || null,
        isActive: isActive !== undefined ? isActive : existingClass.isActive
      },
      include: {
        _count: {
          select: {
            students: true
          }
        }
      }
    });

    // Format response
    const formattedClass = {
      id: updatedClass.id,
      name: updatedClass.name,
      subject: updatedClass.subject,
      grade: updatedClass.grade,
      description: updatedClass.description,
      studentCount: updatedClass._count.students,
      createdAt: updatedClass.createdAt,
      isActive: updatedClass.isActive
    };

    return NextResponse.json({
      class: formattedClass,
      message: 'Class updated successfully'
    });

  } catch (error) {
    console.error('Error updating class:', error);
    return NextResponse.json({ error: 'Failed to update class' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get teacher profile
    const teacher = await prisma.teacher.findUnique({
      where: { userId: session.user.id }
    });

    if (!teacher) {
      return NextResponse.json({ error: 'Teacher profile not found' }, { status: 404 });
    }

    // Check if class exists and belongs to teacher
    const existingClass = await prisma.class.findUnique({
      where: { id: (await params).id }
    });

    if (!existingClass || existingClass.teacherId !== teacher.id) {
      return NextResponse.json({ error: 'Class not found or access denied' }, { status: 404 });
    }

    // Delete class (this will also unassign all students from this class)
    await prisma.class.delete({
      where: { id: (await params).id }
    });

    return NextResponse.json({
      message: 'Class deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting class:', error);
    return NextResponse.json({ error: 'Failed to delete class' }, { status: 500 });
  }
}
