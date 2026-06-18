import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const examData = await request.json();

    if (!examData.examTitle || !examData.subject || !examData.gradeLevel) {
      return NextResponse.json({ error: 'Exam title, subject, and grade level are required' }, { status: 400 });
    }

    const { OpenAI } = await import('openai');
    
    const apiKey = process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY || '';
    
    const openai = new OpenAI({
      apiKey: apiKey,
      baseURL: 'https://openrouter.ai/api/v1',
    });

    const systemPrompt = `You are an expert educational exam creator for ElimuNova AI platform. Create high-quality, curriculum-aligned exams for Kenyan schools.
IMPORTANT: Always generate content in English unless the subject is Kiswahili.

REQUIREMENTS:
- Structure exam with clear sections: Introduction, Section A (Multiple Choice), Section B (Short Answer), Section C (Long Answer/Essay)
- Include a marking scheme at the end
- Make questions age-appropriate for the specified grade
- Include a variety of difficulty levels
- Ensure alignment with ${examData.curriculum} curriculum standards
- For ${examData.subject}, focus on ${examData.topics || 'all key topics'}
- ${examData.includeDiagrams ? 'Include diagram-based questions where appropriate' : 'No diagrams needed'}

EXAM STRUCTURE:
1. Cover Page with Exam Title, Subject, Grade, Duration, Total Marks
2. Clear Instructions for Students
3. Well-organized question sections
4. Detailed Marking Scheme at the end`;

    const userPrompt = `Generate a complete exam with the following specifications:
- Title: ${examData.examTitle}
- Subject: ${examData.subject}
- Grade: ${examData.gradeLevel}
- Curriculum: ${examData.curriculum}
- Number of Questions: ${examData.numberOfQuestions}
- Difficulty: ${examData.difficulty}
- Total Marks: ${examData.totalMarks}
- Duration: ${examData.duration} minutes
- Topics to cover: ${examData.topics || 'All relevant topics'}
- Focus areas: ${examData.focusAreas || 'General understanding and application'}
- Include diagrams: ${examData.includeDiagrams ? 'Yes' : 'No'}

Format the exam as Markdown for easy reading and printing.`;

    const completion = await openai.chat.completions.create({
      model: "openai/gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      max_tokens: 4000,
      temperature: 0.7,
    });

    const examContent = completion.choices[0]?.message?.content || '';

    return NextResponse.json({
      examContent,
      usage: completion.usage
    });

  } catch (error) {
    console.error('Exam generation error:', error);
    return NextResponse.json({
      error: 'Failed to generate exam',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
