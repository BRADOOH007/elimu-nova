import { NextResponse } from 'next/server';
import { OpenAIService } from '@/lib/openai-service';
import { prisma } from '@/lib/prisma';
import { route } from '@/lib/api-middleware';

export const POST = route({}, async (req, { user }) => {
    const { type, subject, grade, topic, duration, objectives, requirements, difficulty, format, title, description, lessonPlanId, documentContext, numQuestions } = await req.json();

    if (!type || !subject || !grade) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Fetch teacher's saved template based on content type
    let templateText = documentContext
    if (!templateText && user.role === 'TEACHER') {
      const templateField =
        type === 'exam'       ? 'examTemplate' :
        type === 'assignment' ? 'assignmentTemplate' :
        null
      if (templateField) {
        const teacher = await prisma.teacher.findUnique({
          where: { userId: user.id },
          select: { [templateField]: true },
        })
        const teacherField = teacher?.[templateField as keyof typeof teacher]
        templateText = typeof teacherField === 'string' ? teacherField : null
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
        const qCount = Math.max(1, Math.min(20, numQuestions || 5));

        prompt = `Create an assignment worksheet for ${grade} ${subject} students on "${topic}".

STRUCTURE — exactly 3 sections:
1. EXAMPLE / EXPLANATION — Teach the concept first with a clear, simple example the student can study. Use plain language. Show step-by-step how the concept works. This is NOT a lesson plan — it is a quick reference the student reads before answering.

2. MULTIPLE CHOICE QUESTIONS — Exactly ${qCount} multiple choice questions that test understanding of the topic. Each question must have:
   - A clear question stem
   - 4 options labelled A, B, C, D (only ONE correct)
   - The correct answer letter marked in parentheses at the end of each question: (Answer: X)

3. 📝 ANSWER KEY — List the correct answers: 1. A, 2. C, etc.

RULES:
- The EXAMPLE/EXPLANATION must be practical and show real working, not theoretical lecture
- All ${qCount} questions must be MULTIPLE CHOICE — no short answer, no essay, no fill-in-blank
- Questions must be age-appropriate for ${grade}
- Use Kenyan contexts and examples (KES, Kenyan names, local scenarios)
- Do NOT use LaTeX — write math in plain text (use "/" for fractions, "^2" for powers)
- Keep the tone clear and straightforward — this is a worksheet, not a motivational speech
- Do NOT add extra sections beyond the 3 listed above`;

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
})

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

## Example / Explanation

Here is a simple explanation of **${topic}** to help you understand the concept before attempting the questions.

${topic} in ${subject} for ${grade} is about understanding key ideas and applying them to solve problems. Let's look at an example:

**Example:**
[Provide a clear, step-by-step example related to ${topic} here. Show how the concept works in practice.]

---

## Multiple Choice Questions

Answer the following questions by choosing the correct option (A, B, C, or D).

**1.** Question about ${topic}?
A. Option one
B. Option two  
C. Option three
D. Option four
(Answer: A)

**2.** Question about ${topic}?
A. Option one
B. Option two
C. Option three
D. Option four
(Answer: C)

---

## Answer Key
1. A
2. C`;
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
