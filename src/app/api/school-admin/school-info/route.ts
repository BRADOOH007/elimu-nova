import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { route } from '@/lib/api-middleware'

export const GET = route({ auth: 'SCHOOL_ADMIN' }, async (req, { user }) => {
  const schoolAdmin = await prisma.schoolAdmin.findUnique({
    where: { userId: user.id },
    include: {
      school: {
        select: {
          id: true,
          name: true,
          address: true,
          phone: true,
          email: true,
          website: true,
          logo: true,
          createdAt: true
        }
      }
    }
  })

  if (!schoolAdmin) {
    return NextResponse.json({ error: 'School admin not found' }, { status: 404 })
  }

  const nameParts = (user.name || '').split(' ')
  return NextResponse.json({ 
    school: schoolAdmin.school,
    admin: {
      firstName: nameParts[0] || '',
      lastName: nameParts.slice(1).join(' ') || '',
      email: user.email
    }
  })
})
