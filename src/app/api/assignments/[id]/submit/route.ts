import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { route } from '@/lib/api-middleware'
import { OpenAIService } from '@/lib/openai-service'
import { NotificationGenerator } from '@/lib/notification-generator'
import { ingestMasteryFromResult } from '@/lib/mastery-engine'

// ── Deterministic answer-key grading ────────────────────────────────────────
// Objective questions (MCQ / true-false / keyed short answers) are scored
// locally against the stored answer key — instant, consistent, no LLM. Only
// questions without a keyed answer (essays, open short answers) go to AI.

interface QScore {
  correct: boolean
  marks: number
  studentAnswer: string
  correctAnswer: string
}

function normalizeAnswer(a: string): string {
  return String(a || '').trim().replace(/[.。,，:：;；]+$/g, '').replace(/\s+/g, ' ').toLowerCase()
}

function parseAnswerKey(raw: string | null | undefined): Record<string, string> {
  if (!raw) return {}
  // JSON object form: {"1":"B","2":"Nairobi"}
  try {
    const parsed = JSON.parse(raw)
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      const key: Record<string, string> = {}
      for (const [k, v] of Object.entries(parsed)) key[String(k)] = String(v).trim()
      return key
    }
  } catch { /* fall through to markdown parsing */ }
  // Markdown-ish form: "1. A" / "1) True" / "Q1: B"
  const key: Record<string, string> = {}
  for (const line of String(raw).split('\n')) {
    const m = line.match(/^\s*(?:Q?\s*)?(\d{1,3})\s*[.):=]\s*([A-Za-z0-9][^\s|][^|]*)/i)
    if (m) key[m[1]] = m[2].trim()
  }
  return key
}

// File-only submissions send a placeholder instead of readable text. The AI
// grades what it sees but the result is inherently low-confidence.
function isPlaceholderContent(content: string): boolean {
  const c = String(content || '').trim()
  if (!c) return true
  return /^\(?see attached file\)?$/i.test(c) || /^\[attached(?: file)?\]$/i.test(c) || c === '—' || c === '-'
}

// Resolve a student/answer-key value for MCQ questions to the actual option text.
// Handles three value formats: numeric option index ("0", "2"), option text
// ("Ten Thousands"), and letter ("B"). Returns "" if it cannot be resolved.
function resolveMcqOption(q: any, value: string): string {
  const v = String(value ?? '').trim()
  const options = Array.isArray(q.options) ? q.options : []
  if (!v || options.length === 0) return v
  if (/^\d+$/.test(v)) {
    const idx = parseInt(v, 10)
    return idx >= 0 && idx < options.length ? String(options[idx]) : ''
  }
  const nv = normalizeAnswer(v)
  const byText = options.find((o: any) => normalizeAnswer(String(o)) === nv)
  if (byText !== undefined) return String(byText)
  if (/^[a-z]$/i.test(v)) {
    const idx = v.toUpperCase().charCodeAt(0) - 65
    if (idx >= 0 && idx < options.length) return String(options[idx])
  }
  const byFirst = options.find((o: any) => normalizeAnswer(String(o)).charAt(0) === nv.charAt(0))
  return byFirst !== undefined ? String(byFirst) : v
}

function gradeObjective(q: any, studentAnswer: string, correctAnswer: string): boolean | null {
  const s = normalizeAnswer(studentAnswer)
  const c = normalizeAnswer(correctAnswer)
  if (!s || !c) return null
  if (q.type === 'multiple_choice') {
    const studentOpt = resolveMcqOption(q, studentAnswer)
    const correctOpt = resolveMcqOption(q, correctAnswer)
    if (!studentOpt || !correctOpt) return null
    return normalizeAnswer(studentOpt) === normalizeAnswer(correctOpt)
  }
  if (q.type === 'true_false') {
    return s.charAt(0) === c.charAt(0)
  }
  if (q.type === 'short_answer') {
    return s === c
  }
  return null
}

