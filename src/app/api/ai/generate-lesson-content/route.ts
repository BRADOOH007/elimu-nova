import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { OpenAIService } from '@/lib/openai-service'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { lesson, studentLevel, learningStyle } = body

    // Generate personalized lesson content using OpenAI
    const content = await OpenAIService.generateLessonContent(lesson, studentLevel, learningStyle)

    return NextResponse.json({
      content,
      message: 'Personalized lesson content generated successfully using OpenAI'
    })

  } catch (error) {
    console.error('Error generating lesson content:', error)
    return NextResponse.json({ 
      error: 'Failed to generate lesson content', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

