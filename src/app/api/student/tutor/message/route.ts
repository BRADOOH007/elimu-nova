/**
 * POST /api/student/tutor/message
 * 
 * Main tutoring endpoint - handles student messages
 * Returns tutor response + next action
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
    const { message, sessionId, task } = body

    if (!message || !message.trim()) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
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
        error: 'No class assigned',
        message: 'Please contact your teacher to be assigned to a class'
      }, { status: 400 })
    }

    // CRITICAL: Verify session belongs to this student (if provided)
    if (sessionId) {
      const existingSession = await prisma.tutorSession.findUnique({
        where: { id: sessionId }
      })

      if (!existingSession || existingSession.studentId !== student.id) {
        return NextResponse.json({
          error: 'Invalid session'
        }, { status: 403 })
      }

      // CRITICAL: Verify class isolation
      if (existingSession.classId !== student.classId) {
        return NextResponse.json({
          error: 'Class mismatch'
        }, { status: 403 })
      }
    }

    // Create orchestrator
    const orchestrator = new TutorOrchestrator(student.id, student.classId)

    // Get current task if not provided
    let currentTask = task
    if (!currentTask) {
      currentTask = await orchestrator.getNextTask()
    }

    // Generate response
    const response = await orchestrator.generateMessage(
      message,
      currentTask,
      sessionId
    )

    // Log to AITutorSession for analytics
    await prisma.aITutorSession.create({
      data: {
        studentId: student.id,
        classId: student.classId,
        sessionType: currentTask.mode,
        subject: currentTask.subject,
        topic: currentTask.topic,
        question: message,
        response: response.message,
        mode: currentTask.mode,
        context: JSON.stringify({
          task: currentTask,
          progress: response.progress
        })
      }
    })

    return NextResponse.json({
      success: true,
      response: response.message,
      nextAction: response.nextAction,
      progress: response.progress,
      xpEarned: response.xpEarned,
      task: currentTask
    })
  } catch (error) {
    console.error('Error processing tutor message:', error)
    return NextResponse.json({
      error: 'Failed to process message',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