async function tryDeterministicGrade(assignment: any, content: string): Promise<{
  grade: number
  feedback: string
  confidence?: number
  questionScores?: any
  needsRevision?: boolean
  revisionNotes?: string
} | null> {
  if (!assignment.answerKey) return null
  let payload: any
  try {
    payload = JSON.parse(content)
  } catch {
    return null
  }
  if (!payload || typeof payload !== 'object' || !Array.isArray(payload.questions)) return null
  const key = parseAnswerKey(assignment.answerKey)
  if (Object.keys(key).length === 0) return null
  const answers = payload.answers && typeof payload.answers === 'object' ? payload.answers : {}

  const questionScores: Record<string, QScore> = {}
  let earned = 0
  let total = 0
  let gradedCount = 0
  const subjective: { q: any; studentAnswer: string }[] = []

  for (const q of payload.questions) {
    const id = String(q.id)
    const marks = Number(q.marks) || 1
    total += marks
    const studentAnswer = String(answers[id] ?? '')
    const correctAnswer = key[id] ?? q.correctAnswer ?? ''
    const correct = gradeObjective(q, studentAnswer, correctAnswer)
    if (correct === null) {
      subjective.push({ q, studentAnswer })
      continue
    }
    gradedCount++
    const awarded = correct ? marks : 0
    earned += awarded
    const readableStudent = q.type === 'multiple_choice' ? (resolveMcqOption(q, studentAnswer) || studentAnswer) : studentAnswer
    const readableCorrect = q.type === 'multiple_choice' ? (resolveMcqOption(q, correctAnswer) || correctAnswer) : correctAnswer
    questionScores[id] = { correct, marks: awarded, studentAnswer: readableStudent, correctAnswer: readableCorrect || '' }
  }

  if (gradedCount === 0) return null

  // Grade remaining subjective questions with AI, merge with objective scores
  if (subjective.length > 0) {
    try {
      const subjPrompt = `Grade each student answer below. Return ONLY a JSON array, one object per question:
[{"id": <question id as a number>, "marks": <0 to max>, "feedback": "one short line"}]

${subjective.map(({ q, studentAnswer }, i) =>
  `${i + 1}. id=${q.id} type=${q.type} (${Number(q.marks) || 1} marks) — "${q.text}"\nStudent answer: "${studentAnswer || '(no answer)'}"`
).join('\n\n')}`
      const raw = await OpenAIService.generateText([
        { role: 'system', content: 'You are an expert examiner marking student exam answers. Mark strictly but fairly. Return only valid JSON.' },
        { role: 'user', content: subjPrompt },
      ], { maxTokens: 1500, temperature: 0.3 })
      const m = raw.match(/\[[\s\S]*\]/)
      if (m) {
        const arr = JSON.parse(m[0])
        if (Array.isArray(arr)) {
          for (const item of arr) {
            const id = String(item.id)
            const q = payload.questions.find((x: any) => String(x.id) === id)
            if (!q) continue
            const maxMarks = Number(q.marks) || 1
            const marks = Math.max(0, Math.min(Number(item.marks) || 0, maxMarks))
            earned += marks
            questionScores[id] = { correct: marks > 0, marks, studentAnswer: answers[id] ?? '', correctAnswer: key[id] ?? '' }
          }
        }
      }
    } catch (e) {
      console.warn('[Grading] Subjective AI grading failed, awarding 0:', e)
    }
  }

  if (total === 0) return null
  const grade = Math.round((earned / total) * 100)
  const opener = grade >= 80 ? 'Outstanding work!'
    : grade >= 60 ? 'Great job!'
    : grade >= 40 ? 'Good effort!'
    : 'Nice try!'
  const closer = grade >= 80 ? " Keep it up — you're on fire!"
    : grade >= 60 ? " You're making excellent progress — keep pushing!"
    : grade >= 40 ? ' Review the questions you missed and you will ace them next time. You have got this!'
    : ' Do not be discouraged — go back through the questions you missed and try again. You are capable of amazing things!'
  return {
    grade,
    feedback: `${opener} You scored ${earned} of ${total} marks (${grade}%).${closer}`,
    confidence: 1,
    questionScores,
    needsRevision: false,
    revisionNotes: '',
  }
}

