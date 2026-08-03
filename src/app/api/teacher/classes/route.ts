import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { route } from '@/lib/api-middleware'
import { CreateClassSchema } from '@/lib/validators'
import { parsePagination, paginate } from '@/lib/pagination'

export const GET = route({ auth: 'TEACHER' }, async (req, { user }) => {
  const teacher = await prisma.teacher.findUnique({ where: { userId: user.id } })
  if (!teacher) return NextResponse.json({ error: 'Teacher not found' }, { status: 404 })

  const { searchParams } = new URL(req.url)
  const pg = parsePagination(searchParams)

  const [classes, total] = await Promise.all([
    prisma.class.findMany({
      where: { teacherId: teacher.id },
      include: { _count: { select: { students: true } } },
      orderBy: { createdAt: 'desc' },
      skip: (pg.page - 1) * pg.pageSize,
      take: pg.pageSize,
    }),
    prisma.class.count({ where: { teacherId: teacher.id } }),
  ])

  const result = paginate(
    classes.map(c => ({ id: c.id, name: c.name, subject: c.subject, grade: c.grade, description: c.description, isActive: c.isActive, createdAt: c.createdAt, studentCount: c._count.students })),
    total,
    pg,
  )

  // Legacy alias so older consumers reading `.classes` keep working
  return NextResponse.json({ ...result, classes: result.data })
})

export const POST = route({ auth: 'TEACHER', schema: CreateClassSchema }, async (req, { user, body }) => {
  const teacher = await prisma.teacher.findUnique({ where: { userId: user.id } })
  if (!teacher) return NextResponse.json({ error: 'Teacher not found' }, { status: 404 })

  const { name, subject: rawSubject, grade, description } = body!
  const subject = rawSubject || ''

  const existing = await prisma.class.findFirst({
    where: { teacherId: teacher.id, name: { equals: name.trim(), mode: 'insensitive' } }
  })
  if (existing) {
    return NextResponse.json({ error: `A class named "${existing.name}" already exists.` }, { status: 409 })
  }

  const newClass = await prisma.class.create({
    data: { name: name.trim(), description: description || '', subject, grade, schoolId: teacher.schoolId, teacherId: teacher.id, isActive: true },
    include: { _count: { select: { students: true } } },
  })

  return NextResponse.json({
    success: true,
    class: { id: newClass.id, name: newClass.name, subject: newClass.subject, grade: newClass.grade, description: newClass.description, isActive: newClass.isActive, createdAt: newClass.createdAt, studentCount: newClass._count.students },
  })
})
