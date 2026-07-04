import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { OpenAIService } from '@/lib/openai-service'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { subject, topic, grade, difficulty, learningStyle } = body

    const content = await OpenAIService.generateText([
      { role: 'system', content: 'You are an expert AI tutor creating personalized lesson content for Kenyan students. Return structured JSON with: title, subject, grade, difficulty, duration, type, objectives, prerequisites, insights, content.' },
      { role: 'user',   content: `Create an AI-personalized lesson for: Subject: ${subject}, Topic: ${topic}, Grade: ${grade || 'Grade 8'}, Level: ${difficulty || 'intermediate'}, Style: ${learningStyle || 'visual'}. Return ONLY valid JSON.` },
    ], { maxTokens: 1500, temperature: 0.7 })

    let lessonData: any = {}
    try {
      const start = content.indexOf('{'); const end = content.lastIndexOf('}')
      if (start !== -1 && end > start) lessonData = JSON.parse(content.slice(start, end + 1))
    } catch { lessonData = { title: topic, subject, grade, content } }

    return NextResponse.json({
      lesson: {
        id: `ai-lesson-${Date.now()}`,
        title: lessonData.title || topic,
        subject: lessonData.subject || subject,
        grade: lessonData.grade || grade,
        difficulty: lessonData.difficulty || difficulty,
        duration: lessonData.duration || 40,
        type: lessonData.type || 'lesson',
        aiGenerated: true, personalized: true, progress: 0, completed: false, rating: 0,
        estimatedTime: lessonData.duration || 40,
        learningObjectives: lessonData.objectives || [],
        prerequisites: lessonData.prerequisites || [],
        aiInsights: lessonData.insights || [],
        generatedContent: lessonData.content || content,
      },
      message: 'AI lesson generated successfully',
    })
  } catch (error) {
    console.error('Error generating AI lesson:', error)
    return NextResponse.json({ error: 'Failed to generate AI lesson', details: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 })
  }
}
