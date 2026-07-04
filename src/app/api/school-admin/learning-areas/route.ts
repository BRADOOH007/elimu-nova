import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { COMPREHENSIVE_SUBJECTS } from '@/lib/subjects'

async function getSchoolAdmin(userId: string) {
  return prisma.schoolAdmin.findUnique({
    where: { userId },
    include: { school: true }
  })
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || session.user.role !== 'SCHOOL_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const admin = await getSchoolAdmin(session.user.id)
    if (!admin?.schoolId) {
      return NextResponse.json({ error: 'School admin profile not found' }, { status: 404 })
    }

    const [learningAreas, teacherCount, studentCount] = await Promise.all([
      prisma.learningArea.findMany({
        where: { schoolId: admin.schoolId },
        orderBy: { name: 'asc' }
      }),
      prisma.teacher.count({ where: { schoolId: admin.schoolId } }),
      prisma.student.count({ where: { schoolId: admin.schoolId } })
    ])

    return NextResponse.json({
      learningAreas,
      catalogSubjects: COMPREHENSIVE_SUBJECTS,
      stats: {
        active: learningAreas.filter(area => area.isActive).length,
        inactive: learningAreas.filter(area => !area.isActive).length,
        teacherCount,
        studentCount
      }
    })
  } catch (error) {
    console.error('Error fetching learning areas:', error)
    return NextResponse.json({ error: 'Failed to fetch learning areas' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || session.user.role !== 'SCHOOL_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const admin = await getSchoolAdmin(session.user.id)
    if (!admin?.schoolId) {
      return NextResponse.json({ error: 'School admin profile not found' }, { status: 404 })
    }

    const body = await request.json()
    const name = String(body.name || '').trim()
    const description = String(body.description || '').trim()

    if (!name) {
      return NextResponse.json({ error: 'Learning area name is required' }, { status: 400 })
    }

    const learningArea = await prisma.learningArea.create({
      data: {
        name,
        description: description || null,
        schoolId: admin.schoolId,
        isActive: body.isActive ?? true
      }
    })

    return NextResponse.json({ learningArea, message: 'Learning area created' }, { status: 201 })
  } catch (error) {
    console.error('Error creating learning area:', error)
    return NextResponse.json({ error: 'Failed to create learning area' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || session.user.role !== 'SCHOOL_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const admin = await getSchoolAdmin(session.user.id)
    if (!admin?.schoolId) {
      return NextResponse.json({ error: 'School admin profile not found' }, { status: 404 })
    }

    const body = await request.json()
    const id = String(body.id || '')
    if (!id) {
      return NextResponse.json({ error: 'Learning area id is required' }, { status: 400 })
    }

    const existing = await prisma.learningArea.findFirst({
      where: { id, schoolId: admin.schoolId }
    })

    if (!existing) {
      return NextResponse.json({ error: 'Learning area not found' }, { status: 404 })
    }

    const learningArea = await prisma.learningArea.update({
      where: { id },
      data: {
        ...(body.name !== undefined && { name: String(body.name).trim() }),
        ...(body.description !== undefined && { description: String(body.description || '').trim() || null }),
        ...(body.isActive !== undefined && { isActive: Boolean(body.isActive) })
      }
    })

    return NextResponse.json({ learningArea, message: 'Learning area updated' })
  } catch (error) {
    console.error('Error updating learning area:', error)
    return NextResponse.json({ error: 'Failed to update learning area' }, { status: 500 })
  }
}
