import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { route } from '@/lib/api-middleware'
import { checkRateLimit, getClientIdentifier, rateLimitAuth } from '@/lib/rate-limit'

export const POST = route({}, async (req, { user }) => {
  const rl = await checkRateLimit(`change-pw:${getClientIdentifier(req)}`, rateLimitAuth)
  if (!rl.allowed) {
    return NextResponse.json({ error: 'Too many attempts. Try again later.' }, { status: 429 })
  }

  const { currentPassword, newPassword } = await req.json()

  if (!currentPassword || !newPassword) {
    return NextResponse.json({ error: 'Current password and new password are required' }, { status: 400 })
  }

  if (newPassword.length < 8) {
    return NextResponse.json({ error: 'New password must be at least 8 characters' }, { status: 400 })
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id }
  })

  if (!dbUser || !dbUser.password) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  const isValid = await bcrypt.compare(currentPassword, dbUser.password)
  if (!isValid) {
    return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 })
  }

  const hashedPassword = await bcrypt.hash(newPassword, 12)

  await prisma.user.update({
    where: { id: user.id },
    data: { password: hashedPassword }
  })

  return NextResponse.json({ message: 'Password changed successfully' })
})
