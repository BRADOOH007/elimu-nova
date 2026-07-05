import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { OpenAIService } from '@/lib/openai-service'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { 
      title, 
      subject, 
      grade, 
      criteria, 
      performanceLevels,
      description 
    } = await request.json()

    if (!title || !subject || !grade || !criteria || criteria.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields: title, subject, grade, and criteria' },
        { status: 400 }
      )
    }

    // Create AI prompt for rubric generation
    const prompt = `Create a detailed assessment rubric with the following specifications:

Title: ${title}
Subject: ${subject}
Grade Level: ${grade}
Description: ${description || 'No description provided'}

Criteria to evaluate:
${criteria.map((criterion: any, index: number) => `${index + 1}. ${criterion.title}: ${criterion.description}`).join('\n')}

Performance Levels: ${performanceLevels?.map((level: any) => level.name).join(', ') || 'Excellent, Good, Satisfactory, Needs Improvement'}

Please generate:
1. Detailed descriptions for each performance level for every criterion
2. Point values or scoring guidelines
3. Clear expectations for each level
4. Specific examples where appropriate

Format the response as a structured rubric that teachers can use for assessment.`

    const aiResponse = await OpenAIService.generateAIContent(prompt, {
      maxTokens: 2000,
      temperature: 0.7
    })

    // Parse and structure the AI response
    const rubricData = {
      title,
      subject,
      grade,
      description: description || '',
      criteria: criteria.map((criterion: any, index: number) => ({
        id: `criterion-${index + 1}`,
        title: criterion.title,
        description: criterion.description,
        weight: criterion.weight || 1
      })),
      performanceLevels: performanceLevels || [
        { id: 'excellent', name: 'Excellent', points: 4, description: 'Exceeds expectations' },
        { id: 'good', name: 'Good', points: 3, description: 'Meets expectations' },
        { id: 'satisfactory', name: 'Satisfactory', points: 2, description: 'Approaching expectations' },
        { id: 'needs-improvement', name: 'Needs Improvement', points: 1, description: 'Below expectations' }
      ],
      aiGeneratedContent: aiResponse,
      createdBy: session.user.id,
      createdAt: new Date().toISOString()
    }

    return NextResponse.json({
      success: true,
      rubric: rubricData,
      message: 'Rubric generated successfully'
    })

  } catch (error) {
    console.error('AI Rubric Generation Error:', error)
    return NextResponse.json(
      { error: 'Failed to generate rubric' },
      { status: 500 }
    )
  }
}