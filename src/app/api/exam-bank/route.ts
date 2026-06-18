import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Exam bank uses the Assignment model with a special metadata flag
// We store exam bank entries as assignments with metadata.isExamBank = true

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const subject = searchParams.get('subject') || ''
    const grade   = searchParams.get('grade')   || ''
    const term    = searchParams.get('term')    || ''
    const type    = searchParams.get('type')    || ''
    const search  = searchParams.get('search')  || ''

    const teacher = await (prisma as any).teacher.findUnique({ where: { userId: session.user.id } })

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
  } catch (error) {
    console.error('[GET_EXAM_BANK]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST — save an assignment to the exam bank
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const teacher = await (prisma as any).teacher.findUnique({ where: { userId: session.user.id } })
    if (!teacher) return NextResponse.json({ error: 'Teacher not found' }, { status: 404 })

    const { assignmentId, title, subject, grade, term, type, description, questions } = await request.json()

    if (assignmentId) {
      // Save existing assignment to bank
      const updated = await prisma.assignment.update({
        where: { id: assignmentId },
        data: { metadata: { isExamBank: true, savedAt: new Date().toISOString(), term, type } },
      })
      return NextResponse.json({ exam: updated })
    }

    // Create new exam bank entry directly
    const exam = await prisma.assignment.create({
      data: {
        title:       title || 'Untitled Exam',
        description: description || '',
        subject:     subject || '',
        grade:       grade   || '',
        teacherId:   teacher.id,
        schoolId:    teacher.schoolId,
        dueDate:     new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
        totalMarks:  100,
        questions:   questions || [],
        metadata: { isExamBank: true, savedAt: new Date().toISOString(), term, type },
      },
    })
    return NextResponse.json({ exam }, { status: 201 })
  } catch (error) {
    console.error('[POST_EXAM_BANK]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await request.json()
    // Remove from bank (clear metadata flag, don't delete the record)
    await prisma.assignment.update({
      where: { id },
      data: { metadata: { isExamBank: false } },
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
