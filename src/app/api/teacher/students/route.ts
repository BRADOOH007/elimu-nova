import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function GET(req: NextRequest) {
  try {
    console.log('👥 Fetching students for teacher...')
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      console.log('❌ No session or user ID')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('✅ Session found:', session.user.email)

    // Get teacher information
    const teacher = await prisma.teacher.findFirst({
      where: { userId: session.user.id }
    });

    if (!teacher) {
      console.log('❌ Teacher not found for userId:', session.user.id)
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });
    }

    console.log('✅ Teacher found:', teacher.id, 'School:', teacher.schoolId)

    // Get students - only students created by this specific teacher
    const students = await prisma.student.findMany({
      where: {
        teacherId: teacher.id
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            address: true,
            isActive: true,
            createdAt: true
          }
        },
        class: {
          select: {
            id: true,
            name: true,
            grade: true,
            subject: true
          }
        }
      },
      orderBy: {
        user: {
          firstName: 'asc'
        }
      }
    });

    console.log(`✅ Found ${students.length} students created by teacher ${teacher.id}`)
    
    if (students.length === 0) {
      console.log('⚠️ No students found for this teacher')
    } else {
      console.log('Students:', students.map(s => s.user.email).join(', '))
    }

    return NextResponse.json({
      students: students.map(student => ({
        id: student.id,
        name: `${student.user.firstName} ${student.user.lastName}`,
        email: student.user.email,
        phone: student.user.phone,
        address: student.user.address,
        grade: student.class?.grade || 'Not assigned',
        className: student.class?.name || 'No class',
        classId: student.classId,
        class: student.class,
        status: student.user.isActive ? 'Active' : 'Inactive',
        joinDate: student.user.createdAt.toISOString()
      }))
    });

  } catch (error) {
    console.error('Error fetching students for teacher:', error);
    return NextResponse.json(
      { error: 'Failed to fetch students' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    console.log('➕ Creating new student...')
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      console.log('❌ No session')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('✅ Session found:', session.user.email)

    // Get teacher information
    const teacher = await prisma.teacher.findFirst({
      where: { userId: session.user.id }
    });

    if (!teacher) {
      console.log('❌ Teacher not found')
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });
    }

    console.log('✅ Teacher found:', teacher.id, 'School:', teacher.schoolId)

    const body = await req.json();
    const { firstName, lastName, email, phone, address, classId } = body;
    
    console.log('📝 Student data:', { firstName, lastName, email, classId })

    // Validate required fields
    if (!firstName || !lastName || !email) {
      return NextResponse.json(
        { error: 'First name, last name, and email are required' },
        { status: 400 }
      );
    }

    // Check if user with this email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      console.log('❌ User already exists:', email)
      return NextResponse.json(
        { error: 'A user with this email already exists' },
        { status: 400 }
      );
    }

    console.log('✅ Email is available')

    // Generate a default password (you might want to send this via email)
    const defaultPassword = 'Student@123';
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);
    
    console.log('🔐 Password hashed')

    // Create user and student in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create user
      const user = await tx.user.create({
        data: {
          firstName,
          lastName,
          email,
          password: hashedPassword,
          role: 'STUDENT',
          isActive: true,
          phone: phone || null,
          address: address || null
        }
      });

      // Create student
      const student = await tx.student.create({
        data: {
          userId: user.id,
          schoolId: teacher.schoolId,
          teacherId: teacher.id,
          classId: classId || null
        }
      });

      // Fetch student with relations
      const studentWithRelations = await tx.student.findUnique({
        where: { id: student.id },
        include: {
          user: {
            select: {
              id: true,
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
        }
      });

      return { user, student: studentWithRelations };
    });

    console.log('✅ Student created successfully:', result.user.email)
    console.log('Student ID:', result.student!.id)
    console.log('User ID:', result.user.id)
    console.log('School ID:', teacher.schoolId)

    return NextResponse.json({
      success: true,
      message: 'Student enrolled successfully',
      student: {
        id: result.student!.id,
        name: `${result.student!.user.firstName} ${result.student!.user.lastName}`,
        email: result.student!.user.email,
        grade: result.student!.class?.grade || 'Not assigned',
        className: result.student!.class?.name || 'No class'
      },
      credentials: {
        email: result.user.email,
        password: defaultPassword
      }
    });

  } catch (error) {
    console.error('Error enrolling student:', error);
    return NextResponse.json(
      { error: 'Failed to enroll student' },
      { status: 500 }
    );
  }
}