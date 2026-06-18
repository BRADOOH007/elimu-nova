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

// AI service using OpenAI API
export class AIService {
  private static instance: AIService
  private apiKey: string
  private baseURL: string

  public static getInstance(): AIService {
    if (!AIService.instance) {
      AIService.instance = new AIService()
    }
    return AIService.instance
  }

  constructor() {
    this.apiKey = process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY || ''
    this.baseURL = 'https://openrouter.ai/api/v1'
  }

  async generateLessonPlan(request: LessonPlanRequest): Promise<AIResponse> {
    try {
      const { OpenAI } = await import('openai')
      
      const openai = new OpenAI({
        apiKey: this.apiKey,
        baseURL: this.baseURL,
      })

      // Language Logic: Only use Swahili for Kiswahili subject, everything else in English
      const isKiswahili = request.subject.toLowerCase() === 'kiswahili'
      const languageInstruction = isKiswahili 
        ? 'IMPORTANT: Generate this lesson plan entirely in Swahili language. All content, instructions, and explanations should be in Swahili.'
        : 'IMPORTANT: Generate this lesson plan entirely in English language. All content, instructions, and explanations should be in English.'

      const prompt = `Create a detailed lesson plan for:
Subject: ${request.subject}
Grade: ${request.grade}
Topic: ${request.topic}
Duration: ${request.duration} minutes
Learning Objectives: ${request.objectives.join(', ')}
Prerequisites: ${request.prerequisites?.join(', ') || 'None specified'}

${languageInstruction}

Please create a comprehensive lesson plan that includes:
1. Lesson objectives
2. Materials needed
3. Detailed activities with timing
4. Assessment strategies
5. Homework assignments
6. Notes for the teacher

Format the response in a clear, structured way that teachers can easily follow.`

      const completion = await openai.chat.completions.create({
        model: "openai/gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: isKiswahili 
              ? "You are an expert educational consultant specializing in creating detailed, practical lesson plans in Swahili language. You have deep knowledge of Kiswahili curriculum, Swahili teaching methods, and Tanzanian/Kenyan education systems. Focus on student engagement, clear learning objectives, and effective teaching strategies. CRITICAL: Always respond entirely in Swahili language for Kiswahili subjects."
              : "You are an expert educational consultant specializing in creating detailed, practical lesson plans. Focus on student engagement, clear learning objectives, and effective teaching strategies. CRITICAL: Always respond entirely in English language for all subjects except Kiswahili."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 2000,
        temperature: 0.7,
      })

      const content = completion.choices[0]?.message?.content || 'Unable to generate lesson plan'
      
      return {
        content: content,
        metadata: {
          generatedAt: new Date().toISOString(),
          model: 'openai/gpt-4o-mini',
          tokens: completion.usage?.total_tokens || 0
        }
      }
    } catch (error) {
      console.error('Error generating lesson plan:', error)
      // Fallback to mock content if API fails
      const mockContent = this.generateMockLessonPlan(request)
      return {
        content: mockContent,
        metadata: {
          generatedAt: new Date().toISOString(),
          model: 'fallback-mock',
          tokens: 0
        }
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
      
      const { OpenAI } = await import('openai')
      
      const openai = new OpenAI({
        apiKey: this.apiKey,
        baseURL: this.baseURL,
      })

      // Language Logic: Only use Swahili for Kiswahili subject, everything else in English
      const isKiswahili = request.subject.toLowerCase() === 'kiswahili'
      const languageInstruction = isKiswahili 
        ? 'IMPORTANT: Generate this scheme of work entirely in Swahili language. All content, instructions, and explanations should be in Swahili.'
        : 'IMPORTANT: Generate this scheme of work entirely in English language. All content, instructions, and explanations should be in English.'

      const prompt = `Create a comprehensive scheme of work for:
Subject: ${request.subject}
Grade: ${request.grade}
Term: ${request.term}
Duration: ${request.duration} weeks
Lessons per week: ${request.lessonsPerWeek || 5}
Lesson duration: ${request.lessonDuration || 45} minutes
Topics to cover: ${request.topics.join(', ')}

${languageInstruction}

Please create a detailed scheme of work with the following EXACT structure:

IMPORTANT: You must cover ALL the topics provided: ${request.topics.join(', ')}. Distribute these topics across the weeks and lessons.

For each week (Week 1, Week 2, etc.), include:

**Week X: [Week Topic - should be one of the main topics]**

Then for each lesson in that week, include:

**Lesson 1: [Specific Lesson Topic - should be related to one of the provided topics]**

**Objectives:**
• [Objective 1]
• [Objective 2]
• [Objective 3]

**Teaching Activities:**
• [Activity 1]
• [Activity 2]
• [Activity 3]

**Resources and Materials:**
• [Resource 1]
• [Resource 2]
• [Resource 3]

**Assessment:**
• [Assessment method 1]
• [Assessment method 2]

**Cross-curricular Links:**
[Any relevant cross-curricular connections]

**Differentiation Strategies:**
[Strategies for different learning needs]

**Homework and Extension Activities:**
[Homework and extension tasks]

**Lesson 2: [Next Lesson Topic - should be related to one of the provided topics]**

[Repeat the same structure for Lesson 2]

Continue this pattern for ALL lessons in the week.

Make sure each week covers different aspects of the topics provided.

CRITICAL REQUIREMENTS:
1. Use exactly this format: **Week X:** followed by **Lesson Y:**
2. Include exactly ${request.lessonsPerWeek || 5} lessons per week
3. Generate content for exactly ${request.duration} weeks
4. Each lesson must have all sections: Objectives, Teaching Activities, Resources and Materials, Assessment
5. Use bullet points (•) for all lists
6. Do not skip any lessons or weeks
7. ⚠️ MANDATORY - MUST COVER ALL ${request.topics.length} TOPICS: ${request.topics.map((t, i) => `${i + 1}. ${t}`).join(', ')}
   - Each topic MUST appear in at least one full lesson with complete details
   - Do NOT skip any topic from the list
   - Dedicate sufficient lessons to each topic based on its complexity
8. Distribute the topics across different weeks and lessons logically
9. Each lesson should be ${request.lessonDuration || 45} minutes long
10. For ${request.topics.length} topics over ${request.duration} weeks, plan approximately ${Math.ceil((request.duration * (request.lessonsPerWeek || 5)) / request.topics.length)} lessons per topic
11. If you have multiple topics, dedicate different weeks or consecutive lessons to each topic
12. Start each new major topic with "**Week X: [Topic Name]**" to clearly show topic coverage
13. VERIFICATION: Before finishing, ensure EVERY topic from this list appears: ${request.topics.join(' | ')}`

      const completion = await openai.chat.completions.create({
        model: "openai/gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: isKiswahili 
              ? "You are an expert curriculum developer specializing in creating comprehensive schemes of work in Swahili language. You have deep knowledge of Kiswahili curriculum, Swahili teaching methods, and Tanzanian/Kenyan education systems. Focus on progressive learning, clear objectives, and practical implementation strategies. CRITICAL: Always respond entirely in Swahili language for Kiswahili subjects. IMPORTANT: You MUST cover ALL topics provided in the request - never skip any topic."
              : "You are an expert curriculum developer specializing in creating comprehensive schemes of work. Focus on progressive learning, clear objectives, and practical implementation strategies. CRITICAL: Always respond entirely in English language for all subjects except Kiswahili. IMPORTANT: You MUST cover ALL topics provided in the request - never skip any topic, ensure each topic gets dedicated lesson content."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 2500,
        temperature: 0.7,
      })

      const content = completion.choices[0]?.message?.content || 'Unable to generate scheme of work'
      
      return {
        content: content,
        metadata: {
          generatedAt: new Date().toISOString(),
          model: 'openai/gpt-4o-mini',
          tokens: completion.usage?.total_tokens || 0
        }
      }
    } catch (error) {
      console.error('Error generating scheme of work:', error)
      // Fallback to mock content if API fails
      const mockContent = this.generateMockSchemeOfWork(request)
      return {
        content: mockContent,
        metadata: {
          generatedAt: new Date().toISOString(),
          model: 'fallback-mock',
          tokens: 0
        }
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
