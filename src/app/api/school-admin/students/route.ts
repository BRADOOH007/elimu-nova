import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

function generateStudentPassword(): string {
  const adjs  = ['Blue','Green','Happy','Brave','Swift','Bright','Calm','Bold']
  const nouns = ['Lion','Star','River','Eagle','Mountain','Sunrise','Ocean','Forest']
  const adj  = adjs [Math.floor(Math.random() * adjs.length)]
  const noun = nouns[Math.floor(Math.random() * nouns.length)]
  const num  = Math.floor(100 + Math.random() * 900)
  return `${adj}${noun}${num}`
}

function generateStudentEmail(firstName: string, lastName: string, suffix?: string): string {
  const base = `${firstName.toLowerCase().replace(/\s+/g,'')}` +
               `.${lastName.toLowerCase().replace(/\s+/g,'')}`
  return suffix ? `${base}.${suffix}@student.local` : `${base}@student.local`
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is school admin
    if (session.user.role !== 'SCHOOL_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get school admin's school ID
    const schoolAdmin = await prisma.schoolAdmin.findUnique({
      where: { userId: session.user.id },
      include: { school: true }
    })

    if (!schoolAdmin) {
      return NextResponse.json({ error: 'School admin not found' }, { status: 404 })
    }

    const schoolId = schoolAdmin.schoolId

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || 'all'

    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {
      schoolId
    }

    if (search) {
      where.OR = [
        {
          user: {
            firstName: {
              contains: search,
              mode: 'insensitive'
            }
          }
        },
        {
          user: {
            lastName: {
              contains: search,
              mode: 'insensitive'
            }
          }
        },
        {
          user: {
            email: {
              contains: search,
              mode: 'insensitive'
            }
          }
        },
        {
          teacher: {
            user: {
              OR: [
                {
                  firstName: {
                    contains: search,
                    mode: 'insensitive'
                  }
                },
                {
                  lastName: {
                    contains: search,
                    mode: 'insensitive'
                  }
                }
              ]
            }
          }
        }
      ]
    }

    if (status !== 'all') {
      where.user = {
        ...where.user,
        isActive: status === 'active'
      }
    }

    // Get students with pagination
    const [students, total] = await Promise.all([
      prisma.student.findMany({
        where,
        skip,
        take: limit,
        orderBy: { user: { createdAt: 'desc' } },
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
              createdAt: true,
              isActive: true,
              phone: true,
              address: true
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
      }),
      prisma.student.count({ where })
    ])

    // Format students data
    const formattedStudents = students.map(student => ({
      id: student.id,
      name: `${student.user.firstName} ${student.user.lastName}`,
      email: student.user.email,
      teacher: `${student.teacher.user.firstName} ${student.teacher.user.lastName}`,
      class: student.class?.name,
      grade: student.class?.grade,
      status: student.user.isActive ? 'Active' : 'Inactive',
      joinDate: student.user.createdAt.toISOString().split('T')[0],
      phone: student.user.phone,
      address: student.user.address
    }))

    return NextResponse.json({
      students: formattedStudents,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error('Error fetching students:', error)
    return NextResponse.json(
      { error: 'Failed to fetch students' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is school admin
    if (session.user.role !== 'SCHOOL_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get school admin's school ID
    const schoolAdmin = await prisma.schoolAdmin.findUnique({
      where: { userId: session.user.id },
      include: { school: true }
    })

    if (!schoolAdmin) {
      return NextResponse.json({ error: 'School admin not found' }, { status: 404 })
    }

    const schoolId = schoolAdmin.schoolId
    const body = await request.json()
    const { firstName, lastName, email, phone, address, teacherId, classId, grade } = body

    if (!firstName || !lastName || !teacherId) {
      return NextResponse.json(
        { error: 'firstName, lastName and teacherId are required' },
        { status: 400 }
      )
    }

    // Verify teacher belongs to this school
    const teacher = await prisma.teacher.findFirst({
      where: { id: teacherId, schoolId }
    })
    if (!teacher) {
      return NextResponse.json({ error: 'Teacher not found in this school' }, { status: 404 })
    }

    // Generate or validate email
    const baseEmail = email?.trim()
      ? email.trim().toLowerCase()
      : generateStudentEmail(firstName, lastName)

    // Ensure unique email
    let loginEmail = baseEmail
    const existing = await prisma.user.findUnique({ where: { email: loginEmail } })
    if (existing) {
      if (email?.trim()) {
        return NextResponse.json({ error: 'A user with this email already exists' }, { status: 400 })
      }
      loginEmail = generateStudentEmail(firstName, lastName, Date.now().toString().slice(-4))
    }

    const plainPassword  = generateStudentPassword()
    const hashedPassword = await bcrypt.hash(plainPassword, 10)

    const addressWithPassword = address
      ? `PWD:${plainPassword}\n---\n${address}`
      : `PWD:${plainPassword}`

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          firstName, lastName,
          email:    loginEmail,
          password: hashedPassword,
          role:     'STUDENT',
          isActive: true,
          phone:    phone   || null,
          address:  addressWithPassword,
        },
      })
      const student = await tx.student.create({
        data: {
          userId:    user.id,
          schoolId,
          teacherId,
          classId:   classId || null,
        },
        include: {
          user:  { select: { firstName: true, lastName: true, email: true } },
          class: { select: { name: true, grade: true } },
        },
      })
      return { user, student }
    })

    return NextResponse.json({
      message: 'Student enrolled successfully',
      student: {
        id:        result.student.id,
        name:      `${result.student.user.firstName} ${result.student.user.lastName}`,
        email:     result.student.user.email,
        grade:     result.student.class?.grade || grade || 'Not assigned',
        className: result.student.class?.name  || 'No class',
      },
      credentials: {
        email:    loginEmail,
        password: plainPassword,
      },
    })

  } catch (error) {
    console.error('Error enrolling student:', error)
    return NextResponse.json(
      { error: 'Failed to enroll student' },
      { status: 500 }
    )
  }
}