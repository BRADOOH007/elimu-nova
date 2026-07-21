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
import { rateLimitAI, checkRateLimit } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id || session.user.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Rate limit AI tutor: 20 messages per minute per student
    const rl = await checkRateLimit(session.user.id, rateLimitAI)
    if (!rl.allowed) {
      return NextResponse.json(
        { error: `Too many messages. Take a breath and try again in ${rl.resetInSec}s.` },
        { status: 429, headers: { 'Retry-After': String(rl.resetInSec) } }
      )
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

    let currentTask = task
    if (!currentTask) {
      currentTask = {
        subject: 'General',
        topic: 'General Learning',
        mode: 'teach' as const,
        objective: 'Learn something new!',
        estimatedMinutes: 10,
        difficulty: 'easy' as const,
        context: {}
      }
    }

    let response: { message: string; nextAction: any; progress: number; xpEarned: number }

    if (student.classId) {
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
      if (!currentTask || currentTask.topic === 'General Learning') {
        currentTask = await orchestrator.getNextTask()
      }

      // Generate response
      response = await orchestrator.generateMessage(
        message,
        currentTask,
        sessionId
      )

      // Log to AITutorSession for analytics
      const sessionType = currentTask.mode === 'revise' ? 'progress_review' : 'lesson'
      await prisma.aITutorSession.create({
        data: {
          studentId: student.id,
          classId: student.classId,
          sessionType,
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
    } else {
      // No class assigned — use simple AI chat (same endpoint as teacher)
      const { OpenAIService } = await import('@/lib/openai-service')
      const aiResponse = await OpenAIService.generateText([
        { role: 'system', content: `You are a friendly, knowledgeable AI tutor helping a student learn. Be warm, encouraging, and clear. Use simple language, real-world examples, and ask questions to check understanding.` },
        { role: 'user', content: message }
      ], { temperature: 0.7, maxTokens: 800 })

      response = {
        message: aiResponse || 'I can help you learn!',
        nextAction: { type: 'question', data: null },
        progress: 0,
        xpEarned: 0
      }
    }

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
