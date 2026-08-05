import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { route } from '@/lib/api-middleware'

export const GET = route({ auth: 'TEACHER' }, async (req, { params }) => {
    const { id } = params

    const lessonPlan = await prisma.lessonPlan.findUnique({
      where: { id },
      include: {
        teacher: { include: { user: { select: { firstName: true, lastName: true } } } }
      }
    })
    if (!lessonPlan) return NextResponse.json({ error: 'Lesson plan not found' }, { status: 404 })

    return NextResponse.json(lessonPlan)
})

export const PUT = route({ auth: 'TEACHER' }, async (req, { user, params }) => {
    const { id } = params

    const teacher = await prisma.teacher.findUnique({ where: { userId: user.id } })
    if (!teacher) return NextResponse.json({ error: 'Teacher not found' }, { status: 404 })

    const existing = await prisma.lessonPlan.findFirst({ where: { id, teacherId: teacher.id } })
    if (!existing) return NextResponse.json({ error: 'Lesson plan not found' }, { status: 404 })

    const body = await req.json()
    const { title, subject, grade, content, schemeOfWorkId } = body

    const contentString = typeof content === 'object' && content !== null
      ? JSON.stringify(content)
      : content

    const updated = await prisma.lessonPlan.update({
      where: { id },
      data: { title, subject, grade, content: contentString, schemeOfWorkId }
    })

    return NextResponse.json(updated)
})

export const DELETE = route({ auth: 'TEACHER' }, async (req, { user, params }) => {
    const { id } = params

    const teacher = await prisma.teacher.findUnique({ where: { userId: user.id } })
    if (!teacher) return NextResponse.json({ error: 'Teacher not found' }, { status: 404 })

    const existing = await prisma.lessonPlan.findFirst({ where: { id, teacherId: teacher.id } })
    if (!existing) return NextResponse.json({ error: 'Lesson plan not found' }, { status: 404 })

    await prisma.lessonPlan.delete({ where: { id } })
    return NextResponse.json({ message: 'Lesson plan deleted successfully' })
})
