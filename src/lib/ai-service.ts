// AI Service for generating educational content using OpenAI API

export interface LessonPlanRequest {
  subject: string
  grade: string
  topic: string
  duration: number // in minutes
  objectives: string[]
  prerequisites?: string[]
}

export interface SchemeOfWorkRequest {
  subject: string
  grade: string
  term: string
  topics: string[]
  duration: number // in weeks
  lessonsPerWeek?: number
  lessonDuration?: number
}

export interface AssignmentRequest {
  subject: string
  grade: string
  topic: string
  type: 'essay' | 'quiz' | 'project' | 'presentation'
  difficulty: 'easy' | 'medium' | 'hard'
  duration: number // in minutes
}

export interface AIResponse {
  content: string
  metadata: {
    generatedAt: string
    model: string
    tokens: number
  }
}

// AI service using the ElimuNova AI waterfall
export class AIService {
  private static instance: AIService

  public static getInstance(): AIService {
    if (!AIService.instance) {
      AIService.instance = new AIService()
    }
    return AIService.instance
  }

  async generateLessonPlan(request: LessonPlanRequest): Promise<AIResponse> {
    try {
      const { OpenAIService } = await import('./openai-service')

      const isKiswahili = request.subject.toLowerCase() === 'kiswahili'

      const systemPrompt = isKiswahili
        ? 'You are an expert educational consultant specializing in creating detailed, practical lesson plans in Swahili language. CRITICAL: Always respond entirely in Swahili for Kiswahili subjects.'
        : 'You are an expert educational consultant specializing in creating detailed, practical lesson plans. CRITICAL: Always respond entirely in English.'

      const userPrompt = `Create a detailed lesson plan for:
Subject: ${request.subject}
Grade: ${request.grade}
Topic: ${request.topic}
Duration: ${request.duration} minutes
Learning Objectives: ${request.objectives.join(', ')}
Prerequisites: ${request.prerequisites?.join(', ') || 'None specified'}

Please create a comprehensive lesson plan that includes:
1. Lesson objectives
2. Materials needed
3. Detailed activities with timing
4. Assessment strategies
5. Homework assignments
6. Notes for the teacher

Format the response in a clear, structured way that teachers can easily follow.`

      const content = await OpenAIService.generateLongContent(
        [
          { role: 'system', content: systemPrompt },
          { role: 'user',   content: userPrompt   },
        ],
        { maxTokens: 2000, temperature: 0.7 }
      )

      return {
        content,
        metadata: {
          generatedAt: new Date().toISOString(),
          model: 'waterfall',
          tokens: 0,
        },
      }
    } catch (error) {
      console.error('Error generating lesson plan:', error)
      const mockContent = this.generateMockLessonPlan(request)
      return {
        content: mockContent,
        metadata: { generatedAt: new Date().toISOString(), model: 'fallback-mock', tokens: 0 },
      }
    }
  }

  async generateSchemeOfWork(request: SchemeOfWorkRequest): Promise<AIResponse> {
    try {
      console.log('AI Service - Topics received:', request.topics)
      console.log('AI Service - Request details:', {
        subject: request.subject,
        grade: request.grade,
        term: request.term,
        duration: request.duration,
        topics: request.topics
      })

      const isKiswahili = request.subject.toLowerCase() === 'kiswahili'

      const systemPrompt = isKiswahili
        ? 'You are an expert curriculum developer creating comprehensive schemes of work in Swahili. CRITICAL: Respond entirely in Swahili. Cover ALL topics provided.'
        : 'You are an expert curriculum developer creating comprehensive schemes of work. CRITICAL: Cover ALL topics provided, no topic should be skipped.'

      const userPrompt = `Create a comprehensive ${request.duration}-week scheme of work for:
Subject: ${request.subject}
Grade: ${request.grade}
Term: ${request.term}
Topics: ${request.topics.join(', ')}
Lessons per week: ${request.lessonsPerWeek || 5}
Lesson duration: ${request.lessonDuration || 40} minutes

Include for each week: objectives, activities, resources, and assessment methods.`

      const { OpenAIService } = await import('./openai-service')
      const content = await OpenAIService.generateLongContent(
        [
          { role: 'system', content: systemPrompt },
          { role: 'user',   content: userPrompt   },
        ],
        { maxTokens: 2500, temperature: 0.7 }
      )

      return {
        content,
        metadata: { generatedAt: new Date().toISOString(), model: 'waterfall', tokens: 0 },
      }
    } catch (error) {
      console.error('Error generating scheme of work:', error)
      const mockContent = this.generateMockSchemeOfWork(request)
      return {
        content: mockContent,
        metadata: { generatedAt: new Date().toISOString(), model: 'fallback-mock', tokens: 0 },
      }
    }
  }

