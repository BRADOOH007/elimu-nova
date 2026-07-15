import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { stripPasswordFromAddress, extractEncryptedPassword } from '@/lib/password-encryption'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'SCHOOL_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get school admin's school ID
    const schoolAdmin = await prisma.schoolAdmin.findUnique({
      where: { userId: session.user.id }
    })

    if (!schoolAdmin) {
      return NextResponse.json({ error: 'School admin not found' }, { status: 404 })
    }

    const student = await prisma.student.findFirst({
      where: {
        id,
        schoolId: schoolAdmin.schoolId
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            address: true,
            isActive: true,
            createdAt: true
          }
        },
        teacher: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true
              }
            }
          }
        },
        class: {
          select: {
            name: true,
            subject: true,
            grade: true
          }
        }
      }
    })

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }

    const formattedStudent = {
      id: student.id,
      name: `${student.user.firstName} ${student.user.lastName}`,
      email: student.user.email,
      phone: student.user.phone,
      address: stripPasswordFromAddress(student.user.address),
      teacher: student.teacher ? `${student.teacher.user.firstName} ${student.teacher.user.lastName}` : '',
      class: student.class?.name,
      grade: student.class?.grade,
      status: student.user.isActive ? 'Active' : 'Inactive',
      joinDate: student.user.createdAt.toISOString().split('T')[0]
    }

    return NextResponse.json({ student: formattedStudent })

  } catch (error) {
    console.error('Error fetching student:', error)
    return NextResponse.json(
      { error: 'Failed to fetch student' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'SCHOOL_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get school admin's school ID
    const schoolAdmin = await prisma.schoolAdmin.findUnique({
      where: { userId: session.user.id }
    })

    if (!schoolAdmin) {
      return NextResponse.json({ error: 'School admin not found' }, { status: 404 })
    }

    const body = await request.json()
    const { firstName, lastName, email, phone, address, isActive } = body

    // Check if student exists and belongs to the school
    const existingStudent = await prisma.student.findFirst({
      where: {
        id,
        schoolId: schoolAdmin.schoolId
      },
      include: { user: true }
    })

    if (!existingStudent) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }

    // Update student's user information
    const updatedStudent = await prisma.student.update({
      where: { id },
      data: {
        user: {
          update: {
            firstName: firstName || existingStudent.user.firstName,
            lastName: lastName || existingStudent.user.lastName,
            email: email || existingStudent.user.email,
            phone: phone || existingStudent.user.phone,
            address: address !== undefined
              ? (existingStudent.user.address?.startsWith('PWD_ENC:')
                ? existingStudent.user.address.split('\n---\n')[0] + '\n---\n' + address
                : address)
              : existingStudent.user.address,
            isActive: isActive !== undefined ? isActive : existingStudent.user.isActive
          }
        }
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            address: true,
            isActive: true,
            createdAt: true
          }
        },
        teacher: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true
              }
            }
          }
        },
        class: {
          select: {
            name: true,
            subject: true,
            grade: true
          }
        }
      }
    })

    const formattedStudent = {
      id: updatedStudent.id,
      name: `${updatedStudent.user.firstName} ${updatedStudent.user.lastName}`,
      email: updatedStudent.user.email,
      phone: updatedStudent.user.phone,
      address: stripPasswordFromAddress(updatedStudent.user.address),
      teacher: updatedStudent.teacher ? `${updatedStudent.teacher.user.firstName} ${updatedStudent.teacher.user.lastName}` : '',
      class: updatedStudent.class?.name,
      grade: updatedStudent.class?.grade,
      status: updatedStudent.user.isActive ? 'Active' : 'Inactive',
      joinDate: updatedStudent.user.createdAt.toISOString().split('T')[0]
    }

    return NextResponse.json({ 
      message: 'Student updated successfully',
      student: formattedStudent
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
    const { id } = await params
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'SCHOOL_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get school admin's school ID
    const schoolAdmin = await prisma.schoolAdmin.findUnique({
      where: { userId: session.user.id }
    })

    if (!schoolAdmin) {
      return NextResponse.json({ error: 'School admin not found' }, { status: 404 })
    }

    // Check if student exists and belongs to the school
    const existingStudent = await prisma.student.findFirst({
      where: {
        id,
        schoolId: schoolAdmin.schoolId
      }
    })

    if (!existingStudent) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }

    // Delete student and associated user
    await prisma.student.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Student deleted successfully' })

  } catch (error) {
    console.error('Error deleting student:', error)
    return NextResponse.json(
      { error: 'Failed to delete student' },
      { status: 500 }
    )
  }
}
