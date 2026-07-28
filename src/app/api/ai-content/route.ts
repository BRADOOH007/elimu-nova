import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { route } from '@/lib/api-middleware'

export const GET = route({ auth: 'TEACHER' }, async (req, { user }) => {
  const teacher = await prisma.teacher.findFirst({
    where: { userId: user.id }
  })

  if (!teacher) {
    return NextResponse.json({ error: 'Teacher not found' }, { status: 404 })
  }

  const { searchParams } = new URL(req.url)
  const type = searchParams.get('type')
  const search = searchParams.get('search')

  const where: any = {
    teacherId: teacher.id
  }

  if (type && type !== 'all') {
    where.type = type.toUpperCase()
  }

  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { topic: { contains: search, mode: 'insensitive' } },
      { subject: { contains: search, mode: 'insensitive' } }
    ]
  }

  const content = await prisma.aIGeneratedContent.findMany({
    where,
    include: {
      _count: {
        select: {
          sharedWithStudents: true,
          sharedWithClasses: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  })

  return NextResponse.json({
    success: true,
    content
  })
})

export const POST = route({ auth: 'TEACHER' }, async (req, { user }) => {
  const teacher = await prisma.teacher.findFirst({
    where: { userId: user.id }
  })

  if (!teacher) {
    return NextResponse.json({ error: 'Teacher not found' }, { status: 404 })
  }

  const { title, content, type, subject, grade, topic, metadata } = await req.json()

  if (!title || !content || !type || !subject || !grade || !topic) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const aiContent = await prisma.aIGeneratedContent.create({
    data: {
      title,
      content,
      type: type.toUpperCase(),
      subject,
      grade,
      topic,
      metadata: metadata || {},
      teacherId: teacher.id
    },
    include: {
      _count: {
        select: {
          sharedWithStudents: true,
          sharedWithClasses: true
        }
      }
    }
  })

  return NextResponse.json({
    success: true,
    content: aiContent
  })
})
