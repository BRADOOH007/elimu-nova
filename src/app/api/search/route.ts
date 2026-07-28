import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { route } from '@/lib/api-middleware'

const prisma = new PrismaClient()

export const GET = route({}, async (req, { user }) => {
  const { searchParams } = new URL(req.url)
  const query = searchParams.get('q')
  const role = searchParams.get('role') || user.role

  if (!query || query.trim().length < 2) {
    return NextResponse.json({ 
      error: 'Search query must be at least 2 characters long' 
    }, { status: 400 })
  }

  const searchTerm = query.trim().toLowerCase()
  const results: any = {
    schools: [],
    users: [],
    packages: [],
    total: 0
  }

  // Super Admin can search everything
  if (role === 'SUPER_ADMIN') {
    // Search Schools
    const schools = await prisma.school.findMany({
      where: {
        OR: [
          { name: { contains: searchTerm, mode: 'insensitive' } },
          { email: { contains: searchTerm, mode: 'insensitive' } },
          { address: { contains: searchTerm, mode: 'insensitive' } },
          { phone: { contains: searchTerm, mode: 'insensitive' } }
        ]
      },
      include: {
        schoolAdmin: {
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
        teachers: {
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
        }
      },
      take: 10
    })

    // Search Users
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { firstName: { contains: searchTerm, mode: 'insensitive' } },
          { lastName: { contains: searchTerm, mode: 'insensitive' } },
          { email: { contains: searchTerm, mode: 'insensitive' } }
        ]
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true
      },
      take: 10
    })

    results.schools = schools.map(school => ({
      id: school.id,
      name: school.name,
      email: school.email,
      address: school.address,
      phone: school.phone,
      isActive: school.isActive,
      adminCount: school.schoolAdmin ? 1 : 0,
      teacherCount: school.teachers.length,
      studentCount: school.students.length,
      createdAt: school.createdAt
    }))

    results.users = users.map(u => ({
      id: u.id,
      name: `${u.firstName} ${u.lastName}`,
      email: u.email,
      role: u.role,
      isActive: u.isActive,
      createdAt: u.createdAt
    }))

    results.total = results.schools.length + results.users.length
  }

  // School Admin can search within their school
  else if (role === 'SCHOOL_ADMIN') {
    const schoolAdmin = await prisma.schoolAdmin.findFirst({
      where: { userId: user.id },
      include: { school: true }
    })

    if (schoolAdmin) {
      // Search users in their school
      const schoolUsers = await prisma.user.findMany({
        where: {
          AND: [
            {
              OR: [
                { firstName: { contains: searchTerm, mode: 'insensitive' } },
                { lastName: { contains: searchTerm, mode: 'insensitive' } },
                { email: { contains: searchTerm, mode: 'insensitive' } }
              ]
            },
            {
              OR: [
                { schoolAdmin: { schoolId: schoolAdmin.schoolId } },
                { teacher: { schoolId: schoolAdmin.schoolId } },
                { student: { schoolId: schoolAdmin.schoolId } }
              ]
            }
          ]
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          role: true,
          isActive: true,
          createdAt: true
        },
        take: 10
      })

      results.users = schoolUsers.map(u => ({
        id: u.id,
        name: `${u.firstName} ${u.lastName}`,
        email: u.email,
        role: u.role,
        isActive: u.isActive,
        createdAt: u.createdAt
      }))

      results.total = results.users.length
    }
  }

  // Teacher can search their students
  else if (role === 'TEACHER') {
    const teacher = await prisma.teacher.findFirst({
      where: { userId: user.id }
    })

    if (teacher) {
      const students = await prisma.student.findMany({
        where: {
          teacherId: teacher.id,
          user: {
            OR: [
              { firstName: { contains: searchTerm, mode: 'insensitive' } },
              { lastName: { contains: searchTerm, mode: 'insensitive' } },
              { email: { contains: searchTerm, mode: 'insensitive' } }
            ]
          }
        },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              isActive: true,
              createdAt: true
            }
          }
        },
        take: 10
      })

      results.users = students.map(student => ({
        id: student.user.id,
        name: `${student.user.firstName} ${student.user.lastName}`,
        email: student.user.email,
        role: 'STUDENT',
        isActive: student.user.isActive,
        createdAt: student.user.createdAt
      }))

      results.total = results.users.length
    }
  }

  return NextResponse.json({
    success: true,
    query: searchTerm,
    results,
    role
  })
})
