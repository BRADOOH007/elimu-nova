/**
 * Unified OpenAI Service for all AI generations in ElimuNova AI
 * Replaces OpenRouter, Stability AI, and other AI services
 */

import OpenAI from 'openai'

export interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface ImageGenerationRequest {
  prompt: string
  style?: 'natural' | 'vivid'
  size?: '512x512' | '1024x1024' | '1536x1024' | '1024x1536'
  quality?: 'standard' | 'hd'
}

export interface ImageGenerationResponse {
  url: string
  provider: string
  revisedPrompt?: string
  metadata?: any
}

export class OpenAIService {
  private static getClient(): OpenAI {
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      throw new Error('OpenAI API key not configured. Please set OPENAI_API_KEY environment variable.')
    }
    return new OpenAI({ apiKey })
  }

  /**
   * Generate text content using OpenAI GPT models
   */
  static async generateText(
    messages: OpenAIMessage[],
    options?: {
      model?: string
      maxTokens?: number
      temperature?: number
    }
  ): Promise<string> {
    try {
      const openai = this.getClient()
      
      const response = await openai.chat.completions.create({
        model: options?.model || 'gpt-4o-mini',
        messages: messages,
        max_tokens: options?.maxTokens || 2000,
        temperature: options?.temperature || 0.7,
      })

      return response.choices[0]?.message?.content || 'No response generated'
    } catch (error) {
      console.error('OpenAI text generation error:', error)
      throw error
    }
  }

  /**
   * Generate images using DALL-E 3
   */
  static async generateImage(request: ImageGenerationRequest): Promise<ImageGenerationResponse> {
    try {
      const openai = this.getClient()
      
      // Map our custom sizes to DALL-E 3 supported sizes
      const sizeMapping: Record<string, '1024x1024' | '1792x1024' | '1024x1792'> = {
        '512x512': '1024x1024',     // Map small to square (will be resized client-side)
        '1024x1024': '1024x1024',   // Direct mapping
        '1536x1024': '1792x1024',   // Map to closest landscape
        '1024x1536': '1024x1792'    // Map to closest portrait
      }
      
      const dalleSize = sizeMapping[request.size || '1024x1024'] || '1024x1024'
      
      const response = await openai.images.generate({
        model: 'dall-e-3',
        prompt: request.prompt,
        n: 1,
        size: dalleSize,
        quality: request.quality || 'standard',
        style: request.style || 'natural',
      })

      const imageUrl = response.data?.[0]?.url
      if (!imageUrl) {
        throw new Error('No image URL returned from OpenAI')
      }

      return {
        url: imageUrl,
        provider: 'openai-dalle-3',
        revisedPrompt: response.data?.[0]?.revised_prompt,
        metadata: {
          model: 'dall-e-3',
          requestedSize: request.size || '1024x1024',
          dalleSize: dalleSize,
          quality: request.quality || 'standard',
          style: request.style || 'natural',
        }
      }
    } catch (error) {
      console.error('OpenAI image generation error:', error)
      throw error
    }
  }

  /**
   * Generate lesson plans
   */
  static async generateLessonPlan(data: {
    subject: string
    topic: string
    grade: string
    duration: string
    objectives: string[]
    resources?: string[]
  }): Promise<string> {
    const systemPrompt = `You are an expert educational content creator specializing in lesson plan development. Create comprehensive, engaging lesson plans that follow best practices in education.

Key requirements:
- Follow a clear structure with objectives, activities, and assessments
- Include differentiated instruction strategies
- Incorporate active learning techniques
- Provide clear timing for each activity
- Include assessment methods
- Make it practical and implementable
- Use age-appropriate language and activities`

    const userPrompt = `Create a detailed lesson plan for:
- Subject: ${data.subject}
- Topic: ${data.topic}
- Grade Level: ${data.grade}
- Duration: ${data.duration}
- Learning Objectives: ${data.objectives.join(', ')}
${data.resources ? `- Available Resources: ${data.resources.join(', ')}` : ''}

Format the response in markdown with clear headings and structure.`

    const messages: OpenAIMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ]

    return await this.generateText(messages)
  }

  /**
   * Generate lesson content for students
   */
  static async generateLessonContent(
    lessonPlan: any,
    studentLevel: string,
    studentInterests?: string[]
  ): Promise<string> {
    const systemPrompt = `You are an AI tutor that creates personalized, engaging lesson content for students. Your goal is to make learning fun, interactive, and tailored to each student's level and interests.

Create content that:
- Matches the student's learning level
- Incorporates their interests when possible
- Uses clear, age-appropriate language
- Includes interactive elements and examples
- Encourages active participation
- Builds confidence and motivation

Make it comprehensive, engaging, and educational. Include practical examples, interactive elements, and clear learning objectives.`

    const userPrompt = `Based on this lesson plan, create personalized content for a ${studentLevel} level student:

Lesson Plan: ${JSON.stringify(lessonPlan, null, 2)}
${studentInterests ? `Student Interests: ${studentInterests.join(', ')}` : ''}

Create engaging, interactive content that will help this student learn effectively.`

    const messages: OpenAIMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ]

    return await this.generateText(messages)
  }

  /**
   * Generate assignments
   */
  static async generateAssignment(data: {
    subject: string
    topic: string
    grade: string
    type: string
    difficulty: string
    instructions?: string
  }): Promise<string> {
    const systemPrompt = `You are an expert educator creating assignments that effectively assess student learning. Create assignments that are:

- Aligned with learning objectives
- Appropriate for the grade level and difficulty
- Clear and well-structured
- Engaging and meaningful
- Include various question types
- Provide clear instructions and rubrics
- Encourage critical thinking and application

Format assignments professionally with clear sections, instructions, and assessment criteria.`

    const userPrompt = `Create a ${data.type} assignment for:
- Subject: ${data.subject}
- Topic: ${data.topic}
- Grade Level: ${data.grade}
- Difficulty: ${data.difficulty}
${data.instructions ? `- Special Instructions: ${data.instructions}` : ''}

Include:
- Clear instructions
- Multiple question types
- Assessment rubric
- Expected completion time
- Learning objectives alignment`

    const messages: OpenAIMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ]

    return await this.generateText(messages)
  }

  /**
   * Generate study notes
   */
  static async generateStudyNotes(data: {
    subject: string
    topic: string
    grade: string
    content: string
    format?: string
  }): Promise<string> {
    const systemPrompt = `You are an expert study guide creator. Transform educational content into clear, organized, and effective study notes that help students learn and retain information.

Create study notes that are:
- Well-organized with clear headings
- Include key concepts and definitions
- Use bullet points and numbered lists
- Highlight important information
- Include examples and applications
- Easy to review and memorize
- Appropriate for the grade level

Make the notes clear, organized, and helpful for studying.`

    const userPrompt = `Create comprehensive study notes for:
- Subject: ${data.subject}
- Topic: ${data.topic}
- Grade Level: ${data.grade}
- Content to summarize: ${data.content}
${data.format ? `- Preferred Format: ${data.format}` : ''}

Transform this content into effective study notes that will help students learn and remember the material.`

    const messages: OpenAIMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ]

    return await this.generateText(messages)
  }

  /**
   * Generate student insights and recommendations
   */
  static async generateStudentInsights(studentData: any): Promise<string> {
    const systemPrompt = `You are an AI educational analyst providing personalized insights for students. Write in a warm, conversational tone — like a mentor speaking directly to the student. Do NOT use markdown formatting, asterisks, headers, or bullet symbols. Write in plain flowing paragraphs. Return a JSON object with these exact keys: strengths (array of strings), areasForImprovement (array of strings), recommendedFocus (array of strings), nextSteps (array of strings), learningStyle (string), currentLevel (string).`

    const userPrompt = `Analyze this student's data and provide comprehensive insights and recommendations:

${JSON.stringify(studentData, null, 2)}

Focus on actionable insights that will help improve their learning outcomes.`

    const messages: OpenAIMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ]

    return await this.generateText(messages)
  }

  /**
   * Generate AI tutor responses
   */
  static async generateAITutorResponse(data: {
    studentName: string
    question: string
    subject?: string
    context?: any
    sessionType?: string
  }): Promise<string> {
    const systemPrompt = `You are ${data.studentName}'s personal AI tutor! You're knowledgeable, patient, encouraging, and always ready to help them learn and grow.

Your personality:
- Warm, friendly, and encouraging
- Patient and understanding
- Enthusiastic about learning
- Supportive and motivating
- Clear and helpful in explanations
- Celebrates progress and effort

Your teaching approach:
- Break down complex concepts into simple steps
- Use examples and analogies they can relate to
- Ask guiding questions to help them think
- Provide positive reinforcement
- Adapt to their learning style and pace
- Make learning fun and engaging

IMPORTANT: Write in plain, conversational language. Do NOT use markdown formatting like **bold**, ## headers, bullet points with asterisks, or any symbols. Just write naturally as you would speak to a student. Use their name, show enthusiasm, and make them feel supported.`

    const userPrompt = `Student: ${data.studentName}
${data.subject ? `Subject: ${data.subject}` : ''}
${data.sessionType ? `Session Type: ${data.sessionType}` : ''}
Question/Request: ${data.question}
${data.context ? `Context: ${JSON.stringify(data.context)}` : ''}

Provide a helpful, encouraging response that addresses their question and supports their learning journey.`

    const messages: OpenAIMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ]

    return await this.generateText(messages)
  }

  /**
   * Generate educational resources
   */
  static async generateEducationalResource(data: {
    type: string
    topic: string
    subject: string
    grade: string
    format?: string
  }): Promise<string> {
    const systemPrompt = `You are an expert educational resource creator. Generate high-quality educational materials that are engaging, informative, and appropriate for the specified grade level.

Create resources that:
- Are pedagogically sound
- Match the grade level and subject
- Include interactive elements when appropriate
- Are well-structured and organized
- Support different learning styles
- Include clear objectives and outcomes
- Are practical and implementable`

    const userPrompt = `Create a ${data.type} resource for ${data.topic} in ${data.subject} for grade ${data.grade}. The resource should be comprehensive and help the student understand the topic thoroughly.`

    const messages: OpenAIMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ]

    return await this.generateText(messages)
  }

  /**
   * Generate general AI content
   */
  static async generateAIContent(prompt: string, options?: {
    maxTokens?: number
    temperature?: number
    model?: string
  }): Promise<string> {
    const messages: OpenAIMessage[] = [
      { role: 'user', content: prompt }
    ]

    return await this.generateText(messages, options)
  }

  /**
   * Grade student submissions
   */
  static async gradeSubmission(input: {
    assignmentTitle: string
    assignmentInstructions: string
    submissionContent: string
    rubric?: string
    maxPoints?: number
    answerKey?: string
  }): Promise<{ 
    grade: number; 
    feedback: string; 
    confidence: number;
    questionScores?: Array<{ questionId: string; score: number; feedback: string }>;
    needsRevision: boolean;
    revisionNotes?: string;
  }> {
    const systemPrompt = `You are an expert educator grading student submissions. Provide fair, constructive, and detailed feedback that helps students learn and improve. Write feedback in plain, conversational language — no markdown, no asterisks, no headers. Just clear, encouraging sentences a student can easily read.

Return JSON with this exact structure:
{
  "grade": 0-100,
  "feedback": "plain text feedback here",
  "confidence": 0-1,
  "questionScores": [
    {
      "questionId": "1",
      "score": 0-100,
      "feedback": "specific feedback for this question"
    }
  ],
  "needsRevision": true/false,
  "revisionNotes": "notes on what to revise (if applicable)"
}`

    const userPrompt = `Grade this student submission:

Assignment: ${input.assignmentTitle}
Instructions: ${input.assignmentInstructions}
${input.rubric ? `Rubric: ${input.rubric}` : ''}
${input.answerKey ? `Answer Key: ${input.answerKey}` : ''}
Max Points: ${input.maxPoints || 100}

Student Submission:
${input.submissionContent}

Provide a grade (0-${input.maxPoints || 100}), detailed feedback, confidence score, question-by-question scores, and revision notes if needed.`

    const messages: OpenAIMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ]

    const response = await this.generateText(messages)
    
    try {
      return JSON.parse(response)
    } catch (error) {
      // Fallback if JSON parsing fails
      return {
        grade: 0,
        feedback: response,
        confidence: 0,
        questionScores: [],
        needsRevision: true,
        revisionNotes: "AI grading failed. Please review manually."
      }
    }
  }

  /**
   * Generate presentations
   */
  static async generatePresentation(data: {
    topic: string
    subject: string
    grade: string
    slides: number
    style?: string
  }): Promise<any> {
    const systemPrompt = `You are an expert presentation creator for educational content. Create engaging, well-structured presentations that effectively communicate information to students.

Create presentations that:
- Have clear, logical flow
- Include engaging titles and content
- Use appropriate language for the grade level
- Include interactive elements and questions
- Have visual descriptions for slides
- Follow best practices for educational presentations`

    const userPrompt = `Create a ${data.slides}-slide presentation about ${data.topic} for ${data.subject} at grade ${data.grade} level.
${data.style ? `Style: ${data.style}` : ''}

Return a JSON structure with slides containing title, content, and visual descriptions.`

    const messages: OpenAIMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ]

    const response = await this.generateText(messages)
    
    try {
      return JSON.parse(response)
    } catch (error) {
      // Fallback structure if JSON parsing fails
      return {
        title: data.topic,
        slides: [
          {
            title: data.topic,
            content: response,
            notes: 'Generated presentation content'
          }
        ]
      }
    }
  }

  /**
   * Generate rubrics
   */
  static async generateRubric(data: {
    assignmentType: string
    subject: string
    grade: string
    criteria: string[]
    levels?: number
  }): Promise<any> {
    const systemPrompt = `You are an expert educator creating assessment rubrics. Create clear, comprehensive rubrics that help evaluate student work fairly and provide meaningful feedback.

Create rubrics that:
- Have clear performance levels
- Include specific criteria and descriptors
- Are appropriate for the grade level
- Provide actionable feedback
- Support learning objectives
- Are easy to understand and use`

    const userPrompt = `Create a rubric for a ${data.assignmentType} in ${data.subject} for grade ${data.grade}.
Criteria to include: ${data.criteria.join(', ')}
Performance levels: ${data.levels || 4}

Return a structured rubric in JSON format.`

    const messages: OpenAIMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ]

    const response = await this.generateText(messages)
    
    try {
      return JSON.parse(response)
    } catch (error) {
      // Fallback structure if JSON parsing fails
      return {
        title: `${data.assignmentType} Rubric`,
        criteria: data.criteria.map(criterion => ({
          name: criterion,
          description: 'Assessment criterion',
          levels: Array.from({ length: data.levels || 4 }, (_, i) => ({
            level: i + 1,
            description: `Level ${i + 1} performance`
          }))
        }))
      }
    }
  }
}

// Export for backward compatibility
export const generateAIContent = OpenAIService.generateAIContent
export default OpenAIService