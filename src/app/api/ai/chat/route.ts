import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { message, context, lessonContext, schemeContext, assignmentsContext } = await request.json()

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    // Dynamic import of OpenAI
    const { OpenAI } = await import('openai')
    
    const apiKey = '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'
    
    console.log('Using OpenAI API Key:', apiKey.substring(0, 20) + '...')
    
    const openai = new OpenAI({
      apiKey: apiKey,
      baseURL: 'https://openrouter.ai/api/v1',
    })

    // Create a system prompt based on context
    let systemPrompt = "You are Hope, an AI teaching assistant for the ElimuNova AI platform. You help teachers with educational tasks, lesson planning, curriculum development, and teaching strategies. Be helpful, professional, and educational in your responses. IMPORTANT: Always respond in English unless specifically asked about Kiswahili language content."

    if (context === 'teacher_assistant') {
      systemPrompt = `You are Hope, an AI teaching assistant for the ElimuNova AI platform. You are designed to help teachers with:

1. Lesson Planning - Create detailed, engaging lesson plans for any subject and grade level
2. Curriculum Development - Help structure curricula and learning objectives
3. Assessment Ideas - Suggest creative and effective assessment methods
4. Student Engagement - Provide strategies to make learning more interactive and engaging
5. Educational Strategies - Offer evidence-based teaching methods and approaches
6. Content Creation - Help create educational materials, activities, and resources
7. Classroom Management - Provide tips for maintaining a positive learning environment
8. Differentiation - Help adapt content for different learning styles and abilities

Always provide practical, actionable advice that teachers can implement immediately. Be encouraging, professional, and focus on student-centered learning. When appropriate, suggest specific activities, resources, or teaching techniques.`
    } else if (context === 'student_tutor') {
      let contextInfo = ''
      
      // Fetch shared lesson plans, schemes of work, and AI content for the student
      let sharedLessonPlans = []
      let sharedSchemesOfWork = []
      let sharedAIContent = []
      try {
        const session = await getServerSession(authOptions)
        if (session && session.user.role === 'STUDENT') {
          const student = await prisma.student.findUnique({
            where: { userId: session.user.id },
            include: {
              class: {
                include: {
                  teacher: true
                }
              }
            }
          })

          if (student) {
            // Fetch shared lesson plans
            const lessonPlans = await prisma.lessonPlan.findMany({
              where: {
                teacherId: student.class?.teacherId,
                isShared: true
              },
              select: {
                id: true,
                title: true,
                subject: true,
                grade: true,
                content: true,
                createdAt: true
              },
              orderBy: {
                createdAt: 'desc'
              }
            })

            sharedLessonPlans = lessonPlans.map(plan => ({
              ...plan,
              content: typeof plan.content === 'string' ? JSON.parse(plan.content) : plan.content
            }))

            // Fetch shared schemes of work
            const sharedSchemes = await prisma.sharedSchemeOfWork.findMany({
              where: {
                studentId: student.id,
                isActive: true
              },
              include: {
                schemeOfWork: {
                  select: {
                    id: true,
                    title: true,
                    subject: true,
                    grade: true,
                    content: true,
                    duration: true,
                    objectives: true,
                    createdAt: true
                  }
                },
                teacher: {
                  select: {
                    user: {
                      select: {
                        firstName: true,
                        lastName: true
                      }
                    }
                  }
                }
              },
              orderBy: {
                sharedAt: 'desc'
              }
            })

            sharedSchemesOfWork = sharedSchemes.map(shared => ({
              ...shared.schemeOfWork,
              content: typeof shared.schemeOfWork.content === 'string' ? JSON.parse(shared.schemeOfWork.content) : shared.schemeOfWork.content,
              sharedBy: `${shared.teacher.user.firstName} ${shared.teacher.user.lastName}`,
              sharedAt: shared.sharedAt
            }))

            // Fetch shared AI content
            const sharedAIContentRecords = await prisma.sharedAIContent.findMany({
              where: {
                studentId: student.id
              },
              include: {
                content: {
                  include: {
                    teacher: {
                      select: {
                        user: {
                          select: {
                            firstName: true,
                            lastName: true
                          }
                        }
                      }
                    }
                  }
                }
              },
              orderBy: {
                sharedAt: 'desc'
              }
            })

            sharedAIContent = sharedAIContentRecords.map(shared => ({
              ...shared.content,
              sharedBy: `${shared.content.teacher.user.firstName} ${shared.content.teacher.user.lastName}`,
              sharedAt: shared.sharedAt
            }))
          }
        }
      } catch (error) {
        console.error('Error fetching shared materials:', error)
      }
      
      if (lessonContext && lessonContext.lessonPlan) {
        const { title, subject, grade, content } = lessonContext.lessonPlan
        contextInfo = `

CURRENT LESSON CONTEXT:
- Lesson Title: ${title}
- Subject: ${subject}
- Grade Level: ${grade}
- Lesson Content: ${content?.generatedContent || 'No specific content provided'}

IMPORTANT: The student is currently working on this specific lesson. Use this context to:
1. Provide relevant explanations and examples related to this lesson
2. Ask questions that test understanding of the lesson content
3. Suggest activities and exercises based on the lesson objectives
4. Help with homework or assignments related to this lesson
5. Generate assessments and quizzes based on the lesson content
6. Create lesson notes and summaries from the lesson plan

Always reference the lesson content when appropriate and ensure your responses are aligned with what the student is currently learning.`
      }

      if (schemeContext && schemeContext.schemeOfWork) {
        const { title, subject, grade, content, duration, objectives } = schemeContext.schemeOfWork
        contextInfo += `

CURRENT SCHEME OF WORK CONTEXT:
- Scheme Title: ${title}
- Subject: ${subject}
- Grade Level: ${grade}
- Duration: ${duration || 'Not specified'} weeks
- Objectives: ${objectives || 'Not specified'}
- Content: ${content?.generatedContent || 'No specific content provided'}

IMPORTANT: The student is working within this scheme of work framework. Use this context to:
1. Provide comprehensive guidance aligned with the curriculum structure
2. Reference the scheme's learning objectives and progression
3. Help the student understand how individual lessons fit into the broader curriculum
4. Suggest study strategies based on the scheme's timeline and topics
5. Generate assessments that align with the scheme's learning outcomes
6. Create study notes that follow the scheme's structure and objectives

Always reference the scheme of work when appropriate and ensure your responses support the student's overall learning journey.`
      }

      if (assignmentsContext && assignmentsContext.assignments) {
        const assignments = assignmentsContext.assignments
        contextInfo += `

CURRENT ASSIGNMENTS CONTEXT:
The student has the following active assignments:

${assignments.map((assignment: any, index: number) => `
${index + 1}. ${assignment.title}
   - Subject: ${assignment.lessonPlan?.subject || 'General'}
   - Grade: ${assignment.lessonPlan?.grade || 'Not specified'}
   - Due Date: ${new Date(assignment.dueDate).toLocaleDateString()}
   - Status: ${assignment.status}
   - Description: ${assignment.description}
   - Content: ${assignment.content}
   ${assignment.isOverdue ? '   - ⚠️ OVERDUE' : ''}
   ${assignment.submission ? `   - Submission Status: ${assignment.submission.grade ? 'Graded' : 'Submitted'}` : '   - Not yet submitted'}
`).join('')}

IMPORTANT: The student has these assignments to work on. Use this context to:
1. Help the student understand assignment requirements and expectations
2. Provide guidance on how to approach each assignment
3. Suggest study strategies and resources for completing assignments
4. Help with specific questions related to assignment content
5. Provide feedback on assignment progress and quality
6. Suggest time management strategies for meeting deadlines
7. Help with assignment submission and formatting
8. Provide encouragement and motivation for completing assignments

Always reference the specific assignments when appropriate and provide targeted help based on what the student is working on.`
      }

      // Add shared lesson plans context
      if (sharedLessonPlans.length > 0) {
        contextInfo += `

AVAILABLE SHARED LESSON PLANS:
Your teacher has shared the following lesson plans with you:

${sharedLessonPlans.map((plan: any, index: number) => `
${index + 1}. ${plan.title}
   - Subject: ${plan.subject}
   - Grade: ${plan.grade}
   - Created: ${new Date(plan.createdAt).toLocaleDateString()}
   - Content: ${plan.content?.generatedContent ? plan.content.generatedContent.substring(0, 200) + '...' : 'No content available'}
`).join('')}

IMPORTANT: These are lesson plans shared by your teacher. Use this context to:
1. Reference specific lesson content when helping the student with questions
2. Provide explanations based on the actual lesson materials
3. Suggest activities and exercises from the shared lesson plans
4. Help with homework and assignments related to these lessons
5. Create study notes and summaries from the lesson content
6. Generate quizzes and assessments based on the lesson objectives
7. Provide context-aware tutoring that aligns with what the teacher is teaching

Always reference the specific lesson plans when appropriate and ensure your responses are aligned with the teacher's curriculum and teaching approach.`
      }

      // Add shared schemes of work context
      if (sharedSchemesOfWork.length > 0) {
        contextInfo += `

AVAILABLE SHARED SCHEMES OF WORK:
Your teacher has shared the following schemes of work with you:

${sharedSchemesOfWork.map((scheme: any, index: number) => `
${index + 1}. ${scheme.title}
   - Subject: ${scheme.subject}
   - Grade: ${scheme.grade}
   - Duration: ${scheme.duration || 'Not specified'} weeks
   - Objectives: ${scheme.objectives || 'Not specified'}
   - Shared by: ${scheme.sharedBy}
   - Shared: ${new Date(scheme.sharedAt).toLocaleDateString()}
   - Content: ${scheme.content?.generatedContent ? scheme.content.generatedContent.substring(0, 300) + '...' : 'No content available'}
`).join('')}

IMPORTANT: These are comprehensive schemes of work shared by your teacher. Use this context to:
1. Provide structured learning guidance based on the curriculum framework
2. Reference the scheme's learning objectives and progression timeline
3. Help the student understand how individual topics fit into the broader curriculum
4. Suggest study strategies based on the scheme's duration and topics
5. Generate assessments and quizzes aligned with the scheme's learning outcomes
6. Create study notes that follow the scheme's structure and objectives
7. Provide context-aware tutoring that aligns with the teacher's curriculum planning
8. Help the student track their progress through the scheme's timeline

Always reference the specific schemes of work when appropriate and ensure your responses support the student's overall learning journey according to the teacher's curriculum structure.`
      }

      // Add shared AI content context
      if (sharedAIContent.length > 0) {
        contextInfo += `

AVAILABLE SHARED AI CONTENT:
Your teacher has shared the following AI-generated educational content with you:

${sharedAIContent.map((content: any, index: number) => `
${index + 1}. ${content.title}
   - Type: ${content.type}
   - Subject: ${content.subject}
   - Grade: ${content.grade}
   - Topic: ${content.topic}
   - Shared by: ${content.sharedBy}
   - Shared: ${new Date(content.sharedAt).toLocaleDateString()}
   - Content: ${content.content.substring(0, 300) + '...'}
`).join('')}

Use this AI-generated content to provide targeted help and guidance. Reference specific rubrics for assessment help, PowerPoint content for presentation guidance, assignments for task completion, and projects for project-based learning support.

Always reference the specific AI content when appropriate and provide targeted help based on what your teacher has shared with you.`
      }

      systemPrompt = `You are an AI Tutor for the ElimuNova AI platform, designed to help students learn and understand various subjects. You are:

1. Patient and encouraging - Always be supportive and positive
2. Clear and simple - Explain concepts in easy-to-understand terms
3. Interactive - Ask questions to check understanding
4. Comprehensive - Cover topics thoroughly but not overwhelming
5. Adaptive - Adjust explanations based on the student's level
6. Practical - Provide examples and real-world applications
7. Educational - Focus on helping students learn, not just giving answers

You can help with:
- Math problems and concepts
- Science explanations
- Language learning
- Study strategies
- Homework assistance
- Test preparation
- Concept clarification
- Learning techniques
- Generating assessments based on lesson content
- Creating lesson notes and summaries
- Providing contextual help based on current lessons

Always encourage students to think through problems and provide step-by-step guidance when appropriate. Be friendly, supportive, and focus on building understanding rather than just providing answers.${contextInfo}`
    }

    const completion = await openai.chat.completions.create({
      model: "openai/gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: message
        }
      ],
      max_tokens: 1000,
      temperature: 0.7,
    })

    const response = completion.choices[0]?.message?.content

    if (!response) {
      throw new Error('No response from OpenAI')
    }

    return NextResponse.json({ 
      response,
      usage: completion.usage 
    })

  } catch (error) {
    console.error('OpenAI API Error:', error)
    
    // Return a fallback response if OpenAI fails
    return NextResponse.json({ 
      response: "I'm sorry, I'm experiencing some technical difficulties right now. Please try again in a moment, or contact support if the issue persists.",
      error: 'AI service temporarily unavailable'
    }, { status: 500 })
  }
}
