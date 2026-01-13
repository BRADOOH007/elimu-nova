import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { OpenAIService } from '@/lib/openai-service';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { type, subject, grade, topic, duration, objectives, requirements, difficulty, format, title, description, lessonPlanId } = await req.json();

    if (!type || !subject || !grade) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    let prompt = '';
    let generatedTitle = '';

    switch (type) {
      case 'rubric':
        generatedTitle = `Assessment Rubric: ${topic}`;
        prompt = `Create a detailed assessment rubric for ${subject} (${grade}) on the topic: ${topic}.

${objectives ? `Learning Objectives: ${objectives}` : ''}

Difficulty Level: ${difficulty}
Format: ${format}

Please include:
1. Clear criteria for each performance level
2. Specific indicators for each criterion
3. Point values or scoring system
4. Clear descriptions of what constitutes each level (e.g., Excellent, Good, Satisfactory, Needs Improvement)
5. Space for teacher comments

Make it practical and easy to use for grading.`;

        break;

      case 'powerpoint':
        generatedTitle = `Presentation: ${topic}`;
        prompt = `Create a comprehensive PowerPoint presentation outline for ${subject} (${grade}) on the topic: ${topic}.

${duration ? `Duration: ${duration} minutes` : ''}
${objectives ? `Learning Objectives: ${objectives}` : ''}
Slide Count: ${format}

Please include:
1. Title slide with topic and presenter info
2. Introduction/Overview slide
3. Main content slides (8-15 slides depending on format)
4. Examples and illustrations
5. Interactive elements or discussion questions
6. Summary/Conclusion slide
7. References slide

For each slide, provide:
- Slide title
- Key points (bullet format)
- Suggested visuals, diagrams, charts, or images
- Speaker notes
- Visual suggestions (be specific about charts, graphs, icons, photos, diagrams)

Visual suggestions should include:
- Chart types (bar, pie, line, scatter)
- Diagram types (flowchart, mind map, process diagram)
- Image suggestions (photos, illustrations, icons)
- Interactive elements (polls, quizzes, activities)

Make it engaging, visually appealing, and appropriate for the grade level. Include specific visual recommendations for each slide.`;

        break;

      case 'assignment':
        generatedTitle = title || `Assignment: ${topic || 'New Assignment'}`;
        
        // Check if it's a mathematics subject
        const isMathSubject = subject.toLowerCase().includes('math') || 
                             subject.toLowerCase().includes('algebra') || 
                             subject.toLowerCase().includes('geometry') || 
                             subject.toLowerCase().includes('calculus') ||
                             subject.toLowerCase().includes('arithmetic');
        
        prompt = `Create a warm, friendly, and engaging assignment for ${grade} students studying ${subject}${topic ? ` - ${topic}` : ''}.

${title ? `Title: ${title}` : ''}
${description ? `Teacher's Notes: ${description}` : ''}
${duration ? `Time Needed: About ${duration} minutes` : ''}
${difficulty ? `Level: ${difficulty}` : ''}
${requirements ? `Special Instructions: ${requirements}` : ''}

IMPORTANT FORMATTING RULES:
1. Use a warm, encouraging tone like a friendly teacher
2. Start with a brief, motivating introduction (2-3 sentences)
3. Use clear headings with emojis: 📚 Instructions, ✏️ Questions, 🤔 Think About It
4. Number all questions clearly (Question 1, Question 2, etc.)
5. Use simple, conversational language
6. Add encouraging phrases like "You've got this!", "Great job!", "Take your time"
7. End with a positive closing message

${isMathSubject ? `
MATHEMATICS-SPECIFIC REQUIREMENTS:
- Include 8-12 mathematical problems with clear formatting
- Show problems using proper mathematical notation
- Mix problem types: calculations, word problems, real-world applications
- For each problem:
  * Write the problem clearly
  * Leave space for work (mention "Show your work")
  * Include units where applicable (meters, dollars, etc.)
- Example format:
  Question 1: Calculate 25 × 4 = _____
  (Show your work below)
  
  Question 2: Word Problem
  Sarah has 15 apples. She gives 6 to her friend. How many apples does she have left?
  Answer: _____ apples
  
- Include a mix of:
  * Basic calculations
  * Word problems with real-life scenarios
  * Multi-step problems
  * Application problems
  * One challenge problem for extra credit
` : `
ASSIGNMENT STRUCTURE:
- Include 8-12 questions or tasks
- Mix question types:
  * Short answer questions
  * Explanation questions
  * Creative tasks
  * Real-world application
  * Critical thinking questions
- Make questions specific and clear
- Provide examples where helpful
`}

REQUIRED SECTIONS:
1. 👋 Welcome Message (friendly greeting)
2. 📚 What You'll Learn (2-3 learning goals)
3. ✏️ Instructions (step-by-step, numbered)
4. 📝 Questions/Problems (8-12 items, clearly numbered)
5. 🤔 Reflection (2-3 thinking questions)
6. 🎯 Submission (how and when to submit)
7. 💪 Closing Message (encouraging words)

TONE EXAMPLES:
❌ "Complete the following tasks"
✅ "Let's explore ${topic || 'this topic'} together! Here's what we'll do:"

❌ "Answer these questions"
✅ "Time to show what you know! Answer these questions carefully:"

❌ "Due date: [date]"
✅ "Please submit your work by [date]. Take your time and do your best!"

Make it feel like a caring teacher is talking directly to the student. Use "you" and "your" frequently. Be encouraging and supportive!`;

        break;

      case 'project':
        generatedTitle = `Project: ${topic}`;
        prompt = `Create a comprehensive project-based learning activity for ${subject} (${grade}) on the theme: ${topic}.

${duration ? `Project Duration: ${duration}` : ''}
Project Type: ${format}
${objectives ? `Learning Objectives: ${objectives}` : ''}

Please include:
1. Project overview and driving question
2. Learning objectives and skills to be developed
3. Project timeline and milestones
4. Detailed project description
5. Required deliverables
6. Research and resource requirements
7. Collaboration guidelines (if group project)
8. Assessment criteria and rubric
9. Presentation requirements
10. Reflection and evaluation components
11. Extension activities for advanced students

Make it engaging, hands-on, and relevant to real-world applications.`;

        break;

      default:
        return NextResponse.json({ error: 'Invalid content type' }, { status: 400 });
    }

    // Simulate AI generation (replace with actual AI service)
    console.log('API received data:', { type, subject, grade, topic, title: generatedTitle, description, lessonPlanId, duration, difficulty, requirements });
    
    const generatedContent = await generateAIContentWithOpenAI(type, prompt, {
      subject,
      grade,
      topic,
      title: generatedTitle,
      description,
      lessonPlanId,
      duration,
      difficulty,
      requirements
    });

    return NextResponse.json({
      success: true,
      title: generatedTitle,
      content: generatedContent,
      metadata: {
        type,
        subject,
        grade,
        topic,
        generatedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error generating content:', error);
    return NextResponse.json(
      { error: 'Failed to generate content' },
      { status: 500 }
    );
  }
}

async function generateAIContentWithOpenAI(
  type: string, 
  prompt: string, 
  context: {
    subject: string;
    grade: string;
    topic: string;
    title: string;
    description?: string;
    lessonPlanId?: string;
    duration?: number;
    difficulty?: string;
    requirements?: string;
  }
): Promise<string> {
  try {
    console.log('Generating AI content with OpenAI for type:', type);
    
    if (type === 'assignment') {
      // Use direct OpenAI API for assignment generation
      const systemPrompt = `You are an expert teacher creating student assignments. Generate clear, engaging assignment content based on the teacher's requirements.

Teacher Requirements:
- Title: ${context.title}
- Description: ${context.description || 'No specific description provided'}
- Subject: ${context.subject}
- Grade: ${context.grade}
- Topic: ${context.topic}
- Difficulty: ${context.difficulty || 'intermediate'}
- Duration: ${context.duration || 60} minutes

Create a student-friendly assignment that:
- Uses clear, direct language appropriate for ${context.grade} level
- Includes 8-12 specific questions or tasks
- Incorporates the teacher's requirements: "${context.description || 'general assignment requirements'}"
- Focuses on the topic: ${context.topic}
- Is engaging and achievable for students
- Uses markdown formatting with clear headings

Format your response as markdown with clear sections and questions.`;

      const userPrompt = `Generate a comprehensive assignment for ${context.grade} students studying ${context.subject} on the topic "${context.topic}".

Teacher's specific requirements: "${context.description || 'Create an engaging assignment that helps students learn and practice the topic.'}"

Make it practical, clear, and focused on what students need to DO.`;

      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer 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',
          'Content-Type': 'application/json',
          'HTTP-Referer': 'http://localhost:3000',
          'X-Title': 'EduGenius AI'
        },
        body: JSON.stringify({
          model: 'meta-llama/llama-3.1-8b-instruct',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.7,
          max_tokens: 2000
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      const aiResponse = data.choices?.[0]?.message?.content || 'No response generated';
      
      return aiResponse;
    }
    
    // For other content types, use a more general approach
    const systemPrompt = `You are an AI content generator for an educational platform. Generate high-quality, educational content based on the teacher's requirements.

Content Type: ${type}
Subject: ${context.subject}
Grade: ${context.grade}
Topic: ${context.topic}
Title: ${context.title}
${context.description ? `Description: ${context.description}` : ''}
${context.difficulty ? `Difficulty: ${context.difficulty}` : ''}
${context.duration ? `Duration: ${context.duration} minutes` : ''}

Generate content that is:
- Age-appropriate for the grade level
- Engaging and educational
- Well-structured with clear headings
- Practical and actionable
- Student-friendly language

Format your response in markdown with clear sections and headings.`;

    const userPrompt = `Generate ${type} content based on these requirements:

${prompt}

Make it comprehensive, engaging, and appropriate for ${context.grade} level students studying ${context.subject}.`;

    // Use OpenAI's general chat completion
    // Since makeRequest is private, we'll use a different approach
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer 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',
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:3000',
        'X-Title': 'EduGenius AI'
      },
      body: JSON.stringify({
        model: 'meta-llama/llama-3.1-8b-instruct',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 2000
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content || 'No response generated';

    return aiResponse;
    
  } catch (error) {
    console.error('Error generating AI content with OpenAI:', error);
    
    // Fallback to basic content generation
    return generateFallbackContent(type, context);
  }
}

function generateFallbackContent(
  type: string, 
  context: {
    subject: string;
    grade: string;
    topic: string;
    title: string;
    description?: string;
    difficulty?: string;
    duration?: number;
  }
): string {
  const { subject, grade, topic, title, description, difficulty, duration } = context;
  
  if (type === 'assignment') {
  return `# ${title}

## Instructions
Complete the following questions and tasks. Write your answers clearly and show your work where needed.

${description ? `**Teacher's Requirements:** ${description}` : ''}
${duration ? `**Time Allowed:** ${duration} minutes` : ''}
${difficulty ? `**Difficulty Level:** ${difficulty}` : ''}

---

## Questions

### Question 1
What is ${topic}? Explain in your own words and give 2 examples.

### Question 2
How does ${topic} relate to ${subject}? Provide 3 specific connections.

### Question 3
Solve this problem:
[Insert a specific problem related to ${topic} that students can solve]

### Question 4
Compare and contrast:
- [Two related concepts or ideas]
- [Another comparison relevant to the topic]

### Question 5
Create a diagram or chart showing:
[Specific visual representation students should create]

### Question 6
Research and find:
- 2 facts about ${topic}
- 1 real-world example
- 1 interesting statistic

### Question 7
Explain step-by-step:
[Process or procedure students need to explain]

### Question 8
What would happen if:
[Scenario-based question that requires critical thinking]

### Question 9
Design or create:
[Creative task related to the topic]

### Question 10
Reflection:
- What did you learn about ${topic}?
- What was the most interesting part?
- What questions do you still have?

---

## Additional Tasks

### Task A: Short Answer
Answer in 2-3 sentences: [Specific question requiring brief explanation]

### Task B: Problem Solving
[Step-by-step problem for students to solve]

### Task C: Application
[Real-world application task]

---

## Requirements
- Answer all questions completely
- Show your work for math problems
- Use proper grammar and spelling
- Write neatly or type your answers
- Include your name and date
${description ? `- Follow the special instructions: ${description}` : ''}

## Due Date
Submit by: [Due date will be set by teacher]

## Help
If you need help, ask your teacher or classmates. We're here to help you succeed!`;
  }
  
  // For other content types
  return `# ${title}

## Overview
This ${type} covers ${topic} in ${subject} for ${grade} level students.

${description ? `**Description:** ${description}` : ''}
${difficulty ? `**Difficulty:** ${difficulty}` : ''}
${duration ? `**Duration:** ${duration} minutes` : ''}

## Content
[Generated content will appear here]

## Key Points
- Point 1
- Point 2
- Point 3

## Summary
This ${type} provides comprehensive coverage of ${topic} appropriate for ${grade} level students.`;
}
