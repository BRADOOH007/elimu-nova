import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    console.log('👥 Fetching parents for teacher...')
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

    // Get parents of this teacher's students
    const parents = await prisma.parent.findMany({
      where: {
        students: {
          some: {
            student: {
              teacherId: teacher.id
            }
          }
        }
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            isActive: true,
            createdAt: true
          }
        },
        students: {
          include: {
            student: {
              include: {
                user: {
                  select: {
                    firstName: true,
                    lastName: true
                  }
                }
              }
            }
          }
        }
      },
      orderBy: {
        user: {
          firstName: 'asc'
        }
      }
    });

    console.log(`✅ Found ${parents.length} parents for teacher ${teacher.id}`)
    
    if (parents.length === 0) {
      console.log('⚠️ No parents found for this teacher')
    }

    return NextResponse.json({
      parents: parents.map(parent => ({
        id: parent.id,
        name: `${parent.user.firstName} ${parent.user.lastName}`,
        email: parent.user.email,
        phone: parent.user.phone,
        status: parent.user.isActive ? 'Active' : 'Inactive',
        joinDate: parent.user.createdAt.toISOString(),
        children: parent.students.map(ps => ({
          id: ps.student.id,
          name: `${ps.student.user.firstName} ${ps.student.user.lastName}`
        }))
      }))
    });

  } catch (error) {
    console.error('Error fetching parents for teacher:', error);
    return NextResponse.json(
      { error: 'Failed to fetch parents' },
      { status: 500 }
    );
  }
}
