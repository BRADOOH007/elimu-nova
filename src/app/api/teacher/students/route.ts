import { NextResponse } from 'next/server'
import { prisma, withRetry } from '@/lib/prisma'
import type { Prisma } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { encryptPassword, stripPasswordFromAddress } from '@/lib/password-encryption'
import { route } from '@/lib/api-middleware'
import { CreateStudentSchema } from '@/lib/validators'
import { parsePagination, paginate } from '@/lib/pagination'
import { generatePassword as genPwd, generateUsername } from '@/lib/bulk-import'

function generateStudentEmail(firstName: string, lastName: string, suffix?: string): string {
  const base = `${firstName.toLowerCase().replace(/\s+/g, '')}.${lastName.toLowerCase().replace(/\s+/g, '')}`
  return suffix ? `${base}.${suffix}@student.local` : `${base}@student.local`
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

async function enrollStudent(
  firstName: string, lastName: string, email: string,
  phone: string | null, address: string | null, classId: string | null,
  teacher: { id: string; schoolId: string | null },
  providedPassword?: string,
  subjects?: string[],
  parentInfo?: { firstName: string; lastName: string; email: string; phone?: string },
) {
  const plainPassword = providedPassword || genPwd()
  const hashedPassword = await bcrypt.hash(plainPassword, 10)
  const encryptedPassword = encryptPassword(plainPassword)
  const addressWithPassword = address ? `${encryptedPassword}\n---\n${address}` : encryptedPassword
  const username = await generateUniqueUsername(firstName, lastName)

  // Derive grade from class
  let grade: string | null = null
  if (classId) {
    const cls = await prisma.class.findUnique({ where: { id: classId }, select: { grade: true } })
    grade = cls?.grade || null
  }

  const result = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: { username, firstName, lastName, email, password: hashedPassword, role: 'STUDENT', isActive: true, phone: phone || null, address: addressWithPassword }
    })
    const student = await tx.student.create({
      data: { userId: user.id, schoolId: teacher.schoolId, teacherId: teacher.id, classId: classId || null, subjects: subjects?.length ? subjects : [] }
    })
    const studentWithRelations = await tx.student.findUnique({
      where: { id: student.id },
      include: { user: { select: { id: true, firstName: true, lastName: true, email: true } }, class: { select: { id: true, name: true, grade: true } } }
    })
    return { user, student: studentWithRelations }
  })

  // Handle parent linking
  let parentCredentials: any = null
  if (parentInfo?.email && parentInfo.firstName && parentInfo.lastName) {
    try {
      let parentUser = await prisma.user.findUnique({ where: { email: parentInfo.email } })
      if (!parentUser) {
        const parentPwd = genPwd()
        parentUser = await prisma.user.create({
          data: {
            username: await generateUniqueUsername(parentInfo.firstName, parentInfo.lastName),
            firstName: parentInfo.firstName, lastName: parentInfo.lastName,
            email: parentInfo.email, password: await bcrypt.hash(parentPwd, 10),
            role: 'PARENT', isActive: true,
            phone: parentInfo.phone || null,
          },
        })
        parentCredentials = { email: parentInfo.email, password: parentPwd }
      }
      const parent = await (prisma as any).parent.upsert({
        where: { userId: parentUser.id },
        update: { schoolId: teacher.schoolId },
        create: { userId: parentUser.id, schoolId: teacher.schoolId },
      })
      await (prisma as any).parentStudent.create({
        data: { parentId: parent.id, studentId: result.student!.id },
      })
    } catch (e) { console.warn('Parent linking failed:', e) }
  }

  return NextResponse.json({
    success: true, message: 'Student enrolled successfully',
    student: { id: result.student!.id, name: `${result.student!.user.firstName} ${result.student!.user.lastName}`, email: result.student!.user.email, grade: result.student!.class?.grade || grade || 'Not assigned', className: result.student!.class?.name || 'No class' },
    credentials: { username: result.user.username, email: result.user.email, password: plainPassword },
    parentCredentials,
  })
}