  async generateAssignment(request: AssignmentRequest): Promise<AIResponse> {
    // Mock implementation - replace with actual AI call
    const mockContent = this.generateMockAssignment(request)
    
    return {
      content: mockContent,
      metadata: {
        generatedAt: new Date().toISOString(),
        model: 'openai/gpt-4o',
        tokens: 1000
      }
    }
  }

  async chatWithHope(message: string, context?: any): Promise<AIResponse> {
    // Mock implementation - replace with actual AI call
    const mockResponse = this.generateMockHopeResponse(message, context)
    
    return {
      content: mockResponse,
      metadata: {
        generatedAt: new Date().toISOString(),
        model: 'openai/gpt-4o',
        tokens: 500
      }
    }
  }

  private generateMockLessonPlan(request: LessonPlanRequest): string {
    const isKiswahili = request.subject.toLowerCase() === 'kiswahili'
    
    const materials = isKiswahili ? [
      "Ubao na kalamu",
      "Kitabu cha somo: Sura ya 5",
      "Karatasi za kazi",
      "Mada ya kidijitali"
    ] : [
      "Whiteboard and markers",
      "Textbook: Chapter 5",
      "Worksheets",
      "Digital presentation"
    ]

    return JSON.stringify({
      title: isKiswahili ? `${request.topic} - ${request.subject}` : `${request.topic} - ${request.subject}`,
      subject: request.subject,
      grade: request.grade,
      duration: request.duration,
      objectives: request.objectives,
      prerequisites: request.prerequisites || [],
      materials: materials,
      activities: isKiswahili ? [
        {
          phase: "Utangulizi",
          duration: 10,
          description: "Kukagua somo la awali na kuanzisha mada mpya",
          activities: [
            "Jaribio la haraka la kukagua",
            "Utangulizi wa mada na mifano ya kweli"
          ]
        },
        {
          phase: "Shughuli Kuu",
          duration: request.duration - 20,
          description: "Shughuli za kujifunza za msingi",
          activities: [
            "Mazoezi ya kiongozi na mifano",
            "Kazi ya vikundi na ushirikiano",
            "Mazoezi ya kibinafsi"
          ]
        },
        {
          phase: "Hitimisho",
          duration: 10,
          description: "Kumaliza na tathmini",
          activities: [
            "Muhtasari wa mambo muhimu",
            "Tathmini ya mwisho",
            "Muhtasari wa somo linalofuata"
          ]
        }
      ] : [
        {
          phase: "Introduction",
          duration: 10,
          description: "Review previous lesson and introduce new topic",
          activities: [
            "Quick review quiz",
            "Topic introduction with real-world examples"
          ]
        },
        {
          phase: "Main Activity",
          duration: request.duration - 20,
          description: "Core learning activities",
          activities: [
            "Guided practice with examples",
            "Group work and collaboration",
            "Individual practice exercises"
          ]
        },
        {
          phase: "Conclusion",
          duration: 10,
          description: "Wrap up and assessment",
          activities: [
            "Summary of key points",
            "Exit ticket assessment",
            "Preview of next lesson"
          ]
        }
      ],
      assessment: isKiswahili ? {
        formative: "Tathmini ya mwisho na maswali 3 muhimu",
        summative: "Jaribio la kila wiki Ijumaa"
      } : {
        formative: "Exit ticket with 3 key questions",
        summative: "Weekly quiz on Friday"
      },
      homework: isKiswahili ? "Kamilisha mazoezi 1-10 kwenye ukurasa wa 45" : "Complete exercises 1-10 on page 45",
      notes: isKiswahili ? "Kuzingatia ushiriki wa wanafunzi na kukagua uelewa mara kwa mara" : "Focus on student engagement and check for understanding frequently"
    }, null, 2)
  }

