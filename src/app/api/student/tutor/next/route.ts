/**
 * GET /api/student/tutor/next
 * 
 * Returns what the tutor should teach NOW
 * Based on: schedule + lesson plan + scheme + mastery
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { TutorOrchestrator } from '@/lib/tutor-orchestrator'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id || session.user.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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

    let task
    if (student.classId) {
      const orchestrator = new TutorOrchestrator(student.id, student.classId)
      task = await orchestrator.getNextTask()
    } else {
      task = {
        subject: 'General',
        topic: 'General Learning',
        mode: 'teach' as const,
        objective: 'Learn something new! Ask me anything you want to study.',
        estimatedMinutes: 10,
        difficulty: 'easy' as const,
        context: {}
      }
    }

    return NextResponse.json({
      success: true,
      task,
      message: task.mode === 'teach' && task.topic === 'General Learning'
        ? 'Ready to learn something new! What would you like to study today?'
        : `Ready to ${task.mode} ${task.topic}!`
    })
  } catch (error) {
    console.error('Error getting next tutor task:', error)
    return NextResponse.json({
      error: 'Failed to get next task',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