export const GET = route({ auth: 'TEACHER' }, async (req, { user }) => {
  const teacher = await withRetry(() => prisma.teacher.findUnique({ where: { userId: user.id } }))
  if (!teacher) return NextResponse.json({ error: 'Teacher not found' }, { status: 404 })

  const { searchParams } = new URL(req.url)
  const pg = parsePagination(searchParams)
  const classId = searchParams.get('classId')
  const search = searchParams.get('search')?.trim()

  const where: Prisma.StudentWhereInput = {
    deletedAt: null,
    // Match students directly linked to this teacher OR students in a class
    // that this teacher teaches (covers legacy rows with null teacherId).
    OR: [
      { teacherId: teacher.id },
      { class: { teacherId: teacher.id } },
      { class: { teacherSubjectAssignments: { some: { teacherId: teacher.id } } } },
    ],
  }
  if (classId) where.classId = classId
  if (search) {
    where.user = {
      OR: [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName:  { contains: search, mode: 'insensitive' } },
        { email:     { contains: search, mode: 'insensitive' } },
      ],
    }
  }

  const [students, total] = await Promise.all([
    prisma.student.findMany({
      where,
      include: { user: { select: { id: true, firstName: true, lastName: true, email: true, phone: true, address: true, isActive: true, createdAt: true } }, class: { select: { id: true, name: true, grade: true, subject: true } } },
      orderBy: { user: { firstName: 'asc' } },
      skip: (pg.page - 1) * pg.pageSize,
      take: pg.pageSize,
    }),
    prisma.student.count({ where }),
  ])

  const result = paginate(
    students.map(s => ({
      id: s.id, name: `${s.user.firstName} ${s.user.lastName}`, email: s.user.email,
      phone: s.user.phone, address: stripPasswordFromAddress(s.user.address),
      grade: s.class?.grade || 'Not assigned', className: s.class?.name || 'No class',
      classId: s.classId, class: s.class,
      status: s.user.isActive ? 'Active' : 'Inactive',
      joinDate: s.user.createdAt.toISOString(), subjects: s.subjects,
    })),
    total,
    pg,
  )

  // Legacy alias so older consumers reading `.students` keep working
  return NextResponse.json({ ...result, students: result.data })
})

export const POST = route({ auth: 'TEACHER', schema: CreateStudentSchema }, async (req, { user, body }) => {
  const teacher = await withRetry(() => prisma.teacher.findUnique({ where: { userId: user.id } }))
  if (!teacher) return NextResponse.json({ error: 'Teacher not found' }, { status: 404 })

  const { firstName, lastName, email, phone, address, classId, password, subjects, parentFirstName, parentLastName, parentEmail, parentPhone } = body!
  const loginEmail = email?.trim() ? email.trim().toLowerCase() : generateStudentEmail(firstName, lastName)

  const parentInfo = (parentFirstName || parentLastName || parentEmail)
    ? { firstName: parentFirstName || '', lastName: parentLastName || '', email: parentEmail || '', phone: parentPhone }
    : undefined

  const existingUser = await prisma.user.findUnique({ where: { email: loginEmail } })
  if (existingUser) {
    if (!email?.trim()) {
      let suffix = 1
      let emailWithSuffix: string
      let existingWithSuffix: { id: string } | null
      do {
        emailWithSuffix = generateStudentEmail(firstName, lastName, String(suffix))
        existingWithSuffix = await prisma.user.findUnique({ where: { email: emailWithSuffix } })
        suffix++
      } while (existingWithSuffix && suffix < 1000)
      if (existingWithSuffix) return NextResponse.json({ error: 'A student with this name already exists. Please provide an email to differentiate.' }, { status: 400 })
      return enrollStudent(firstName, lastName, emailWithSuffix, phone || null, address || null, classId || null, teacher, password, subjects, parentInfo)
    }
    return NextResponse.json({ error: 'A user with this email already exists' }, { status: 400 })
  }

  return enrollStudent(firstName, lastName, loginEmail, phone || null, address || null, classId || null, teacher, password, subjects, parentInfo)
})
