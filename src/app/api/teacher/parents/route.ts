import { NextResponse } from 'next/server';
import { prisma, withRetry } from '@/lib/prisma';
import { route } from '@/lib/api-middleware';
import { generateUsername } from '@/lib/bulk-import';

export const GET = route({ auth: 'TEACHER' }, async (req, { user }) => {
  try {
    console.log('👥 Fetching parents for teacher...')

    // Get teacher information
    const teacher = await withRetry(() => prisma.teacher.findFirst({
      where: { userId: user.id }
    }));

    if (!teacher) {
      console.log('❌ Teacher not found for userId:', user.id)
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
})

/**
 * POST /api/teacher/parents
 * Create or link a parent to a student.
 * Body: { firstName, lastName, email, phone?, studentId }
 */
export const POST = route({ auth: 'TEACHER' }, async (req, { user }) => {
  try {
    const teacher = await prisma.teacher.findFirst({ where: { userId: user.id } })
    if (!teacher) return NextResponse.json({ error: 'Teacher not found' }, { status: 404 })

    const { firstName, lastName, email, phone, studentId } = await req.json()
    if (!firstName || !lastName || !email || !studentId) {
      return NextResponse.json({ error: 'firstName, lastName, email and studentId are required' }, { status: 400 })
    }

    // Verify student belongs to this teacher
    const student = await prisma.student.findFirst({
      where: { id: studentId, teacherId: teacher.id },
    })
    if (!student) return NextResponse.json({ error: 'Student not found or not your student' }, { status: 404 })

    // Check if parent user already exists
    let parentUser = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } })
    let parent: any

    if (parentUser) {
      // Link existing user as parent if not already
      parent = await prisma.parent.upsert({
        where: { userId: parentUser.id },
        update: {},
        create: { userId: parentUser.id },
      })
    } else {
      // Create new user + parent
      const bcrypt = await import('bcryptjs')
      const tempPwd  = `Parent${Math.floor(100000 + Math.random() * 900000)}`
      const hashed   = await bcrypt.hash(tempPwd, 10)
      // Generate unique username
      let username = generateUsername(firstName, lastName)
      let suffixAttempt = 0
      while (await prisma.user.findUnique({ where: { username } })) {
        suffixAttempt++
        username = generateUsername(firstName, lastName, `${Date.now().toString(36)}${suffixAttempt}`)
      }
      parentUser = await prisma.user.create({
        data: {
          username,
          firstName, lastName,
          email:    email.toLowerCase().trim(),
          password: hashed,
          role:     'PARENT',
          isActive: true,
          phone:    phone || null,
        },
      })
      parent = await prisma.parent.create({ data: { userId: parentUser.id } })
    }

    // Link parent → student (upsert to avoid duplicates)
    await (prisma as any).parentStudent.upsert({
      where:  { parentId_studentId: { parentId: parent.id, studentId } },
      update: {},
      create: { parentId: parent.id, studentId },
    })

    return NextResponse.json({
      success: true,
      parent: {
        id:    parent.id,
        name:  `${parentUser.firstName} ${parentUser.lastName}`,
        email: parentUser.email,
        phone: parentUser.phone,
      },
      message: 'Parent linked to student successfully',
    }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating/linking parent:', error)
    return NextResponse.json({ error: 'Failed to add parent' }, { status: 500 })
  }
})
