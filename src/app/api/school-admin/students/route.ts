import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { encryptPassword, stripPasswordFromAddress } from '@/lib/password-encryption'
import { route } from '@/lib/api-middleware'
import { CreateStudentSchema } from '@/lib/validators'
import { parsePagination, paginate } from '@/lib/pagination'
import { generatePassword as genPwd, generateUsername } from '@/lib/bulk-import'
import { getKICDSubjectsForGrade } from '@/lib/curriculum-subjects'

function generateStudentEmail(firstName: string, lastName: string, suffix?: string): string {
  const base = `${firstName.toLowerCase().replace(/\s+/g,'')}.${lastName.toLowerCase().replace(/\s+/g,'')}`
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

export const GET = route({ auth: 'SCHOOL_ADMIN' }, async (req, { user }) => {
  const admin = await prisma.schoolAdmin.findUnique({ where: { userId: user.id } })
  if (!admin) return NextResponse.json({ error: 'School admin not found' }, { status: 404 })

  const { searchParams } = new URL(req.url)
  const pg = parsePagination(searchParams)

  const [students, total] = await Promise.all([
    prisma.student.findMany({
      where: { schoolId: admin.schoolId, deletedAt: null },
      include: { user: { select: { id: true, firstName: true, lastName: true, email: true, phone: true, address: true, isActive: true, createdAt: true } }, class: { select: { id: true, name: true, grade: true } } },
      orderBy: { user: { firstName: 'asc' } },
      skip: (pg.page - 1) * pg.pageSize,
      take: pg.pageSize,
    }),
    prisma.student.count({ where: { schoolId: admin.schoolId, deletedAt: null } }),
  ])

  return NextResponse.json(paginate(
    students.map(s => ({ id: s.id, name: `${s.user.firstName} ${s.user.lastName}`, email: s.user.email, phone: s.user.phone, address: stripPasswordFromAddress(s.user.address), grade: s.class?.grade || 'Not assigned', className: s.class?.name || 'No class', classId: s.classId, status: s.user.isActive ? 'Active' : 'Inactive', joinDate: s.user.createdAt.toISOString() })),
    total, pg,
  ))
})

export const POST = route({ auth: 'SCHOOL_ADMIN', schema: CreateStudentSchema }, async (req, { user, body }) => {
  const admin = await prisma.schoolAdmin.findUnique({ where: { userId: user.id } })
  if (!admin) return NextResponse.json({ error: 'School admin not found' }, { status: 404 })

  const { firstName, lastName, email, phone, address, classId, password, grade, subjects, parentFirstName, parentLastName, parentEmail, parentPhone } = body!
  const plainPassword = password || genPwd()
  const hashedPassword = await bcrypt.hash(plainPassword, 10)
  const encryptedPassword = encryptPassword(plainPassword)
  const addressWithPassword = address ? `${encryptedPassword}\n---\n${address}` : encryptedPassword

  const loginEmail = email?.trim() ? email.trim().toLowerCase() : generateStudentEmail(firstName, lastName)

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
      if (existingWithSuffix) return NextResponse.json({ error: 'A student with this name already exists.' }, { status: 400 })
      return createStudent(firstName, lastName, emailWithSuffix, phone ?? null, address ?? null, classId ?? null, grade ?? null, subjects, { firstName: parentFirstName, lastName: parentLastName, email: parentEmail, phone: parentPhone }, admin, plainPassword, hashedPassword, addressWithPassword)
    }
    return NextResponse.json({ error: 'A user with this email already exists' }, { status: 400 })
  }

  return createStudent(firstName, lastName, loginEmail, phone ?? null, address ?? null, classId ?? null, grade ?? null, subjects, { firstName: parentFirstName, lastName: parentLastName, email: parentEmail, phone: parentPhone }, admin, plainPassword, hashedPassword, addressWithPassword)
})

interface ParentDetails { firstName?: string; lastName?: string; email?: string; phone?: string }

