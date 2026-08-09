import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { route } from '@/lib/api-middleware'
import bcrypt from 'bcryptjs'
import { generatePassword, generateUsername } from '@/lib/bulk-import'

export const POST = route({ auth: 'PARENT' }, async (req, { user }) => {
  const parent = await (prisma as any).parent.findUnique({ where: { userId: user.id } })
  if (!parent) return NextResponse.json({ error: 'Parent not found' }, { status: 404 })

  const { firstName, lastName, grade, password } = await req.json()
  if (!firstName || !lastName) return NextResponse.json({ error: 'First name and last name required' }, { status: 400 })

  // Get parent preferences for country/curriculum
  const prefs = await (prisma as any).userPreference.findUnique({ where: { userId: user.id } })
  const curriculum = prefs?.curriculum || ''
  const country = prefs?.country || ''

  const plainPwd = password || generatePassword()
  const hashed = await bcrypt.hash(plainPwd, 10)
  const username = await generateUniqueUsername(firstName, lastName)
  const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}.${Date.now().toString(36)}@student.local`

  // Create student user — store plaintext password in address for recovery
  const { encryptPassword } = await import('@/lib/password-encryption').catch(() => ({ encryptPassword: (p: string) => `enc:${p}` }))
  const encryptedPwd = encryptPassword(plainPwd)

  const studentUser = await prisma.user.create({
    data: { username, firstName, lastName, email, password: hashed, role: 'STUDENT', isActive: true, address: encryptedPwd },
  })

  // Create student profile
  const student = await prisma.student.create({
    data: { userId: studentUser.id, schoolId: parent.schoolId || null },
  })

  // Store curriculum preferences for the child
  if (curriculum) {
    await (prisma as any).userPreference.upsert({
      where: { userId: studentUser.id },
      update: { country, curriculum },
      create: { userId: studentUser.id, country, curriculum, language: 'en' },
    })
  }

  // Link parent to child
  await (prisma as any).parentStudent.create({
    data: { parentId: parent.id, studentId: student.id },
  })

  // Auto-assign KICD subjects if applicable
  if (grade) {
    const subjects = getDefaultSubjects(grade)
    if (subjects.length > 0) {
      await prisma.student.update({ where: { id: student.id }, data: { subjects } })
    }
  }

  return NextResponse.json({
    message: 'Child account created successfully',
    child: { id: student.id, name: `${firstName} ${lastName}`, email, username, grade: grade || 'Not set' },
    credentials: { username, email, password: plainPwd },
  })
})

async function generateUniqueUsername(first: string, last: string): Promise<string> {
  let u = generateUsername(first, last)
  let attempts = 0
  while (await prisma.user.findUnique({ where: { username: u } })) {
    attempts++
    u = generateUsername(first, last, `${Date.now().toString(36)}${attempts}`)
  }
  return u
}

function getDefaultSubjects(grade: string): string[] {
  const map: Record<string, string[]> = {
    PP1: ['Language Activities','Mathematical Activities','Environmental Activities'],
    PP2: ['Language Activities','Mathematical Activities','Environmental Activities'],
    'Grade 1': ['English','Mathematics','Science','Social Studies'],
    'Grade 2': ['English','Mathematics','Science','Social Studies'],
    'Grade 3': ['English','Mathematics','Science','Social Studies'],
    'Grade 4': ['English','Mathematics','Science','Social Studies'],
    'Grade 5': ['English','Mathematics','Science','Social Studies'],
    'Grade 6': ['English','Mathematics','Science','Social Studies'],
    'Grade 7': ['English','Mathematics','Integrated Science','Social Studies'],
    'Grade 8': ['English','Mathematics','Integrated Science','Social Studies'],
    'Grade 9': ['English','Mathematics','Integrated Science','Social Studies'],
  }
  return map[grade] || []
}
