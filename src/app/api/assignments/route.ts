import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { route } from '@/lib/api-middleware'

// Strip grader-only keys (correctAnswer/answer) from question objects embedded
// in content before it reaches students (protects legacy exams).
function sanitizeContentForStudent(content: string | null): string | null {
  if (!content) return content
  try {
    const parsed = JSON.parse(content)
    if (parsed && typeof parsed === 'object' && Array.isArray(parsed.questions)) {
      parsed.questions = parsed.questions.map((q: any) => {
        const safe: Record<string, unknown> = {}
        for (const [k, v] of Object.entries(q)) {
          if (k === 'correctAnswer' || k === 'answer') continue
          safe[k] = v
        }
        return safe
      })
      return JSON.stringify(parsed)
    }
  } catch { /* not JSON — leave as-is */ }
  return content
}

export const GET = route({ auth: ['TEACHER', 'STUDENT'] }, async (req, { user }) => {
  const { searchParams } = new URL(req.url)
  const limit = parseInt(searchParams.get('limit') || '10')
  const status = searchParams.get('status')
  const search = searchParams.get('search')
  const type = searchParams.get('type')

  let where: any = {}

  if (user.role === 'TEACHER') {
    const teacher = await prisma.teacher.findUnique({
      where: { userId: user.id }
    })

    if (!teacher) {
      return NextResponse.json({ error: 'Teacher profile not found' }, { status: 404 })
    }

    where.teacherId = teacher.id
  } else if (user.role === 'STUDENT') {
    const student = await prisma.student.findUnique({
      where: { userId: user.id }
    })

    if (!student) {
      return NextResponse.json({ error: 'Student profile not found' }, { status: 404 })
    }

    where.students = {
      some: {
        id: student.id
      }
    }
  }

  if (status && status !== 'all') {
    where.status = status.toUpperCase()
  }

  // type=EXAM → timed exams only; ASSIGNMENT/QUIZ → everything else
  if (type) {
    const normalized = type.toUpperCase()
    if (normalized === 'EXAM') where.isTimed = true
    else if (normalized === 'ASSIGNMENT' || normalized === 'QUIZ') where.isTimed = false
  }

  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } }
    ]
  }

  const assignments = await prisma.assignment.findMany({
    where,
    include: {
      teacher: {
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true
            }
          }
        }
      },
      lessonPlan: {
        select: {
          id: true,
          title: true,
          subject: true,
          grade: true
        }
      },
      class: true,
      students: {
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true
            }
          }
        }
      },
      submissions: {
        include: {
          student: {
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true
                }
              }
            }
          }
        }
      },
      _count: {
        select: {
          submissions: true,
          students: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    },
    take: limit
  })

  const formattedAssignments = assignments.map(assignment => {
    const isStudent = user.role === 'STUDENT'
    // Never expose answer keys / grading secrets to students
    const safeAnswerKey = isStudent ? undefined : assignment.answerKey

    return {
      id: assignment.id,
      title: assignment.title,
      description: assignment.description,
      content: isStudent ? sanitizeContentForStudent(assignment.content) : assignment.content,
      dueDate: assignment.dueDate,
      status: assignment.status,
      createdAt: assignment.createdAt,
      updatedAt: assignment.updatedAt,
      isTimed: assignment.isTimed,
      timeLimit: assignment.timeLimit,
      startTime: assignment.startTime,
      rubricId: assignment.rubricId,
      aiGradeable: assignment.aiGradeable,
      answerKey: safeAnswerKey,
      classId: assignment.classId,
      subject: assignment.subject,
      grade: assignment.grade,
      videoUrl: assignment.videoUrl,
      videoProvider: assignment.videoProvider,
      videoDuration: assignment.videoDuration,
      teacher: {
        id: assignment.teacher.id,
        name: `${assignment.teacher.user.firstName} ${assignment.teacher.user.lastName}`,
        email: assignment.teacher.user.email
      },
      lessonPlan: assignment.lessonPlan ? {
        id: assignment.lessonPlan.id,
        title: assignment.lessonPlan.title,
        subject: assignment.lessonPlan.subject,
        grade: assignment.lessonPlan.grade
      } : null,
      class: assignment.class ? {
        id: assignment.class.id,
        name: assignment.class.name
      } : null,
      students: assignment.students.map(student => ({
        id: student.id,
        name: `${student.user.firstName} ${student.user.lastName}`
      })),
      // Submissions: students should only see their OWN submission, and never
      // grading internals (questionScores, aiGradingMetadata) until graded.
      submissions: assignment.submissions
        .filter(sub => !isStudent || sub.student.userId === user.id)
        .map(submission => ({
          id: submission.id,
          content: submission.content,
          attachments: submission.attachments,
          grade: submission.grade,
          feedback: submission.feedback,
          submittedAt: submission.submittedAt,
          gradedAt: submission.gradedAt,
          startedAt: submission.startedAt,
          timeSpent: submission.timeSpent,
          isAiGraded: submission.isAiGraded,
          aiGradingMetadata: isStudent ? undefined : submission.aiGradingMetadata,
          aiConfidence: submission.aiConfidence,
          questionScores: isStudent ? undefined : submission.questionScores,
          needsRevision: submission.needsRevision,
          revisionNotes: submission.revisionNotes,
          student: {
            id: submission.student.id,
            name: `${submission.student.user.firstName} ${submission.student.user.lastName}`
          }
        })),
      stats: {
        totalStudents: assignment._count.students,
        totalSubmissions: assignment._count.submissions,
        gradedSubmissions: assignment.submissions.filter(s => s.grade !== null).length,
        pendingSubmissions: assignment.submissions.filter(s => s.grade === null).length
      }
    }
  })

  return NextResponse.json({
    assignments: formattedAssignments,
    total: formattedAssignments.length
  })
})

