import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { lessonPlan, assessmentType, questionCount } = await request.json()

    if (!lessonPlan) {
      return NextResponse.json({ error: 'Lesson plan is required' }, { status: 400 })
    }

    // Dynamic import of OpenAI
    const { OpenAI } = await import('openai')
    
    const apiKey = process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY || ''
    
    const openai = new OpenAI({
      apiKey: apiKey,
      baseURL: 'https://openrouter.ai/api/v1',
    })

    const systemPrompt = `You are an AI assessment generator for the ElimuNova AI platform. Generate educational assessments based on lesson plans. IMPORTANT: Always generate assessments in English unless the lesson plan is specifically for Kiswahili language subject.

ASSESSMENT TYPES:
1. Multiple Choice - Create questions with 4 options (A, B, C, D)
2. True/False - Create statements that are true or false
3. Short Answer - Create questions requiring brief written responses
4. Essay - Create questions requiring detailed written responses
5. Fill in the Blank - Create sentences with missing words
6. Matching - Create matching exercises
7. Problem Solving - Create step-by-step problem-solving questions

REQUIREMENTS:
- Base questions on the provided lesson plan content
- Ensure questions test understanding, not just memorization
- Include a variety of difficulty levels (easy, medium, hard)
- Provide clear, unambiguous questions
- Include correct answers and explanations
- Make questions age-appropriate for the grade level
- Ensure questions align with learning objectives

FORMAT: Return as JSON with the following structure:
{
  "title": "Assessment Title",
  "description": "Brief description of the assessment",
  "questions": [
    {
      "id": 1,
      "type": "multiple_choice",
      "question": "Question text",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": "A",
      "explanation": "Why this answer is correct",
      "difficulty": "easy|medium|hard"
    }
  ],
  "instructions": "Instructions for students",
  "timeLimit": "Suggested time limit in minutes"
}`

    const isKiswahili = lessonPlan.subject?.toLowerCase() === 'kiswahili'
    const languageInstruction = isKiswahili 
      ? 'IMPORTANT: Generate this assessment entirely in Swahili language. All questions, options, and explanations should be in Swahili.'
      : 'IMPORTANT: Generate this assessment entirely in English language. All questions, options, and explanations should be in English.'

    const userPrompt = `Generate a ${assessmentType || 'mixed'} assessment based on this lesson plan:

Title: ${lessonPlan.title}
Subject: ${lessonPlan.subject}
Grade: ${lessonPlan.grade}
Content: ${lessonPlan.content?.generatedContent || 'No content provided'}

${languageInstruction}

Generate ${questionCount || 10} questions that test understanding of the lesson content.`

    const completion = await openai.chat.completions.create({
      model: "openai/gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: userPrompt
        }
      ],
      max_tokens: 2000,
      temperature: 0.7,
    })

    const response = completion.choices[0]?.message?.content

    if (!response) {
      throw new Error('No response from OpenAI')
    }

    // Try to parse the JSON response
    let assessmentData
    try {
      assessmentData = JSON.parse(response)
    } catch (parseError) {
      // If JSON parsing fails, return the raw response
      assessmentData = {
        title: `Assessment for ${lessonPlan.title}`,
        description: "AI-generated assessment based on lesson plan",
        questions: [],
        instructions: "Complete all questions to the best of your ability",
        timeLimit: "30 minutes",
        rawResponse: response
      }
    }

    return NextResponse.json({ 
      assessment: assessmentData,
      usage: completion.usage 
    })

  } catch (error) {
    console.error('Assessment generation error:', error)
    
    return NextResponse.json({ 
      error: 'Failed to generate assessment',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
