import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { route } from '@/lib/api-middleware'

export const GET = route({ auth: 'STUDENT' }, async (req, { user }) => {
  console.log('📚 Fetching student school info...')
  console.log('Session:', user?.email, user?.role)

  console.log('🔍 Looking for student with userId:', user.id)

  // Get student record
  const student = await prisma.student.findUnique({
    where: { userId: user.id },
    include: {
      school: true,
      teacher: {
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
      user: {
        select: {
          firstName: true,
          lastName: true,
          email: true
        }
      }
    }
  })

  if (!student) {
    console.log('❌ Student record not found for userId:', user.id)
    return NextResponse.json(
      { error: 'Student record not found' },
      { status: 404 }
    )
  }

  // If student has no school association, they are independent
  if (!student.school) {
    console.log('ℹ️ Independent student - no school association')
    return NextResponse.json(
      { error: 'Independent student - no school information' },
      { status: 404 }
    )
  }

  console.log('✅ Found student and school:', student.user.email, student.school.name)

  return NextResponse.json({
    school: {
      id: student.school.id,
      name: student.school.name,
      address: student.school.address,
      phone: student.school.phone,
      email: student.school.email,
      website: student.school.website,
      logo: student.school.logo,
      createdAt: student.school.createdAt.toISOString()
    },
    teacher: student.teacher ? {
      firstName: student.teacher.user.firstName,
      lastName: student.teacher.user.lastName,
      email: student.teacher.user.email
    } : null,
    student: {
      firstName: student.user.firstName,
      lastName: student.user.lastName,
      email: student.user.email
    }
  })
})
