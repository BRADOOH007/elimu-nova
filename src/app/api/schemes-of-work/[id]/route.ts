import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { route } from '@/lib/api-middleware'

export const GET = route({ auth: 'TEACHER' }, async (req, { user, params }) => {
  const scheme = await prisma.schemeOfWork.findUnique({
    where: { id: params.id },
    include: {
      teacher: { include: { user: { select: { firstName: true, lastName: true } } } },
      lessonPlans: { select: { id: true, title: true } }
    }
  })
  if (!scheme) return NextResponse.json({ error: 'Scheme of work not found' }, { status: 404 })

  const parsed = {
    ...scheme,
    content: scheme.content ? JSON.parse(scheme.content) : null,
  }

  return NextResponse.json(parsed)
})

export const PUT = route({ auth: 'TEACHER' }, async (req, { user, params }) => {
  const teacher = await prisma.teacher.findUnique({ where: { userId: user.id } })
  if (!teacher) return NextResponse.json({ error: 'Teacher not found' }, { status: 404 })

  const existing = await prisma.schemeOfWork.findFirst({ where: { id: params.id, teacherId: teacher.id } })
  if (!existing) return NextResponse.json({ error: 'Scheme of work not found' }, { status: 404 })

  const body = await req.json()
  const { title, subject, grade, term, content, duration, objectives } = body

  const updated = await prisma.schemeOfWork.update({
    where: { id: params.id },
    data: { title, subject, grade, term, content, duration: duration ? parseInt(duration) : undefined, objectives }
  })

  return NextResponse.json(updated)
})

export const DELETE = route({ auth: 'TEACHER' }, async (req, { user, params }) => {
  const teacher = await prisma.teacher.findUnique({ where: { userId: user.id } })
  if (!teacher) return NextResponse.json({ error: 'Teacher not found' }, { status: 404 })

  const existing = await prisma.schemeOfWork.findFirst({ where: { id: params.id, teacherId: teacher.id } })
  if (!existing) return NextResponse.json({ error: 'Scheme of work not found' }, { status: 404 })

  await prisma.schemeOfWork.delete({ where: { id: params.id } })
  return NextResponse.json({ message: 'Scheme of work deleted successfully' })
})
