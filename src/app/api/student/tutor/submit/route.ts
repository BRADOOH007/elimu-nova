/**
 * POST /api/student/tutor/submit
 * 
 * Student submits an answer to a question
 * Tutor grades + gives feedback + updates mastery
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { TutorOrchestrator } from '@/lib/tutor-orchestrator'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id || session.user.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { sessionId, answer, questionId } = body

    if (!sessionId || !answer) {
      return NextResponse.json({
        error: 'Session ID and answer are required'
      }, { status: 400 })
    }

    // Get student
    const student = await prisma.student.findUnique({
      where: { userId: session.user.id },
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
  } catch (error) {
    console.error('Error submitting answer:', error)
    return NextResponse.json({
      error: 'Failed to submit answer',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
