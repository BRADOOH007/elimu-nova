import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { route } from '@/lib/api-middleware'

export const GET = route({}, async (req, { user }) => {
  const { searchParams } = new URL(req.url)
  const subject = searchParams.get('subject') || ''
  const grade   = searchParams.get('grade')   || ''
  const term    = searchParams.get('term')    || ''
  const type    = searchParams.get('type')    || ''
  const search  = searchParams.get('search')  || ''

  const teacher = await prisma.teacher.findUnique({ where: { userId: user.id } })

  const where: any = {
    metadata: { path: ['isExamBank'], equals: true },
  }
  if (subject) where.subject = { contains: subject, mode: 'insensitive' }
  if (grade)   where.grade   = { contains: grade,   mode: 'insensitive' }
  if (search)  where.title   = { contains: search,  mode: 'insensitive' }

  const exams = await prisma.assignment.findMany({
    where,
    include: { teacher: { include: { user: true } } },
    orderBy: { createdAt: 'desc' },
    take: 100,
  })

  return NextResponse.json({ exams })
})

export const POST = route({}, async (req, { user }) => {
  let teacher = await prisma.teacher.findUnique({ where: { userId: user.id } })
  if (!teacher) {
    teacher = await prisma.teacher.create({ data: { userId: user.id } })
  }

  const {
    assignmentId, title, subject, grade, term, type, description,
    questions, content, answerKey, isTimed, timeLimit, startTime, totalMarks, metadata,
  } = await req.json()

  if (assignmentId) {
    const updated = await prisma.assignment.update({
      where: { id: assignmentId },
      data: { metadata: { isExamBank: true, savedAt: new Date().toISOString(), term, type } } as any,
    })
    return NextResponse.json({ exam: updated })
  }

  const bankMetadata = metadata || { isExamBank: true, savedAt: new Date().toISOString(), term, type }
  const exam = await prisma.assignment.create({
    data: {
      title:       title || 'Untitled Exam',
      description: description || '',
      subject:     subject || '',
      grade:       grade   || '',
      teacherId:   teacher.id,
      schoolId:    teacher.schoolId,
      dueDate:     new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      totalMarks:  totalMarks ?? 100,
      questions:   questions || [],
      content:     content ?? '',
      answerKey:   answerKey ?? null,
      isTimed:     isTimed ?? false,
      timeLimit:   timeLimit ?? null,
      startTime:   startTime ?? null,
      metadata:    bankMetadata,
    } as any,
  })
  return NextResponse.json({ exam }, { status: 201 })
})

export const DELETE = route({}, async (req, { user }) => {
  const { id } = await req.json()
  await prisma.assignment.update({
    where: { id },
    data: { metadata: { isExamBank: false } } as any,
  })
  return NextResponse.json({ success: true })
})
