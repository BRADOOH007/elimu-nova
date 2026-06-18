import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { cache } from '@/lib/redis'
import { TTL } from '@/lib/cache-helpers'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (session.user.role !== 'TEACHER') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    // Cache school info for 10 min — it almost never changes mid-session
    const cacheKey = `teacher:school-info:${session.user.id}`
    try {
      const cached = await cache.get(cacheKey)
      if (cached) return NextResponse.json(JSON.parse(cached))
    } catch { /* miss */ }

    const teacher = await prisma.teacher.findUnique({
      where: { userId: session.user.id },
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
        firstName: (session.user as any).firstName || session.user.name?.split(' ')[0] || '',
        lastName:  (session.user as any).lastName  || session.user.name?.split(' ').slice(1).join(' ') || '',
        email:     session.user.email
      }
    }

    try { await cache.set(cacheKey, JSON.stringify(responseData), TTL.LONG) } catch { /* non-fatal */ }

    return NextResponse.json(responseData)
  } catch (error) {
    console.error('Error fetching school info:', error)
    return NextResponse.json({ error: 'Failed to fetch school information' }, { status: 500 })
  }
}
