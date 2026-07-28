/**
 * GET /api/student/tutor/next
 * 
 * Returns what the tutor should teach NOW
 * Based on: schedule + lesson plan + scheme + mastery
 */

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { TutorOrchestrator } from '@/lib/tutor-orchestrator'
import { route } from '@/lib/api-middleware'

export const GET = route({ auth: 'STUDENT' }, async (request, { user }) => {
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
    message: task.topic === 'General Learning'
      ? 'Ready to learn something new! What would you like to study today?'
      : `Let's ${task.mode === 'teach' ? 'learn' : task.mode} ${task.topic}!`
  })
})
