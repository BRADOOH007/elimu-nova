import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { route } from '@/lib/api-middleware'
import { generatePassword } from '@/lib/bulk-import'
import { encryptPassword } from '@/lib/password-encryption'

// Regenerate a new password for a user
export const POST = route({ auth: 'SUPER_ADMIN' }, async (req, { params }) => {
  const { id } = params
  const bcrypt = await import('bcryptjs')

  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, firstName: true, lastName: true, email: true, address: true },
  })

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  const plainPwd = generatePassword()
  const hashedPwd = await bcrypt.hash(plainPwd, 12)
  const encrypted = encryptPassword(plainPwd)

  // Keep any existing non-password address content by stripping old password
  let newAddress = encrypted
  const existingAddress = user.address
  if (existingAddress) {
    const { stripPasswordFromAddress } = await import('@/lib/password-encryption')
    const realAddress = stripPasswordFromAddress(existingAddress)
    if (realAddress?.trim()) {
      newAddress = `${encrypted}\n---\n${realAddress}`
    }
  }

  await prisma.user.update({
    where: { id },
    data: {
      password: hashedPwd,
      address: newAddress,
    },
  })

  return NextResponse.json({
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    password: plainPwd,
  })
})
