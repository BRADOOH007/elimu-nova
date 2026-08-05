import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { route } from '@/lib/api-middleware'

export const GET = route({ auth: 'TEACHER' }, async (req, { user }) => {
  const { searchParams } = new URL(req.url)
  const subject = searchParams.get('subject') || ''
  const grade   = searchParams.get('grade')   || ''
  const term    = searchParams.get('term')    || ''
  const type    = searchParams.get('type')    || ''
  const search  = searchParams.get('search')  || ''

  const teacher = await prisma.teacher.findUnique({ where: { userId: user.id } })
  if (!teacher) return NextResponse.json({ error: 'Teacher not found' }, { status: 404 })

  const conditions: any[] = [
    { metadata: { path: ['isExamBank'], equals: true } },
    { teacherId: teacher.id },
  ]
  if (subject) conditions.push({ subject: { contains: subject, mode: 'insensitive' } })
  if (grade)   conditions.push({ grade:   { contains: grade,   mode: 'insensitive' } })
  if (search)  conditions.push({ title:   { contains: search,  mode: 'insensitive' } })
  if (term)    conditions.push({ metadata: { path: ['term'], equals: term } })
  if (type)    conditions.push({ metadata: { path: ['type'], equals: type } })

  const exams = await prisma.assignment.findMany({
    where: { AND: conditions },
    include: { teacher: { include: { user: true } } },
    orderBy: { createdAt: 'desc' },
    take: 100,
  })

  return NextResponse.json({ exams })
})

export const POST = route({ auth: 'TEACHER' }, async (req, { user }) => {
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
      aiGradeable: true,
      timeLimit:   timeLimit ?? null,
      startTime:   startTime ?? null,
      metadata:    bankMetadata,
    } as any,
  })
  return NextResponse.json({ exam }, { status: 201 })
})

export const DELETE = route({ auth: 'TEACHER' }, async (req, { user }) => {
  const { id } = await req.json()
  const teacher = await prisma.teacher.findUnique({ where: { userId: user.id } })
  if (!teacher) return NextResponse.json({ error: 'Teacher not found' }, { status: 404 })

  const exam = await prisma.assignment.findUnique({ where: { id } })
  if (!exam) return NextResponse.json({ error: 'Exam not found' }, { status: 404 })
  if (exam.teacherId !== teacher.id) {
    return NextResponse.json({ error: 'You can only delete your own exams' }, { status: 403 })
  }

  await prisma.assignment.update({
    where: { id },
    data: { metadata: { isExamBank: false } } as any,
  })
  return NextResponse.json({ success: true })
})
