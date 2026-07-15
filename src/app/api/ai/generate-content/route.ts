import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { OpenAIService } from '@/lib/openai-service';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { type, subject, grade, topic, duration, objectives, requirements, difficulty, format, title, description, lessonPlanId, documentContext } = await req.json();

    if (!type || !subject || !grade) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Fetch teacher's saved template based on content type
    let templateText = documentContext
    if (!templateText && session.user.role === 'TEACHER') {
      const templateField =
        type === 'exam'       ? 'examTemplate' :
        type === 'assignment' ? 'assignmentTemplate' :
        null
      if (templateField) {
        const teacher = await prisma.teacher.findUnique({
          where: { userId: session.user.id },
          select: { [templateField]: true },
        })
        templateText = teacher?.[templateField as keyof typeof teacher] as string | null || null
      }
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

      case 'exam':
        generatedTitle = `Exam: ${topic}`;
        const curriculumText = format === 'cbc' 
          ? 'Kenya Competency-Based Curriculum (CBC)' 
          : format === 'commoncore' 
            ? 'US Common Core State Standards' 
            : 'general educational standards';
        
        prompt = `Create a comprehensive ${subject} exam for ${grade} students on the topic: ${topic}.

Curriculum Standard: ${curriculumText}
Duration: ${duration || 60} minutes
Difficulty: ${difficulty || 'medium'}
${requirements ? `Additional Requirements: ${requirements}` : ''}

Please include:
1. Clear instructions for students
2. Multiple question types:
   - 5-10 Multiple Choice Questions (MCQ)
   - 3-5 True/False Questions
   - 3-5 Short Answer Questions
   - 1-2 Essay Questions (for higher grades)
3. Marking scheme or point values for each question
4. Answer key
5. Clear learning objectives being assessed
6. Space for student name and date
7. Time management suggestions

Make it age-appropriate, challenging but achievable, and aligned with the curriculum. Include clear sections with headings.`;

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
      requirements,
      templateText,
    });

    const { stripLatex } = await import('@/lib/clean-ai-text')

    return NextResponse.json({
      success: true,
      title: generatedTitle,
      content: stripLatex(generatedContent),
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
    subject: string; grade: string; topic: string; title: string;
    description?: string; lessonPlanId?: string; duration?: number;
    difficulty?: string; requirements?: string; templateText?: string | null;
  }
): Promise<string> {
  try {
    const templateBlock = context.templateText
      ? `\n\nA reference document was uploaded as a format template. Study its structure, sections, and style, then generate the content in the same format:\n\n${context.templateText.slice(0, 6000)}\n\n---\n`
      : ''
    const systemPrompt = `You are an expert educational content creator for Kenyan schools.${templateBlock}
Generate high-quality, CBC-aligned ${type} content for ${context.grade} ${context.subject} students.
Topic: ${context.topic}. Be practical, engaging, and age-appropriate.
Format with clear markdown headings and sections.
IMPORTANT: Do NOT use LaTeX, TeX or MathJax. Write maths in plain text: use "/" for fractions, "_____" for blanks, "^2" for powers.`

    const content = await OpenAIService.generateLongContent(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user',   content: prompt },
      ],
      { maxTokens: 2000, temperature: 0.7 }
    )
    return content
  } catch (error) {
    console.error('Error generating AI content:', error)
    return generateFallbackContent(type, context)
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
