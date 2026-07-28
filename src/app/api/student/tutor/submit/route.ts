/**
 * POST /api/student/tutor/submit
 * 
 * Student submits an answer to a question
 * Tutor grades + gives feedback + updates mastery
 */

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { TutorOrchestrator } from '@/lib/tutor-orchestrator'
import { route } from '@/lib/api-middleware'

export const POST = route({ auth: 'STUDENT' }, async (request, { user }) => {
  const body = await request.json()
  const { sessionId, answer, questionId } = body

  if (!sessionId || !answer) {
    return NextResponse.json({
      error: 'Session ID and answer are required'
    }, { status: 400 })
  }

  // Get student
  const student = await prisma.student.findUnique({
    where: { userId: user.id },
    include: {
      class: true
    }
  })

  if (!student) {
    return NextResponse.json({ error: 'Student not found' }, { status: 404 })
  }

  if (!student.classId) {
    return NextResponse.json({
      error: 'No class assigned'
    }, { status: 400 })
  }

  // CRITICAL: Verify session belongs to this student
  const tutorSession = await prisma.tutorSession.findUnique({
    where: { id: sessionId }
  })

  if (!tutorSession || tutorSession.studentId !== student.id) {
    return NextResponse.json({
      error: 'Invalid session'
    }, { status: 403 })
  }

  // CRITICAL: Verify class isolation
  if (tutorSession.classId !== student.classId) {
    return NextResponse.json({
      error: 'Class mismatch'
    }, { status: 403 })
  }

  // Create orchestrator
  const orchestrator = new TutorOrchestrator(student.id, student.classId)

  // Submit answer and get result
  const result = await orchestrator.submitAnswer(sessionId, answer, questionId)

  // Update student analytics
  await prisma.studentAnalytics.upsert({
    where: { studentId: student.id },
    create: {
      studentId: student.id,
      totalStudyTime: 0,
      completedAssignments: 0,
      pendingAssignments: 0,
      overdueAssignments: 0,
      lastActiveDate: new Date()
    },
    update: {
      lastActiveDate: new Date()
    }
  })

  return NextResponse.json({
    success: true,
    result: {
      isCorrect: result.isCorrect,
      feedback: result.feedback,
      hint: result.hint,
      masteryScore: result.masteryScore,
      xpEarned: result.xpEarned,
      nextMode: result.nextMode
    }
  })
})
