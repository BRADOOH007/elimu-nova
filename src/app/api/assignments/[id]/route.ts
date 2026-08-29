import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { route } from '@/lib/api-middleware'

// Belt-and-suspenders: strip any grader-only keys (correctAnswer/answer and
// common variants) from question objects embedded in content, and drop any
// top-level answer-key container, so legacy exams created before content
// sanitization can never expose answers to students before submission.
const GRADER_KEYS = new Set(['correctAnswer', 'answer', 'correct', 'correct_option', 'correctOption', 'correctIndex', 'answerKey', 'solution', 'marked_answer', 'keyAns'])

function stripAnswerFields(q: any): any {
  const safe: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(q)) {
    if (GRADER_KEYS.has(k)) continue
    safe[k] = v
  }
  return safe
}

function sanitizeContentForStudent(content: string | null): string | null {
  if (!content) return content
  try {
    const parsed = JSON.parse(content)
    if (parsed && typeof parsed === 'object') {
      // Drop a top-level embedded answer key / answers container outright.
      for (const k of ['answerKey', 'markingScheme', 'answers']) {
        if (k in parsed && k !== 'questions') delete parsed[k]
      }
      if (Array.isArray(parsed.questions)) {
        parsed.questions = parsed.questions.map(stripAnswerFields)
      } else if (Array.isArray(parsed)) {
        return content // not a questions payload — leave as-is
      }
      return JSON.stringify(parsed)
    }
  } catch { /* not JSON — leave as-is */ }
  return content
}

export const GET = route({ auth: ['TEACHER', 'STUDENT'] }, async (req, { user, params }) => {
  const { id } = params

  const assignment = await prisma.assignment.findUnique({
    where: { id },
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
    }
  })

  if (!assignment) {
    return NextResponse.json({ error: 'Assignment not found' }, { status: 404 })
  }

  if (user.role === 'STUDENT') {
    const student = await prisma.student.findUnique({
      where: { userId: user.id }
    })

    if (!student || !assignment.students.some(s => s.id === student.id)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }
  } else if (user.role === 'TEACHER') {
    const teacher = await prisma.teacher.findUnique({
      where: { userId: user.id }
    })

    if (!teacher || assignment.teacherId !== teacher.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }
  }

  let mySubmission = null
  if (user.role === 'STUDENT') {
    const student = await prisma.student.findUnique({ where: { userId: user.id } })
    if (student) {
      mySubmission = assignment.submissions.find(s => s.studentId === student.id) || null
    }
  }

  const isStudent = user.role === 'STUDENT'

  const formattedAssignment = {
    id: assignment.id,
    title: assignment.title,
    description: assignment.description,
    content: isStudent ? sanitizeContentForStudent(assignment.content) : assignment.content,
    dueDate: assignment.dueDate,
    status: assignment.status,
    isTimed: assignment.isTimed,
    timeLimit: assignment.timeLimit,
    // Never leak the answer key to students
    answerKey: isStudent ? undefined : assignment.answerKey,
    createdAt: assignment.createdAt,
    updatedAt: assignment.updatedAt,
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
    students: isStudent ? undefined : assignment.students.map(student => ({
      id: student.id,
      name: `${student.user.firstName} ${student.user.lastName}`
    })),
    // Students only see their own submission and no grading internals
    submissions: isStudent
      ? []
      : assignment.submissions.map(submission => ({
          id: submission.id,
          content: submission.content,
          attachments: submission.attachments,
          grade: submission.grade,
          feedback: submission.feedback,
          submittedAt: submission.submittedAt,
          gradedAt: submission.gradedAt,
          isAiGraded: submission.isAiGraded,
          questionScores: submission.questionScores,
          needsRevision: submission.needsRevision,
          revisionNotes: submission.revisionNotes,
          student: {
            id: submission.student.id,
            name: `${submission.student.user.firstName} ${submission.student.user.lastName}`
          }
        })),
    mySubmission: mySubmission ? {
      id: mySubmission.id,
      grade: mySubmission.grade,
      feedback: mySubmission.feedback,
      submittedAt: mySubmission.submittedAt,
      gradedAt: mySubmission.gradedAt,
      isAiGraded: mySubmission.isAiGraded,
      questionScores: mySubmission.questionScores,
      needsRevision: mySubmission.needsRevision,
      revisionNotes: mySubmission.revisionNotes,
    } : null,
    stats: {
      totalStudents: assignment._count.students,
      totalSubmissions: assignment._count.submissions,
      gradedSubmissions: assignment.submissions.filter(s => s.grade !== null).length,
      pendingSubmissions: assignment.submissions.filter(s => s.grade === null).length
    }
  }

  return NextResponse.json({ assignment: formattedAssignment })
})

export const PUT = route({ auth: 'TEACHER' }, async (req, { user, params }) => {
  const { id } = params
  const body = await req.json()
  const { title, description, content, dueDate, status, studentIds, videoUrl, videoProvider, videoDuration } = body

  const teacher = await prisma.teacher.findUnique({
    where: { userId: user.id }
  })

  if (!teacher) {
    return NextResponse.json({ error: 'Teacher profile not found' }, { status: 404 })
  }

  const existingAssignment = await prisma.assignment.findUnique({
    where: { id }
  })

  if (!existingAssignment || existingAssignment.teacherId !== teacher.id) {
    return NextResponse.json({ error: 'Assignment not found or access denied' }, { status: 404 })
  }

  const assignment = await prisma.assignment.update({
    where: { id },
    data: {
      title,
      description,
      content,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      status: status ? status.toUpperCase() : undefined,
      students: studentIds ? {
        set: studentIds.map((id: string) => ({ id }))
      } : undefined,
      videoUrl: videoUrl !== undefined ? videoUrl : undefined,
      videoProvider: videoProvider !== undefined ? videoProvider : undefined,
      videoDuration: videoDuration !== undefined ? videoDuration : undefined,
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
    message: 'Assignment updated successfully'
  })
})

export const DELETE = route({ auth: 'TEACHER' }, async (req, { user, params }) => {
  const { id } = params

  const teacher = await prisma.teacher.findUnique({
    where: { userId: user.id }
  })

  if (!teacher) {
    return NextResponse.json({ error: 'Teacher profile not found' }, { status: 404 })
  }

  const existingAssignment = await prisma.assignment.findUnique({
    where: { id }
  })

  if (!existingAssignment || existingAssignment.teacherId !== teacher.id) {
    return NextResponse.json({ error: 'Assignment not found or access denied' }, { status: 404 })
  }

  await prisma.assignment.delete({
    where: { id }
  })

  return NextResponse.json({
    message: 'Assignment deleted successfully'
  })
})
