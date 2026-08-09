import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { route } from '@/lib/api-middleware'
import bcrypt from 'bcryptjs'
import { generatePassword } from '@/lib/bulk-import'

export const GET = route({ auth: 'PARENT' }, async (_req, { user, params }) => {
  const parent = await (prisma as any).parent.findUnique({ where: { userId: user.id } })
  if (!parent) return NextResponse.json({ error: 'Parent not found' }, { status: 404 })

  const childId = (params as any)?.id
  const link = await (prisma as any).parentStudent.findFirst({ where: { parentId: parent.id, studentId: childId } })
  if (!link) return NextResponse.json({ error: 'Child not linked' }, { status: 403 })

  const student = await prisma.student.findUnique({
    where: { id: childId },
    include: { user: { select: { username: true, address: true } } }
  })
  if (!student?.user) return NextResponse.json({ error: 'Student not found' }, { status: 404 })

  // Read password from address field
  let password: string | null = null
  if (student.user.address) {
    try {
      const { decryptPassword } = await import('@/lib/password-encryption').catch(() => ({ decryptPassword: (a: string) => a.replace(/^enc:/, '') }))
      password = decryptPassword(student.user.address)
    } catch { /* fall through */ }
  }

  return NextResponse.json({ username: student.user.username, password: password || null, message: password ? null : 'Use Regenerate to set a new password.' })
})

export const POST = route({ auth: 'PARENT' }, async (_req, { user, params }) => {
  const parent = await (prisma as any).parent.findUnique({ where: { userId: user.id } })
  if (!parent) return NextResponse.json({ error: 'Parent not found' }, { status: 404 })

  const childId = (params as any)?.id
  const link = await (prisma as any).parentStudent.findFirst({ where: { parentId: parent.id, studentId: childId } })
  if (!link) return NextResponse.json({ error: 'Child not linked' }, { status: 403 })

  const student = await prisma.student.findUnique({
    where: { id: childId },
    include: { user: { select: { id: true, username: true } } }
  })
  if (!student) return NextResponse.json({ error: 'Student not found' }, { status: 404 })

  const newPassword = generatePassword()
  const hashed = await bcrypt.hash(newPassword, 10)

  // Store plaintext in address for recovery
  const { encryptPassword } = await import('@/lib/password-encryption').catch(() => ({ encryptPassword: (p: string) => `enc:${p}` }))
  const encrypted = encryptPassword(newPassword)

  await prisma.user.update({
    where: { id: student.userId },
    data: { password: hashed, address: encrypted }
  })

  return NextResponse.json({ username: student.user.username, password: newPassword })
})
