import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { OpenAIService } from '@/lib/openai-service'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id || session.user.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { subject, topic, difficulty, duration, description } = await req.json()

    // Get student profile
    const student = await prisma.student.findUnique({
      where: { userId: session.user.id },
      include: {
        user: true,
        analytics: true,
        teacher: {
          include: {
            user: true
          }
        }
      }
    })

    if (!student) {
      return NextResponse.json({ error: 'Student profile not found' }, { status: 404 })
    }

    // Generate AI assignment content
    const aiAssignment = await OpenAIAI.generateAIAssignment({
      subject,
      topic,
      difficulty,
      duration,
      description,
      studentLevel: student.analytics?.averageGrade ? 
        (student.analytics.averageGrade >= 85 ? 'advanced' : 
         student.analytics.averageGrade >= 70 ? 'intermediate' : 'beginner') : 'intermediate',
      learningStyle: 'visual', // Could be determined from analytics
      studentName: `${student.user.firstName} ${student.user.lastName}`
    })

    // Create assignment in database
    const assignment = await prisma.assignment.create({
      data: {
        title: aiAssignment.title,
        description: aiAssignment.description,
        instructions: aiAssignment.instructions,
        dueDate: new Date(Date.now() + (duration || 7) * 24 * 60 * 60 * 1000), // Default 7 days
        status: 'PENDING',
        teacherId: student.teacherId,
        students: {
          connect: [{ id: student.id }]
        },
        lessonPlan: {
          create: {
            title: `${topic} - AI Generated`,
            subject,
            grade: 'Grade 8', // Default grade
            teacherId: student.teacherId,
            content: {
              generatedContent: aiAssignment.content
            }
          }
        }
      },
      include: {
        teacher: {
          include: {
            user: true
          }
        },
        lessonPlan: true
      }
    })

    return NextResponse.json({ 
      success: true, 
      assignment: {
        id: assignment.id,
        title: assignment.title,
        description: assignment.description,
        instructions: assignment.instructions,
        dueDate: assignment.dueDate,
        subject,
        topic,
        aiGenerated: true
      }
    })

  } catch (error) {
    console.error('Error generating AI assignment:', error)
    return NextResponse.json({ 
      error: 'Failed to generate assignment', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id || session.user.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get AI-generated assignments for the student
    const student = await prisma.student.findUnique({
      where: { userId: session.user.id }
    })

    if (!student) {
      return NextResponse.json({ error: 'Student profile not found' }, { status: 404 })
    }

    const assignments = await prisma.assignment.findMany({
      where: {
        students: {
          some: {
            id: student.id
          }
        },
        lessonPlan: {
          title: {
            contains: 'AI Generated'
          }
        }
      },
      include: {
        teacher: {
          include: {
            user: true
          }
        },
        lessonPlan: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({ assignments })

  } catch (error) {
    console.error('Error fetching AI assignments:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch assignments', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
