import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { route } from '@/lib/api-middleware'
import { cache } from '@/lib/redis'
import { TTL } from '@/lib/cache-helpers'

export const GET = route({ auth: 'TEACHER' }, async (req, { user }) => {
  try {
    // Cache school info for 10 min — it almost never changes mid-session
    const cacheKey = `teacher:school-info:${user.id}`
    try {
      const cached = await cache.get(cacheKey)
      if (cached) return NextResponse.json(JSON.parse(cached))
    } catch { /* miss */ }

    const teacher = await prisma.teacher.findUnique({
      where: { userId: user.id },
      include: {
        school: {
          select: { id: true, name: true, address: true, phone: true, email: true, website: true, logo: true, createdAt: true }
        }
      }
    })

    if (!teacher) return NextResponse.json({ error: 'Teacher not found' }, { status: 404 })

    const responseData = {
      school: teacher.school,
      teacher: {
        firstName: (user as any).firstName || user.name?.split(' ')[0] || '',
        lastName:  (user as any).lastName  || user.name?.split(' ').slice(1).join(' ') || '',
        email:     user.email
      }
    }

    try { await cache.set(cacheKey, JSON.stringify(responseData), TTL.LONG) } catch { /* non-fatal */ }

    return NextResponse.json(responseData)
  } catch (error) {
    console.error('Error fetching school info:', error)
    return NextResponse.json({ error: 'Failed to fetch school information' }, { status: 500 })
  }
})