export const POST = route({ auth: 'TEACHER' }, async (req, { user }) => {
  const body = await req.json()
  const {
    title,
    description,
    content,
    dueDate,
    lessonPlanId,
    studentIds,
    isTimed,
    timeLimit,
    startTime,
    rubricId,
    aiGradeable,
    answerKey,
    classId,
    subject,
    grade,
    videoUrl,
    videoProvider,
    videoDuration,
  } = body

  const teacher = await prisma.teacher.findUnique({
    where: { userId: user.id }
  })

  if (!teacher) {
    return NextResponse.json({ error: 'Teacher profile not found' }, { status: 404 })
  }

  let studentConnect: { id: string }[] | undefined = undefined

  if (studentIds && studentIds.length > 0) {
    studentConnect = studentIds.map((id: string) => ({ id }))
  } else if (classId) {
    const classStudents = await prisma.student.findMany({
      where: { classId },
      select: { id: true },
    })
    studentConnect = classStudents.map((s: any) => ({ id: s.id }))
  } else {
    const teacherStudents = await prisma.student.findMany({
      where: { teacherId: teacher.id },
      select: { id: true },
    })
    studentConnect = teacherStudents.map((s: any) => ({ id: s.id }))
  }

  const assignment = await prisma.assignment.create({
    data: {
      title,
      description,
      content,
      dueDate: new Date(dueDate),
      teacherId: teacher.id,
      lessonPlanId: lessonPlanId || null,
      isTimed: isTimed || false,
      timeLimit: timeLimit || null,
      startTime: startTime ? new Date(startTime) : null,
      rubricId: rubricId || null,
      aiGradeable: aiGradeable || true,
      answerKey: answerKey || null,
      classId: classId || null,
      subject: subject || null,
      grade: grade || null,
      videoUrl: videoUrl || null,
      videoProvider: videoProvider || null,
      videoDuration: videoDuration || null,
      students: studentConnect ? { connect: studentConnect } : undefined,
    },
    include: {
      teacher: {
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true
            }
          }
        }
      },
      lessonPlan: {
        select: {
          id: true,
          title: true,
          subject: true,
          grade: true
        }
      },
      students: {
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true
            }
          }
        }
      },
      class: true,
      _count: {
        select: {
          submissions: true,
          students: true
        }
      }
    }
  })

  const formattedAssignment = {
    id: assignment.id,
    title: assignment.title,
    description: assignment.description,
    content: assignment.content,
    dueDate: assignment.dueDate,
    status: assignment.status,
    createdAt: assignment.createdAt,
    updatedAt: assignment.updatedAt,
    isTimed: assignment.isTimed,
    timeLimit: assignment.timeLimit,
    startTime: assignment.startTime,
    rubricId: assignment.rubricId,
    aiGradeable: assignment.aiGradeable,
    answerKey: assignment.answerKey,
    classId: assignment.classId,
    subject: assignment.subject,
    grade: assignment.grade,
    videoUrl: assignment.videoUrl,
    videoProvider: assignment.videoProvider,
    videoDuration: assignment.videoDuration,
    teacher: {
      id: assignment.teacher.id,
      name: `${assignment.teacher.user.firstName} ${assignment.teacher.user.lastName}`,
      email: assignment.teacher.user.email
    },
    lessonPlan: assignment.lessonPlan ? {
      id: assignment.lessonPlan.id,
      title: assignment.lessonPlan.title,
      subject: assignment.lessonPlan.subject,
      grade: assignment.lessonPlan.grade
    } : null,
    class: assignment.class ? {
      id: assignment.class.id,
      name: assignment.class.name
    } : null,
    students: assignment.students.map(student => ({
      id: student.id,
      name: `${student.user.firstName} ${student.user.lastName}`
    })),
    stats: {
      totalStudents: assignment._count.students,
      totalSubmissions: assignment._count.submissions,
      gradedSubmissions: 0,
      pendingSubmissions: 0
    }
  }

  return NextResponse.json({
    assignment: formattedAssignment,
    message: 'Assignment created successfully'
  })
})
