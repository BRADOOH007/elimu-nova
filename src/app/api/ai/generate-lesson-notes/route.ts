import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { lessonPlan, noteType } = await request.json()

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

    const systemPrompt = `You are an AI lesson notes generator for the ElimuNova AI platform. Generate comprehensive lesson notes based on lesson plans.

NOTE TYPES:
1. Summary Notes - Key points and main concepts
2. Detailed Notes - Comprehensive coverage of all topics
3. Study Guide - Organized for exam preparation
4. Quick Reference - Brief, easy-to-scan format
5. Interactive Notes - Questions and activities included

REQUIREMENTS:
- Base notes on the provided lesson plan content
- Use clear, student-friendly language
- Include key concepts, definitions, and examples
- Organize information logically
- Use headings, bullet points, and formatting
- Include important formulas, dates, or facts
- Make notes suitable for the grade level
- Include study tips and memory aids when appropriate

FORMAT: Return as JSON with the following structure:
{
  "title": "Lesson Notes Title",
  "subject": "Subject",
  "grade": "Grade Level",
  "noteType": "Type of notes",
  "sections": [
    {
      "heading": "Section Title",
      "content": "Section content with key points, examples, and explanations",
      "keyPoints": ["Key point 1", "Key point 2", "Key point 3"],
      "examples": ["Example 1", "Example 2"],
      "formulas": ["Formula 1", "Formula 2"],
      "definitions": {
        "Term 1": "Definition 1",
        "Term 2": "Definition 2"
      }
    }
  ],
  "summary": "Brief summary of the lesson",
  "studyTips": ["Tip 1", "Tip 2", "Tip 3"],
  "importantPoints": ["Important point 1", "Important point 2"],
  "nextSteps": "What to study next or practice"
}`

    const userPrompt = `Generate ${noteType || 'summary'} notes based on this lesson plan:

Title: ${lessonPlan.title}
Subject: ${lessonPlan.subject}
Grade: ${lessonPlan.grade}
Content: ${lessonPlan.content?.generatedContent || 'No content provided'}

Create comprehensive, well-organized notes that students can use for studying and reference.`

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
    let notesData
    try {
      notesData = JSON.parse(response)
    } catch (parseError) {
      // If JSON parsing fails, return the raw response
      notesData = {
        title: `Notes for ${lessonPlan.title}`,
        subject: lessonPlan.subject,
        grade: lessonPlan.grade,
        noteType: noteType || 'summary',
        sections: [],
        summary: "AI-generated lesson notes based on the lesson plan",
        studyTips: [],
        importantPoints: [],
        nextSteps: "Review the lesson content and practice the concepts",
        rawResponse: response
      }
    }

    return NextResponse.json({ 
      notes: notesData,
      usage: completion.usage 
    })

  } catch (error) {
    console.error('Lesson notes generation error:', error)
    
    return NextResponse.json({ 
      error: 'Failed to generate lesson notes',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