  private generateMockSchemeOfWork(request: SchemeOfWorkRequest): string {
    const isKiswahili = request.subject.toLowerCase() === 'kiswahili'
    
    return JSON.stringify({
      title: isKiswahili ? `${request.subject} - Darasa la ${request.grade} - Muhula wa ${request.term}` : `${request.subject} - ${request.grade} - ${request.term}`,
      subject: request.subject,
      grade: request.grade,
      term: request.term,
      duration: request.duration,
      topics: request.topics,
      weeklyPlan: request.topics.map((topic, index) => ({
        week: index + 1,
        topic: topic,
        objectives: isKiswahili ? [
          `Kuelewa dhana ya ${topic}`,
          `Kutumia ${topic} katika hali za kweli`,
          `Kuchambua matatizo yanayohusiana na ${topic}`
        ] : [
          `Understand the concept of ${topic}`,
          `Apply ${topic} in practical situations`,
          `Analyze problems related to ${topic}`
        ],
        activities: isKiswahili ? [
          "Utangulizi na maelezo",
          "Mazoezi ya kiongozi",
          "Mazoezi ya kujitegemea",
          "Tathmini na ukaguzi"
        ] : [
          "Introduction and explanation",
          "Guided practice",
          "Independent practice",
          "Assessment and review"
        ],
        resources: isKiswahili ? [
          "Sura za kitabu cha somo",
          "Nyenzo za kidijitali",
          "Karatasi za kazi na mazoezi"
        ] : [
          "Textbook chapters",
          "Online resources",
          "Worksheets and exercises"
        ],
        assessment: isKiswahili ? "Jaribio la kila wiki na kazi ya mradi" : "Weekly quiz and project work"
      })),
      resources: isKiswahili ? [
        "Kitabu cha somo cha msingi",
        "Nyenzo za ziada",
        "Nyenzo za kidijitali",
        "Vifaa vya tathmini"
      ] : [
        "Main textbook",
        "Supplementary materials",
        "Digital resources",
        "Assessment tools"
      ],
      assessment: isKiswahili ? {
        continuous: "Jaribio la kila wiki na kazi",
        midterm: "Jaribio la katikati ya muhula",
        final: "Jaribio la mwisho wa muhula"
      } : {
        continuous: "Weekly quizzes and assignments",
        midterm: "Mid-term examination",
        final: "End-of-term examination"
      }
    }, null, 2)
  }

  private generateMockAssignment(request: AssignmentRequest): string {
    return JSON.stringify({
      title: `${request.topic} - ${request.type.charAt(0).toUpperCase() + request.type.slice(1)}`,
      subject: request.subject,
      grade: request.grade,
      topic: request.topic,
      type: request.type,
      difficulty: request.difficulty,
      duration: request.duration,
      instructions: `Create a ${request.type} about ${request.topic}. This assignment should demonstrate your understanding of the key concepts we've covered in class.`,
      requirements: [
        "Follow the specified format",
        "Include proper citations if needed",
        "Submit by the due date",
        "Use clear and concise language"
      ],
      rubric: {
        "Content Understanding": "40%",
        "Organization": "25%",
        "Creativity": "20%",
        "Presentation": "15%"
      },
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
      submissionFormat: request.type === 'essay' ? 'PDF or Word document' : 'As specified in instructions'
    }, null, 2)
  }

  private generateMockHopeResponse(message: string, context?: any): string {
    const responses = [
      "I'd be happy to help you with that! Let me provide some guidance on your teaching question.",
      "That's a great question! Here are some strategies you can use in your classroom.",
      "I understand you're looking for support with that topic. Let me share some best practices.",
      "Excellent question! This is a common challenge in education. Here's what I recommend."
    ]
    
    const randomResponse = responses[Math.floor(Math.random() * responses.length)]
    
    return JSON.stringify({
      response: randomResponse,
      suggestions: [
        "Consider using visual aids to enhance understanding",
        "Break down complex concepts into smaller parts",
        "Encourage student participation and discussion",
        "Use real-world examples to make content relatable"
      ],
      resources: [
        "Educational best practices guide",
        "Classroom management tips",
        "Assessment strategies",
        "Student engagement techniques"
      ]
    }, null, 2)
  }
}

export const aiService = AIService.getInstance()
