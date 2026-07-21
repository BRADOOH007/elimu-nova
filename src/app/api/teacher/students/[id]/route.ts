import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id || session.user.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const teacher = await prisma.teacher.findUnique({
      where: { userId: session.user.id }
    })

    if (!teacher) {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 })
    }

    // Get the student with full details
    const student = await prisma.student.findUnique({
      where: { id: (await params).id },
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
      }
    })

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }

    if (student.schoolId !== teacher.schoolId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    return NextResponse.json({
      student: {
        id: student.id,
        name: `${student.user.firstName} ${student.user.lastName}`,
        email: student.user.email,
        phone: student.user.phone,
        address: student.user.address,
        status: student.user.isActive ? 'Active' : 'Inactive',
        joinDate: student.user.createdAt.toISOString(),
        class: student.class,
        subjects: student.subjects
      }
    })
  } catch (error) {
    console.error('Error fetching student details:', error)
    return NextResponse.json(
      { error: 'Failed to fetch student details' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id || session.user.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const teacher = await prisma.teacher.findUnique({
      where: { userId: session.user.id }
    })

    if (!teacher) {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 })
    }

    const body = await request.json()
    const { firstName, lastName, email, phone, address, classId, isActive, subjects } = body

    // Get the student to verify it belongs to this teacher's school
    const student = await prisma.student.findUnique({
      where: { id: (await params).id },
      include: { user: true }
    })

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }

    if (student.schoolId !== teacher.schoolId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Update user and student in a transaction
    await prisma.$transaction(async (tx) => {
      // Update user
      await tx.user.update({
        where: { id: student.userId },
        data: {
          firstName,
          lastName,
          email,
          phone: phone || null,
          address: address || null,
          isActive
        }
      })

      // Update student
      await tx.student.update({
        where: { id: (await params).id },
        data: {
          classId: classId || null,
          ...(subjects !== undefined ? { subjects } : {})
        }
      })
    })

    return NextResponse.json({
      success: true,
      message: 'Student updated successfully'
    })
  } catch (error) {
    console.error('Error updating student:', error)
    return NextResponse.json(
      { error: 'Failed to update student' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id || session.user.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const teacher = await prisma.teacher.findUnique({
      where: { userId: session.user.id }
    })

    if (!teacher) {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 })
    }

    // Get the student to verify it belongs to this teacher's school
    const student = await prisma.student.findUnique({
      where: { id: (await params).id }
    })

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }

    if (student.schoolId !== teacher.schoolId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Delete student (will cascade delete user due to onDelete: Cascade)
    await prisma.student.delete({
      where: { id: (await params).id }
    })

    return NextResponse.json({
      success: true,
      message: 'Student deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting student:', error)
    return NextResponse.json(
      { error: 'Failed to delete student' },
      { status: 500 }
    )
  }
}