async function createStudent(firstName: string, lastName: string, email: string, phone: string | null, address: string | null, classId: string | null, grade: string | null, subjects: string[] | undefined, parent: ParentDetails, admin: { id: string; schoolId: string | null }, plainPassword: string, hashedPassword: string, addressWithPassword: string) {
  const username = await generateUniqueUsername(firstName, lastName)
  // Derive the teacherId from the assigned class so the student appears in
  // that teacher's roster/dashboard immediately.
  let teacherId: string | null = null
  let resolvedGrade = grade
  if (classId) {
    const cls = await prisma.class.findFirst({
      where: { id: classId, schoolId: admin.schoolId },
      select: { teacherId: true, grade: true },
    })
    teacherId = cls?.teacherId ?? null
    if (!resolvedGrade) resolvedGrade = cls?.grade ?? null
  }

  // Auto-assign KICD grade subjects when the admin leaves subjects unselected.
  const assignedSubjects = subjects && subjects.length > 0
    ? subjects
    : getKICDSubjectsForGrade(resolvedGrade)

  // Prepare parent credentials BEFORE the inserts so we can return them.
  const parentEmail = parent.email?.trim()?.toLowerCase()
  let parentCredentials: { email: string; password: string; existing: boolean } | null = null
  // Prepared parent user data (hashed pwd, username) computed up front —
  // bcrypt hashing and username-collision lookups are done here, outside the
  // main create flow.
  let preparedParentUser: { username: string; passwordHash: string } | null = null
  if (parentEmail) {
    const existingParentUser = await prisma.user.findUnique({ where: { email: parentEmail } })
    if (existingParentUser) {
      parentCredentials = { email: existingParentUser.email, password: '', existing: true }
    } else {
      const parentPassword = genPwd()
      const parentHashed = await bcrypt.hash(parentPassword, 10)
      const parentUsername = await generateUniqueUsername(parent.firstName || 'Parent', parent.lastName || 'Guardian')
      parentCredentials = { email: parentEmail, password: parentPassword, existing: false }
      preparedParentUser = { username: parentUsername, passwordHash: parentHashed }
    }
  }

  // Create the student (and parent link) with sequential queries — interactive
  // $transaction timeouts against Neon/pgbouncer make multi-step transactions
  // unreliable here, so we follow the same non-transactional pattern as the
  // teacher parents route.
  const user = await prisma.user.create({ data: { username, firstName, lastName, email, password: hashedPassword, role: 'STUDENT', isActive: true, phone: phone || null, address: addressWithPassword } })
  const student = await prisma.student.create({ data: { userId: user.id, schoolId: admin.schoolId, classId: classId || null, teacherId, subjects: assignedSubjects } })

  // Create/link the parent account and link it to this student.
  if (parentEmail && parentCredentials) {
    const existingParentUser = await prisma.user.findUnique({ where: { email: parentEmail } })
    let parentRecord: { id: string }
    if (existingParentUser) {
      parentRecord = await prisma.parent.upsert({
        where: { userId: existingParentUser.id },
        update: {},
        create: { userId: existingParentUser.id, schoolId: admin.schoolId },
      })
    } else {
      const parentUser = await prisma.user.create({
        data: {
          username: preparedParentUser!.username,
          firstName: parent.firstName || 'Parent',
          lastName: parent.lastName || 'Guardian',
          email: parentEmail,
          password: preparedParentUser!.passwordHash,
          role: 'PARENT',
          isActive: true,
          phone: parent.phone || null,
        },
      })
      parentRecord = await prisma.parent.create({ data: { userId: parentUser.id, schoolId: admin.schoolId } })
    }
    await prisma.parentStudent.upsert({
      where: { parentId_studentId: { parentId: parentRecord.id, studentId: student.id } },
      update: {},
      create: { parentId: parentRecord.id, studentId: student.id },
    })
  }

  const studentWithRelations = await prisma.student.findUnique({ where: { id: student.id }, include: { user: { select: { id: true, firstName: true, lastName: true, email: true } }, class: { select: { id: true, name: true, grade: true } } } })

  return NextResponse.json({
    success: true, message: 'Student created successfully',
    student: { id: studentWithRelations!.id, name: `${studentWithRelations!.user.firstName} ${studentWithRelations!.user.lastName}`, email: studentWithRelations!.user.email, grade: studentWithRelations!.class?.grade || 'Not assigned', className: studentWithRelations!.class?.name || 'No class', subjects: assignedSubjects },
    credentials: { username: user.username, email: user.email, password: plainPassword },
    parentCredentials,
  })
}
