import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const search = searchParams.get('search') || ''
    const skip = (page - 1) * limit

    const where = {
      ...(search && { name: { contains: search, mode: 'insensitive' as const } })
    }

    const [curriculums, total] = await Promise.all([
      prisma.curriculum.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: { select: { strands: true, courses: true } }
        }
      }),
      prisma.curriculum.count({ where })
    ])

    return NextResponse.json({
      curriculums,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    })
  } catch (error) {
    console.error('Error fetching curriculums:', error)
    return NextResponse.json({ error: 'Failed to fetch curriculums' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (session.user.role !== 'SCHOOL_ADMIN' && session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { name, type, grade, description } = body

    if (!name || !grade) {
      return NextResponse.json({ error: 'Name and grade are required' }, { status: 400 })
    }

    let schoolId: string | null = null
    if (session.user.role === 'SCHOOL_ADMIN') {
      const admin = await prisma.schoolAdmin.findUnique({ where: { userId: session.user.id } })
      if (admin) schoolId = admin.schoolId
    }

    const curriculum = await prisma.curriculum.create({
      data: { name, type: type || 'CBC', grade, description, schoolId },
      include: { _count: { select: { strands: true, courses: true } } }
    })

    return NextResponse.json(curriculum, { status: 201 })
  } catch (error) {
    console.error('Error creating curriculum:', error)
    return NextResponse.json({ error: 'Failed to create curriculum' }, { status: 500 })
  }
}
