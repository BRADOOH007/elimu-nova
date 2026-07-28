import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { route } from '@/lib/api-middleware'
import { extractEncryptedPassword } from '@/lib/password-encryption'
import { generatePassword } from '@/lib/bulk-import'

// Reveal the stored password (decrypted from the address field)
export const GET = route({ auth: 'SUPER_ADMIN' }, async (req, { params }) => {
  const { id } = params

  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, firstName: true, lastName: true, email: true, username: true, address: true },
  })

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  const password = extractEncryptedPassword(user.address)

  return NextResponse.json({
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    username: user.username,
    password: password || null,
    hasStoredPassword: !!password,
  })
})

export async function generateStaticParams() {
  return []
}
