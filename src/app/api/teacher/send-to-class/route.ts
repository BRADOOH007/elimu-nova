/**
 * POST /api/teacher/send-to-class
 * Universal "send work to students" endpoint.
 * Creates an assignment from any content (lesson plan, exam, scheme, free text)
 * and assigns it to ALL students in a class (or specific student IDs).
 */
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { route } from '@/lib/api-middleware'

export const POST = route({ auth: 'TEACHER' }, async (req, { user }) => {
  try {
    const teacher = await prisma.teacher.findFirst({ where: { userId: user.id } })
    if (!teacher) return NextResponse.json({ error: 'Teacher not found' }, { status: 404 })

    const {
      title,
      description,
      content,
      dueDate,
      subject,
      grade,
      classId,
      studentIds,
      lessonPlanId,
      type = 'ASSIGNMENT',   // 'ASSIGNMENT' | 'EXAM' | 'HOMEWORK' | 'CLASSWORK'
      isTimed = false,
      timeLimit,
    } = await req.json()

    if (!title || !dueDate) {
      return NextResponse.json({ error: 'title and dueDate are required' }, { status: 400 })
    }

    // Resolve which students to assign to
    let targetStudents: { id: string }[] = []

    if (studentIds && studentIds.length > 0) {
      targetStudents = studentIds.map((id: string) => ({ id }))
    } else if (classId) {
      const cls = await prisma.student.findMany({
        where: { classId },
        select: { id: true },
      })
      targetStudents = cls
    } else {
      // All teacher's students
      const all = await prisma.student.findMany({
        where: { teacherId: teacher.id },
        select: { id: true },
      })
      targetStudents = all
    }

    if (targetStudents.length === 0) {
      return NextResponse.json({ error: 'No students found to assign to' }, { status: 400 })
    }

    const assignment = await prisma.assignment.create({
      data: {
        title,
        description: description || title,
        content:     content || '',
        dueDate:     new Date(dueDate),
        teacherId:   teacher.id,
        classId:     classId || null,
        lessonPlanId: lessonPlanId || null,
        subject:     subject || null,
        grade:       grade || null,
        isTimed:     isTimed,
        timeLimit:   timeLimit || null,
        aiGradeable: true,
        students: { connect: targetStudents },
      },
      select: {
        id: true, title: true, dueDate: true,
        _count: { select: { students: true } },
      },
    })

    return NextResponse.json({
      success: true,
      assignment: {
        id:            assignment.id,
        title:         assignment.title,
        dueDate:       assignment.dueDate,
        studentCount:  assignment._count.students,
      },
      message: `"${title}" sent to ${assignment._count.students} student${assignment._count.students !== 1 ? 's' : ''}`,
    }, { status: 201 })
  } catch (error: any) {
    console.error('[SEND_TO_CLASS]', error)
    return NextResponse.json({ error: 'Failed to send work' }, { status: 500 })
  }
})