async function findBestRubricForAssignment(assignment: any) {
  try {
    const rubrics = await prisma.aIGeneratedContent.findMany({
      where: {
        teacherId: assignment.teacherId,
        type: 'RUBRIC'
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    if (rubrics.length === 0) return null

    let assignmentSubject = ''
    let assignmentGrade = ''

    try {
      const assignmentContent = JSON.parse(assignment.content)
      assignmentSubject = assignmentContent.subject || ''
      assignmentGrade = assignmentContent.grade || ''
    } catch (error) {
    }

    const compatibleRubric = rubrics.find(rubric =>
      (assignmentSubject && rubric.subject.toLowerCase().includes(assignmentSubject.toLowerCase())) ||
      (assignmentGrade && rubric.grade.toLowerCase().includes(assignmentGrade.toLowerCase())) ||
      rubric.title.toLowerCase().includes(assignment.title.toLowerCase())
    )

    if (compatibleRubric) {
      try {
        return typeof compatibleRubric.content === 'string'
          ? JSON.parse(compatibleRubric.content)
          : compatibleRubric.content
      } catch (error) {
        console.error('Error parsing rubric content:', error)
        return null
      }
    }

    const latestRubric = rubrics[0]
    if (latestRubric) {
      try {
        return typeof latestRubric.content === 'string'
          ? JSON.parse(latestRubric.content)
          : latestRubric.content
      } catch (error) {
        console.error('Error parsing rubric content:', error)
        return null
      }
    }

    return null
  } catch (error) {
    console.error('Error finding rubric for assignment:', error)
    return null
  }
}

export const POST = route({ auth: 'STUDENT' }, async (req, { user, params }) => {
  const { id } = params
  const body = await req.json()
  const { content, attachments = [], startedAt, timeSpent } = body

  let student = await prisma.student.findUnique({
    where: { userId: user.id }
  })

  if (!student) {
    student = await prisma.student.create({ data: { userId: user.id } })
  }

  const assignment = await prisma.assignment.findUnique({
    where: { id },
    include: {
      students: true
    }
  })

  if (!assignment) {
    return NextResponse.json({ error: 'Assignment not found' }, { status: 404 })
  }

  if (!assignment.students.some(s => s.id === student.id)) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 })
  }

  const existingSubmission = await prisma.submission.findFirst({
    where: {
      assignmentId: id,
      studentId: student.id
    }
  })

  if (existingSubmission) {
    return NextResponse.json({ error: 'Assignment already submitted' }, { status: 400 })
  }

  const submission = await prisma.submission.create({
    data: {
      content,
      attachments,
      assignmentId: id,
      studentId: student.id,
      startedAt: startedAt ? new Date(startedAt) : undefined,
      timeSpent: timeSpent ? parseInt(timeSpent) : undefined
    },
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
      },
      assignment: true
    }
  })

  let updatedSubmission = submission
  // The system always auto-grades every submission. No manual teacher marking.
  try {
    // Prefer deterministic answer-key grading for objective questions
    let grading: {
      grade: number
      feedback: string
      confidence?: number
      questionScores?: any
      needsRevision?: boolean
      revisionNotes?: string
    } | null = await tryDeterministicGrade(submission.assignment, content)

    if (!grading) {
      const rubricData = await findBestRubricForAssignment(submission.assignment)
      // Get student's curriculum for curriculum-aware grading
      const studentPrefs = await prisma.userPreference.findUnique({
        where: { userId: student.userId },
        select: { curriculum: true, country: true }
      })
      grading = await OpenAIService.gradeSubmission({
        assignmentTitle: submission.assignment.title,
        assignmentInstructions: submission.assignment.description || '',
        submissionContent: content,
        rubric: rubricData ? JSON.stringify(rubricData) : undefined,
        answerKey: assignment.answerKey || undefined,
        maxPoints: 100,
        subject: assignment.subject || '',
        grade: assignment.grade || '',
        curriculum: studentPrefs?.curriculum || '',
        country: studentPrefs?.country || ''
      })

      // File-only / placeholder submissions can't be read accurately — flag it.
      if (isPlaceholderContent(content)) {
        grading.confidence = Math.min(grading.confidence ?? 1, 0.35)
        grading.feedback = `${grading.feedback || 'Auto-graded.'} This submission contained an attached file the system could not read, so the grade is low-confidence. Keep up the great effort!`
      }
    }

    updatedSubmission = await prisma.submission.update({
      where: { id: submission.id },
      data: {
        grade: grading.grade,
        feedback: grading.feedback,
        status: 'GRADED',
        gradedAt: new Date(),
        isAiGraded: true,
        aiGradingMetadata: grading,
        aiConfidence: grading.confidence,
        questionScores: grading.questionScores,
        needsRevision: grading.needsRevision,
        revisionNotes: grading.revisionNotes
      },
      include: {
        student: {
          include: { user: { select: { firstName: true, lastName: true } } }
        },
        assignment: true
      }
    })
  } catch (e) {
    // One retry before giving up — grading must not silently fail.
    console.error('AI grading failed, retrying once:', e)
    try {
      const studentPrefs = await prisma.userPreference.findUnique({
        where: { userId: student.userId },
        select: { curriculum: true, country: true }
      })
      const grading = await OpenAIService.gradeSubmission({
        assignmentTitle: submission.assignment.title,
        assignmentInstructions: submission.assignment.description || '',
        submissionContent: content,
        answerKey: assignment.answerKey || undefined,
        maxPoints: 100,
        subject: assignment.subject || '',
        grade: assignment.grade || '',
        curriculum: studentPrefs?.curriculum || '',
        country: studentPrefs?.country || ''
      })
      updatedSubmission = await prisma.submission.update({
        where: { id: submission.id },
        data: {
          grade: grading.grade,
          feedback: grading.feedback,
          status: 'GRADED',
          gradedAt: new Date(),
          isAiGraded: true,
          aiGradingMetadata: grading,
          aiConfidence: grading.confidence,
          questionScores: grading.questionScores,
          needsRevision: grading.needsRevision,
          revisionNotes: grading.revisionNotes
        },
        include: {
          student: {
            include: { user: { select: { firstName: true, lastName: true } } }
          },
          assignment: true
        }
      })
    } catch (e2) {
      console.error('AI grading retry failed:', e2)
    }
  }

  // Feed the graded result into the adaptive mastery engine (continuous learning)
  try {
    const ingestSubject = submission.assignment.subject || 'General'
    let ingestTopic = submission.assignment.title
    if (submission.assignment.lessonPlanId) {
      const lp = await prisma.lessonPlan.findUnique({
        where: { id: submission.assignment.lessonPlanId },
        select: { title: true },
      })
      if (lp?.title) ingestTopic = lp.title
    }
    const scores = (updatedSubmission.questionScores as Record<string, { correct?: boolean }> | null) || {}
    const scoreEntries = Object.values(scores).filter((q): q is { correct: boolean } => !!q && typeof q.correct === 'boolean')
    const totalQuestions = scoreEntries.length || 1
    const correctAnswers = scoreEntries.length > 0
      ? scoreEntries.filter(q => q.correct).length
      : ((updatedSubmission.grade || 0) >= 50 ? 1 : 0)

    await ingestMasteryFromResult({
      studentId: student.id,
      classId: student.classId,
      teacherId: submission.assignment.teacherId,
      subject: ingestSubject,
      topic: ingestTopic,
      unitName: submission.assignment.title,
      grade: updatedSubmission.grade || 0,
      totalQuestions,
      correctAnswers,
    })
  } catch (e) {
    console.warn('[Mastery] ingest failed:', e)
  }

  try {
    await NotificationGenerator.assignmentCompleted(student.id, assignment.title)
  } catch (_) { /* non-blocking */ }

  try {
    await prisma.notification.updateMany({
      where: {
        userId: user.id,
        isRead: false,
        message: { contains: assignment.title }
      },
      data: { isRead: true, updatedAt: new Date() }
    })
  } catch (_) { /* non-blocking */ }

  // Mark any open exam session as ended so lockdown review reflects the finished exam
  try {
    await prisma.examSession.updateMany({
      where: { assignmentId: id, studentId: student.id, endedAt: null },
      data: { endedAt: new Date() }
    })
  } catch (_) { /* non-blocking */ }

  const formattedSubmission = {
    id: updatedSubmission.id,
    content: updatedSubmission.content,
    attachments: updatedSubmission.attachments,
    grade: updatedSubmission.grade,
    feedback: updatedSubmission.feedback,
    submittedAt: updatedSubmission.submittedAt,
    gradedAt: updatedSubmission.gradedAt,
    startedAt: updatedSubmission.startedAt,
    timeSpent: updatedSubmission.timeSpent,
    isAiGraded: updatedSubmission.isAiGraded,
    aiGradingMetadata: updatedSubmission.aiGradingMetadata,
    aiConfidence: updatedSubmission.aiConfidence,
    questionScores: updatedSubmission.questionScores,
    needsRevision: updatedSubmission.needsRevision,
    revisionNotes: updatedSubmission.revisionNotes,
    student: {
      id: updatedSubmission.student.id,
      name: `${updatedSubmission.student.user.firstName} ${updatedSubmission.student.user.lastName}`
    },
    assignment: {
      id: updatedSubmission.assignment.id,
      title: updatedSubmission.assignment.title,
      dueDate: updatedSubmission.assignment.dueDate
    }
  }

  return NextResponse.json({
    submission: formattedSubmission,
    message: 'Assignment submitted successfully'
  })
})
