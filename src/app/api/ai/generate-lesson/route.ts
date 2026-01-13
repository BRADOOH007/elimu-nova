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
    const { subject, topic, grade, difficulty, learningStyle } = body

    // Generate AI lesson using OpenAI
    const aiLessonData = await OpenAIAI.generateAILesson(
      subject,
      topic,
      grade || 'Grade 8',
      difficulty || 'intermediate',
      learningStyle || 'visual'
    )

    const aiLesson = {
      id: `ai-lesson-${Date.now()}`,
      title: aiLessonData.title,
      subject: aiLessonData.subject,
      grade: aiLessonData.grade,
      difficulty: aiLessonData.difficulty,
      duration: aiLessonData.duration,
      type: aiLessonData.type,
      aiGenerated: true,
      personalized: true,
      progress: 0,
      completed: false,
      rating: 0,
      estimatedTime: aiLessonData.estimatedTime,
      learningObjectives: aiLessonData.objectives,
      prerequisites: aiLessonData.prerequisites,
      aiInsights: aiLessonData.insights,
      generatedContent: aiLessonData.content
    }

    return NextResponse.json({
      lesson: aiLesson,
      message: 'AI lesson generated successfully using OpenAI'
    })

  } catch (error) {
    console.error('Error generating AI lesson:', error)
    return NextResponse.json({ 
      error: 'Failed to generate AI lesson', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
