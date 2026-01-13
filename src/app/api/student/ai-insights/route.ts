import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { OpenAIService } from '@/lib/openai-service'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get student information
    const student = await prisma.student.findFirst({
      where: { userId: session.user.id },
      include: {
        analytics: true,
        studySessions: {
          orderBy: { createdAt: 'desc' },
          take: 10
        },
        aiTutorSessions: {
          orderBy: { createdAt: 'desc' },
          take: 5
        }
      }
    })

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }

    // Prepare student data for AI analysis
    const studentData = {
      analytics: student.analytics,
      studySessions: student.studySessions,
      aiTutorSessions: student.aiTutorSessions,
      totalStudyTime: student.analytics?.totalStudyTime || 0,
      averageGrade: student.analytics?.averageGrade || 0,
      completedAssignments: student.analytics?.completedAssignments || 0,
      pendingAssignments: student.analytics?.pendingAssignments || 0,
      overdueAssignments: student.analytics?.overdueAssignments || 0,
      streakDays: student.analytics?.streakDays || 0
    }

    // Generate AI insights using OpenAI
    const insights = await OpenAIService.generateStudentInsights(studentData)

    return NextResponse.json(insights)

  } catch (error) {
    console.error('Error fetching AI insights:', error)
    return NextResponse.json({ 
      error: 'Failed to generate AI insights', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

