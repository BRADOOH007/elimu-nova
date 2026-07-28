import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { route } from '@/lib/api-middleware'

export const GET = route({}, async (req, { user }) => {
  const { searchParams } = new URL(req.url)
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
})

export const POST = route({ auth: ['SCHOOL_ADMIN', 'SUPER_ADMIN'] }, async (req, { user }) => {
  const body = await req.json()
  const { name, type, grade, subject, description }: { name: string; type?: string; grade: string; subject?: string; description?: string } = body

  if (!name || !grade) {
    return NextResponse.json({ error: 'Name and grade are required' }, { status: 400 })
  }

  let schoolId: string | null = null
  if (user.role === 'SCHOOL_ADMIN') {
    const admin = await prisma.schoolAdmin.findUnique({ where: { userId: user.id } })
    if (admin) schoolId = admin.schoolId
  }

  const curriculum = await prisma.curriculum.create({
    data: { name, type: (type || 'CBC') as 'CBC' | 'CAMBRIDGE' | 'IGCSE' | 'IB' | 'OTHER', subject: subject || name, grade, description, schoolId },
    include: { _count: { select: { strands: true, courses: true } } }
  })

  return NextResponse.json(curriculum, { status: 201 })
})
