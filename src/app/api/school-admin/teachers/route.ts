import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { route } from '@/lib/api-middleware'
import { generateUsername } from '@/lib/bulk-import'
import { emailService } from '@/lib/email-service'

function generateSecurePassword(length = 12): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%&*'
  let password = ''
  const bytes = crypto.randomBytes(length)
  for (let i = 0; i < length; i++) {
    password += chars[bytes[i] % chars.length]
  }
  return password
}

async function generateUniqueUsername(firstName: string, lastName: string): Promise<string> {
  let username = generateUsername(firstName, lastName)
  let suffixAttempt = 0
  while (await prisma.user.findUnique({ where: { username } })) {
    suffixAttempt++
    username = generateUsername(firstName, lastName, `${Date.now().toString(36)}${suffixAttempt}`)
  }
  return username
}

export const GET = route({ auth: 'SCHOOL_ADMIN' }, async (req, { user }) => {
  const schoolAdmin = await prisma.schoolAdmin.findUnique({
    where: { userId: user.id },
    include: { school: true }
  })

    if (!schoolAdmin) {
      return NextResponse.json({ error: 'School admin not found' }, { status: 404 })
    }

    const schoolId = schoolAdmin.schoolId

    // Get query parameters
    const { searchParams } = new URL(req.url)
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
        }
      ]
    }

    if (status !== 'all') {
      where.user = {
        ...where.user,
        isActive: status === 'active'
      }
    }

    // Get teachers with pagination
    const [teachers, total] = await Promise.all([
      prisma.teacher.findMany({
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
          students: {
            select: { id: true }
          },
          classes: {
            select: {
              id: true,
              name: true,
              subject: true,
              grade: true,
            },
          },
          teacherSubjectAssignments: {
            select: { id: true, classId: true, subject: true },
          },
        }
      }),
      prisma.teacher.count({ where })
    ])

    // Format teachers data
    const formattedTeachers = teachers.map(teacher => ({
      id: teacher.id,
      name: `${teacher.user.firstName} ${teacher.user.lastName}`,
      email: teacher.user.email,
      students: teacher.students.length,
      status: teacher.user.isActive ? 'Active' : 'Inactive',
      joinDate: teacher.user.createdAt.toISOString().split('T')[0],
      phone: teacher.user.phone,
      address: teacher.user.address,
      subjects: teacher.classes.map(cls => cls.subject).filter(Boolean),
      gradeLevels: teacher.gradeLevels,
      teachingSubjects: teacher.subjects,
      departmentHod: teacher.departmentHod || null,
      subjectAssignments: teacher.teacherSubjectAssignments?.map(a => ({
        id: a.id, classId: a.classId, subject: a.subject,
      })) || [],
    }))

    return NextResponse.json({
      teachers: formattedTeachers,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
})

export const POST = route({ auth: 'SCHOOL_ADMIN' }, async (req, { user }) => {
  const schoolAdmin = await prisma.schoolAdmin.findUnique({
    where: { userId: user.id },
    include: { school: true }
  })

    if (!schoolAdmin) {
      return NextResponse.json({ error: 'School admin not found' }, { status: 404 })
    }

    const schoolId = schoolAdmin.schoolId
    const body = await req.json()
    const {
      firstName,
      lastName,
      email,
      phone,
      password,
      sendInviteEmail,
      gradeLevels,
      subjects,
      departmentHod,
      subjectAssignments,
    } = body

    if (!firstName || !lastName || !email) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      )
    }

    // When sending an invitation email we auto-generate a secure password;
    // otherwise the admin-provided (or client-generated) password is used.
    const inviteRequested = sendInviteEmail === true
    const resolvedPassword = inviteRequested
      ? generateSecurePassword()
      : password

    if (!resolvedPassword) {
      return NextResponse.json(
        { error: 'A password is required unless sending an invitation email' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(resolvedPassword, 12)

    // Generate username
    const username = await generateUniqueUsername(firstName, lastName)

    // Create user
    const newUser = await prisma.user.create({
      data: {
        username,
        firstName,
        lastName,
        email,
        phone: phone || null,
        password: hashedPassword,
        role: 'TEACHER',
        isActive: true
      }
    })

    // Create teacher record
    const teacher = await prisma.teacher.create({
      data: {
        userId: newUser.id,
        schoolId: schoolId,
        gradeLevels: Array.isArray(gradeLevels) ? gradeLevels : [],
        subjects: Array.isArray(subjects) ? subjects : [],
        departmentHod: departmentHod || null,
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            createdAt: true,
            isActive: true
          }
        }
      }
    })

    // Create multi-subject class assignments if provided
    const assignmentRows: Array<{ classId: string; subject: string }> = Array.isArray(subjectAssignments) ? subjectAssignments : []
    for (const row of assignmentRows) {
      if (row.classId && row.subject) {
        await (prisma as any).teacherSubjectAssignment.create({
          data: { teacherId: teacher.id, classId: row.classId, subject: row.subject },
        })
      }
    }

    // Send invitation email with setup details when requested.
    let inviteSent = false
    if (inviteRequested) {
      inviteSent = await emailService.sendCredentialsEmail(
        email,
        firstName,
        username,
        resolvedPassword
      )
    }

    return NextResponse.json({
      message: inviteRequested
        ? inviteSent
          ? 'Teacher enrolled successfully. Invitation email sent.'
          : 'Teacher enrolled successfully. Could not send email (SMTP not configured).'
        : 'Teacher enrolled successfully',
      teacher: {
        id: teacher.id,
        name: `${teacher.user.firstName} ${teacher.user.lastName}`,
        email: teacher.user.email,
        phone: teacher.user.phone,
        username: newUser.username,
        password: inviteRequested ? null : resolvedPassword,
        status: teacher.user.isActive ? 'Active' : 'Inactive',
        joinDate: teacher.user.createdAt.toISOString().split('T')[0],
        gradeLevels: teacher.gradeLevels,
        subjects: teacher.subjects,
        departmentHod: teacher.departmentHod || null,
      },
      inviteSent,
    })
})