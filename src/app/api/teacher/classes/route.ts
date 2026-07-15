import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id || session.user.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const teacher = await prisma.teacher.findUnique({
      where: { userId: session.user.id }
    })

    if (!teacher) {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 })
    }

    const classes = await prisma.class.findMany({
      where: { teacherId: teacher.id },
      include: {
        _count: { select: { students: true } }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({
      classes: classes.map(c => ({
        id:           c.id,
        name:         c.name,
        subject:      c.subject,
        grade:        c.grade,
        description:  c.description,
        isActive:     c.isActive,
        createdAt:    c.createdAt,
        studentCount: c._count.students,
      }))
    })
  } catch (error) {
    console.error('Error fetching classes:', error)
    return NextResponse.json(
      { error: 'Failed to fetch classes' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id || session.user.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const teacher = await prisma.teacher.findUnique({
      where: { userId: session.user.id }
    })

    if (!teacher) {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 })
    }

    const body = await request.json()
    const { name, description, subject, grade } = body

    if (!name || !subject || !grade) {
      return NextResponse.json(
        { error: 'Missing required fields: name, subject, grade' },
        { status: 400 }
      )
    }

    // Prevent duplicate class names for the same teacher
    const existing = await prisma.class.findFirst({
      where: {
        teacherId: teacher.id,
        name: { equals: name.trim(), mode: 'insensitive' },
      }
    })
    if (existing) {
      return NextResponse.json(
        { error: `A class named "${existing.name}" already exists. Please use a different name.` },
        { status: 409 }
      )
    }

    const newClass = await prisma.class.create({
      data: {
        name:        name.trim(),
        description: description || '',
        subject,
        grade,
        schoolId:  teacher.schoolId,
        teacherId: teacher.id,
        isActive:  true
      },
      include: { _count: { select: { students: true } } }
    })

    return NextResponse.json({
      success: true,
      class: {
        id:           newClass.id,
        name:         newClass.name,
        subject:      newClass.subject,
        grade:        newClass.grade,
        description:  newClass.description,
        isActive:     newClass.isActive,
        createdAt:    newClass.createdAt,
        studentCount: newClass._count.students,
      }
    })
  } catch (error) {
    console.error('Error creating class:', error)
    return NextResponse.json(
      { error: 'Failed to create class' },
      { status: 500 }
    )
  }
}
