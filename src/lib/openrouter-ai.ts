import { OpenAIService } from './openai-service'

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY || ''
const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1'

interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface OpenAIResponse {
  choices: Array<{
    message: {
      content: string
    }
  }>
}

export class OpenAIAI {
  private static async makeRequest(messages: OpenAIMessage[], model: string = 'meta-llama/llama-3.1-8b-instruct') {
    try {
      console.log('Making OpenAI API request to:', `${OPENROUTER_BASE_URL}/chat/completions`)
      console.log('Using model:', 'meta-llama/llama-3.1-8b-instruct')
      
      const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'http://localhost:3000',
          'X-Title': 'EduGenius AI'
        },
        body: JSON.stringify({
          model: 'meta-llama/llama-3.1-8b-instruct',
          messages,
          temperature: 0.7,
          max_tokens: 2000
        })
      })

      console.log('OpenAI API response status:', response.status)
      console.log('OpenAI API response headers:', Object.fromEntries(response.headers.entries()))

      if (!response.ok) {
        const errorText = await response.text()
        console.error('OpenAI API error response:', errorText)
        throw new Error(`OpenAI API error: ${response.status} ${response.statusText} - ${errorText}`)
      }

      const data: OpenAIResponse = await response.json()
      console.log('OpenAI API success, response length:', data.choices?.[0]?.message?.content?.length || 0)
      return data.choices[0]?.message?.content || 'No response generated'
    } catch (error) {
      console.error('OpenAI API error:', error)
      throw error
    }
  }

  static async generateLessonContent(lessonPlan: any, studentLevel: string, learningStyle: string): Promise<string> {
    const systemPrompt = `You are an AI tutor for EduGenius, an educational platform. Your role is to create personalized, engaging lesson content based on teacher lesson plans and student profiles.

Key principles:
- Adapt content to the student's learning level (${studentLevel})
- Use the student's preferred learning style (${learningStyle})
- Make content interactive and engaging
- Include clear learning objectives
- Provide practical examples and exercises
- Use appropriate language for the grade level

Learning Styles:
- Visual: Use diagrams, charts, visual examples, and structured layouts
- Kinesthetic: Include hands-on activities, experiments, and interactive exercises
- Auditory: Focus on explanations, discussions, and audio-friendly content

Always structure your response as a complete lesson with clear sections.`

    const userPrompt = `Create a personalized lesson based on this teacher's lesson plan:

**Lesson Plan Details:**
- Title: ${lessonPlan.title}
- Subject: ${lessonPlan.subject}
- Grade: ${lessonPlan.grade}
- Content: ${JSON.stringify(lessonPlan.content)}

**Student Profile:**
- Learning Level: ${studentLevel}
- Learning Style: ${learningStyle}

Please generate a comprehensive, personalized lesson that adapts the teacher's content to this student's needs. Include:
1. Introduction and objectives
2. Main content sections
3. Interactive activities
4. Practice exercises
5. Summary and next steps

Format the response in markdown with clear headings and structure.`

    const messages: OpenAIMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ]

    return await this.makeRequest(messages)
  }

  static async generateAILesson(subject: string, topic: string, grade: string, difficulty: string, learningStyle: string): Promise<any> {
    const systemPrompt = `You are an AI tutor for EduGenius. Create a comprehensive AI-generated lesson that adapts to the student's learning style and level.

Key requirements:
- Create engaging, educational content
- Adapt to learning style: ${learningStyle}
- Match difficulty level: ${difficulty}
- Appropriate for grade: ${grade}
- Include learning objectives, activities, and assessments
- Make it interactive and personalized

Return your response as a JSON object with this structure:
{
  "title": "Lesson title",
  "subject": "${subject}",
  "grade": "${grade}",
  "difficulty": "${difficulty}",
  "duration": 45,
  "type": "interactive",
  "estimatedTime": "45 min",
  "objectives": ["objective1", "objective2", "objective3"],
  "prerequisites": ["prerequisite1", "prerequisite2"],
  "insights": {
    "strengths": ["strength1", "strength2"],
    "areasForImprovement": ["area1", "area2"],
    "recommendedFocus": ["focus1", "focus2"],
    "nextSteps": ["step1", "step2"]
  },
  "content": "Detailed lesson content in markdown format"
}`

    const userPrompt = `Create an AI-generated lesson about "${topic}" in the subject "${subject}" for a ${grade} student with ${difficulty} difficulty level and ${learningStyle} learning style.

Make it comprehensive, engaging, and educational. Include practical examples, interactive elements, and clear learning objectives.`

    const messages: OpenAIMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ]

    const response = await this.makeRequest(messages)
    
    try {
      // Try to parse JSON response - look for JSON block
      const jsonMatch = response.match(/```json\s*(\{[\s\S]*?\})\s*```/) || response.match(/\{[\s\S]*?\}/)
      if (jsonMatch) {
        let jsonStr = jsonMatch[1] || jsonMatch[0]
        // Clean up the JSON string
        jsonStr = jsonStr.replace(/`/g, '').trim()
        
        // Try to fix incomplete JSON by adding missing closing braces
        const openBraces = (jsonStr.match(/\{/g) || []).length
        const closeBraces = (jsonStr.match(/\}/g) || []).length
        if (openBraces > closeBraces) {
          jsonStr += '}'.repeat(openBraces - closeBraces)
        }
        
        // Try to fix incomplete arrays
        if (jsonStr.includes('"objectives": [') && !jsonStr.includes(']')) {
          jsonStr = jsonStr.replace(/"objectives": \[[^]]*$/, '"objectives": []')
        }
        if (jsonStr.includes('"prerequisites": [') && !jsonStr.includes(']')) {
          jsonStr = jsonStr.replace(/"prerequisites": \[[^]]*$/, '"prerequisites": []')
        }
        
        return JSON.parse(jsonStr)
      }
    } catch (error) {
      console.error('Failed to parse AI response as JSON:', error)
      console.log('Raw response:', response.substring(0, 500))
    }

    // Fallback if JSON parsing fails
    return {
      title: `${topic} - ${subject}`,
      subject,
      grade,
      difficulty,
      duration: 45,
      type: learningStyle === 'visual' ? 'video' : learningStyle === 'kinesthetic' ? 'interactive' : 'reading',
      estimatedTime: '45 min',
      objectives: [
        `Understand key concepts in ${topic}`,
        `Apply ${topic} knowledge to solve problems`,
        `Analyze and evaluate ${topic} scenarios`
      ],
      prerequisites: [
        'Basic understanding of the subject',
        'Willingness to learn and practice'
      ],
      insights: {
        strengths: ['Eager to learn', 'Good problem solving'],
        areasForImprovement: ['Need more practice', 'Focus on fundamentals'],
        recommendedFocus: [`Master ${topic} basics`, 'Practice regularly'],
        nextSteps: ['Complete exercises', 'Take assessment']
      },
      content: response
    }
  }

  static async generateAssessment(lessonPlan: any, assessmentType: string, questionCount: number): Promise<any> {
    const systemPrompt = `You are an AI tutor creating assessments for EduGenius. Generate a comprehensive assessment based on the lesson plan provided.

Requirements:
- Create ${questionCount} questions
- Mix of question types (multiple choice, short answer, essay)
- Appropriate difficulty for the grade level
- Cover all key learning objectives
- Include answer key and explanations

Return as JSON with this structure:
{
  "title": "Assessment title",
  "questions": [
    {
      "id": 1,
      "type": "multiple_choice",
      "question": "Question text",
      "options": ["A", "B", "C", "D"],
      "correctAnswer": "A",
      "explanation": "Why this is correct"
    }
  ],
  "totalPoints": 100,
  "timeLimit": 60
}`

    const userPrompt = `Create an assessment for this lesson plan:

**Lesson Plan:**
- Title: ${lessonPlan.title}
- Subject: ${lessonPlan.subject}
- Grade: ${lessonPlan.grade}
- Content: ${JSON.stringify(lessonPlan.content)}

**Assessment Requirements:**
- Type: ${assessmentType}
- Questions: ${questionCount}
- Cover all learning objectives
- Include various question types`

    const messages: OpenAIMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ]

    const response = await this.makeRequest(messages)
    
    try {
      const jsonMatch = response.match(/```json\s*(\{[\s\S]*?\})\s*```/) || response.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const jsonStr = jsonMatch[1] || jsonMatch[0]
        return JSON.parse(jsonStr)
      }
    } catch (error) {
      console.error('Failed to parse assessment response as JSON:', error)
      console.log('Raw response:', response.substring(0, 500))
    }

    // Fallback assessment
    return {
      title: `Assessment: ${lessonPlan.title}`,
      questions: [
        {
          id: 1,
          type: 'multiple_choice',
          question: `What is the main topic of this lesson?`,
          options: ['Option A', 'Option B', 'Option C', 'Option D'],
          correctAnswer: 'Option A',
          explanation: 'This is the correct answer because...'
        }
      ],
      totalPoints: 100,
      timeLimit: 60
    }
  }

  static async generateLessonNotes(lessonPlan: any, noteType: string): Promise<any> {
    const systemPrompt = `You are an AI tutor creating study notes for EduGenius. Generate comprehensive, well-structured notes based on the lesson plan.

Note types:
- summary: Key points and main concepts
- detailed: Comprehensive notes with examples
- study_guide: Organized for exam preparation
- quick_reference: Important facts and formulas

Structure your response as markdown with clear headings and bullet points.`

    const userPrompt = `Create ${noteType} notes for this lesson plan:

**Lesson Plan:**
- Title: ${lessonPlan.title}
- Subject: ${lessonPlan.subject}
- Grade: ${lessonPlan.grade}
- Content: ${JSON.stringify(lessonPlan.content)}

Make the notes clear, organized, and helpful for studying.`

    const messages: OpenAIMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ]

    const response = await this.makeRequest(messages)
    
    return {
      type: noteType,
      content: response,
      createdAt: new Date().toISOString()
    }
  }

  static async generateStudentInsights(studentData: any): Promise<any> {
    const systemPrompt = `You are an AI educational analyst for EduGenius. Analyze student data to provide personalized learning insights and recommendations.

Analyze the student's:
- Study patterns and habits
- Performance trends
- Learning preferences
- Areas of strength and improvement
- Recommended next steps

Return as JSON with this structure:
{
  "learningStyle": "visual|kinesthetic|auditory",
  "currentLevel": "beginner|intermediate|advanced",
  "strengths": ["strength1", "strength2"],
  "areasForImprovement": ["area1", "area2"],
  "recommendedFocus": ["focus1", "focus2"],
  "nextSteps": ["step1", "step2"],
  "studyPatterns": {
    "totalStudyTime": 0,
    "averageSessionTime": 0,
    "mostActiveSubject": "subject",
    "preferredStudyTime": "morning|afternoon|evening",
    "consistencyScore": 0
  },
  "performanceTrends": {
    "trend": "improving|stable|declining",
    "direction": "upward|stable|downward",
    "completionRate": 0
  },
  "personalizedRecommendations": ["rec1", "rec2", "rec3"]
}`

    const userPrompt = `Analyze this student's data and provide insights:

**Student Data:**
${JSON.stringify(studentData, null, 2)}

Provide personalized recommendations based on their learning patterns and performance.`

    const messages: OpenAIMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ]

    const response = await this.makeRequest(messages)
    
    try {
      const jsonMatch = response.match(/```json\s*(\{[\s\S]*?\})\s*```/) || response.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const jsonStr = jsonMatch[1] || jsonMatch[0]
        return JSON.parse(jsonStr)
      }
    } catch (error) {
      console.error('Failed to parse insights response as JSON:', error)
      console.log('Raw response:', response.substring(0, 500))
    }

    // Fallback insights
    return {
      learningStyle: 'visual',
      currentLevel: 'intermediate',
      strengths: ['Eager to learn', 'Good problem solving'],
      areasForImprovement: ['Need more practice', 'Focus on fundamentals'],
      recommendedFocus: ['Core concepts', 'Regular practice'],
      nextSteps: ['Complete current lessons', 'Take assessments'],
      studyPatterns: {
        totalStudyTime: 0,
        averageSessionTime: 0,
        mostActiveSubject: 'Mathematics',
        preferredStudyTime: 'afternoon',
        consistencyScore: 0
      },
      performanceTrends: {
        trend: 'stable',
        direction: 'stable',
        completionRate: 0
      },
      personalizedRecommendations: [
        'Set daily study goals',
        'Focus on challenging topics',
        'Use AI tutor for help'
      ]
    }
  }

  // Generate AI assignment
  static async generateAIAssignment(data: {
    subject: string
    topic: string
    difficulty: string
    duration: number
    description?: string
    studentLevel: string
    learningStyle: string
    studentName: string
  }): Promise<any> {
    const isMathSubject = data.subject.toLowerCase().includes('math') || 
                         data.subject.toLowerCase().includes('algebra') || 
                         data.subject.toLowerCase().includes('geometry') || 
                         data.subject.toLowerCase().includes('calculus') ||
                         data.subject.toLowerCase().includes('arithmetic');

    const systemPrompt = `You are a warm, friendly teacher creating personalized assignments for students. Your assignments should feel like a caring teacher is talking directly to the student.

Student Information:
- Name: ${data.studentName}
- Subject: ${data.subject}
- Topic: ${data.topic}
- Level: ${data.studentLevel}
- Learning Style: ${data.learningStyle}
- Difficulty: ${data.difficulty}
- Duration: ${data.duration} days

FORMATTING REQUIREMENTS:
1. Use warm, encouraging language
2. Include emojis in headings (📚 ✏️ 🤔 💪)
3. Address the student directly ("you", "your")
4. Add encouraging phrases throughout
5. Make it visually friendly with clear sections

${isMathSubject ? `
MATHEMATICS ASSIGNMENT FORMAT:
- Include 8-12 clear mathematical problems
- Use proper mathematical notation
- Show problems like: "Question 1: Calculate 25 × 4 = _____"
- Include word problems with real-life scenarios
- Add "Show your work" reminders
- Mix problem types: calculations, word problems, applications
- Include one challenge problem for extra credit
` : ''}

Create an assignment in the following JSON format:
{
  "title": "Friendly, engaging title",
  "description": "Warm introduction that motivates the student",
  "instructions": "Step-by-step instructions in friendly language",
  "objectives": ["What you'll learn 1", "What you'll learn 2", "What you'll learn 3"],
  "requirements": ["What you need", "How to submit"],
  "resources": ["Helpful resource 1", "Helpful resource 2"],
  "rubric": {
    "excellent": "Amazing work! You've mastered this!",
    "good": "Great job! You're doing well!",
    "satisfactory": "Good effort! Keep practicing!",
    "needsImprovement": "You're learning! Let's work on this together."
  },
  "content": "Full assignment with warm greeting, clear questions/problems, and encouraging closing",
  "estimatedTime": "${data.duration} days",
  "difficulty": "${data.difficulty}",
  "learningOutcomes": ["Skill you'll develop 1", "Skill you'll develop 2"]
}`

    const userPrompt = `Create a warm, friendly, and engaging assignment for ${data.studentName} about ${data.topic} in ${data.subject}. Make it feel personal and encouraging. Use ${data.learningStyle} learning approaches. The assignment should be ${data.difficulty} level and take about ${data.duration} days to complete.

${data.description ? `Teacher's special notes: ${data.description}` : ''}

Remember: Be warm, encouraging, and make the student feel supported!`

    const messages: OpenAIMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ]

    const response = await this.makeRequest(messages)
    
    try {
      // Try to parse JSON response - look for JSON block
      const jsonMatch = response.match(/```json\s*(\{[\s\S]*?\})\s*```/) || response.match(/\{[\s\S]*?\}/)
      if (jsonMatch) {
        let jsonStr = jsonMatch[1] || jsonMatch[0]
        // Clean up the JSON string
        jsonStr = jsonStr.replace(/`/g, '').trim()
        
        // Try to fix incomplete JSON by adding missing closing braces
        const openBraces = (jsonStr.match(/\{/g) || []).length
        const closeBraces = (jsonStr.match(/\}/g) || []).length
        if (openBraces > closeBraces) {
          jsonStr += '}'.repeat(openBraces - closeBraces)
        }
        
        return JSON.parse(jsonStr)
      }
    } catch (error) {
      console.error('Failed to parse AI response as JSON:', error)
      console.log('Raw response:', response.substring(0, 500))
    }

    // Fallback if JSON parsing fails
    return {
      title: `${data.topic} - ${data.subject} Assignment`,
      description: `Complete this assignment on ${data.topic} in ${data.subject}`,
      instructions: `1. Research the topic thoroughly\n2. Complete all required tasks\n3. Submit your work on time`,
      objectives: [`Understand ${data.topic}`, `Apply knowledge practically`, `Demonstrate learning`],
      requirements: ['Original work', 'Proper citations', 'On-time submission'],
      resources: ['Textbook', 'Online resources', 'Library materials'],
      rubric: {
        excellent: 'Exceeds expectations',
        good: 'Meets expectations',
        satisfactory: 'Meets basic requirements',
        needsImprovement: 'Below expectations'
      },
      content: `This assignment focuses on ${data.topic} in ${data.subject}. You will explore key concepts and apply your knowledge.`,
      estimatedTime: `${data.duration} days`,
      difficulty: data.difficulty,
      learningOutcomes: ['Enhanced understanding', 'Practical application', 'Critical thinking']
    }
  }

  // Generate AI Teacher Insights
  static async generateAITeacherInsights(studentData: any): Promise<any> {
    const systemPrompt = `You are an AI Teacher with full access to all teaching materials including lesson plans, schemes of work, and curriculum. You act as the primary teacher for the student, using all available materials to provide comprehensive teaching and ensure student understanding.

Student Information:
- Name: ${studentData.name}
- Grade Level: ${studentData.gradeLevel}
- Subjects: ${studentData.subjects.join(', ')}
- Recent Performance: ${studentData.recentPerformance}%
- Study Time: ${studentData.studyTime} minutes
- Completed Assignments: ${studentData.completedAssignments}
- Pending Assignments: ${studentData.pendingAssignments}

Available Teaching Materials:
- Schemes of Work: ${studentData.teacherMaterials.schemesOfWork.length} schemes
- Lesson Plans: ${studentData.teacherMaterials.lessonPlans.length} plans
- Shared Schemes: ${studentData.teacherMaterials.sharedSchemes.length} schemes
- Shared Lesson Plans: ${studentData.teacherMaterials.sharedLessonPlans.length} plans

Recent Activity:
- Study Sessions: ${studentData.recentActivity.studySessions.length} sessions
- AI Sessions: ${studentData.recentActivity.aiSessions.length} sessions

As the AI Teacher, analyze this data and provide comprehensive insights in the following JSON format:
{
  "currentLesson": {
    "title": "Current lesson title based on curriculum",
    "subject": "Subject name",
    "objectives": ["objective1", "objective2", "objective3"],
    "progress": 0-100,
    "nextSteps": ["step1", "step2", "step3"]
  },
  "learningPath": {
    "completed": ["completed topic1", "completed topic2"],
    "current": "current topic being studied",
    "upcoming": ["upcoming topic1", "upcoming topic2", "upcoming topic3"]
  },
  "personalizedRecommendations": {
    "focusAreas": ["area1", "area2", "area3"],
    "studyMethods": ["method1", "method2", "method3"],
    "timeAllocation": ["allocation1", "allocation2"],
    "resources": ["resource1", "resource2", "resource3"]
  },
  "performanceAnalysis": {
    "strengths": ["strength1", "strength2", "strength3"],
    "improvements": ["improvement1", "improvement2", "improvement3"],
    "trends": "performance trend analysis",
    "predictions": ["prediction1", "prediction2", "prediction3"]
  },
  "aiTeachingPlan": {
    "today": ["today's focus1", "today's focus2", "today's focus3"],
    "thisWeek": ["week's goal1", "week's goal2", "week's goal3"],
    "thisMonth": ["month's objective1", "month's objective2", "month's objective3"]
  }
}`

    const userPrompt = `Based on the student's data and available teaching materials, provide comprehensive AI teacher insights. Focus on creating a personalized learning experience that uses all available curriculum materials to ensure the student's success.`

    const messages: OpenAIMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ]

    const response = await this.makeRequest(messages)
    
    try {
      // Try to parse JSON response - look for JSON block
      const jsonMatch = response.match(/```json\s*(\{[\s\S]*?\})\s*```/) || response.match(/\{[\s\S]*?\}/)
      if (jsonMatch) {
        let jsonStr = jsonMatch[1] || jsonMatch[0]
        // Clean up the JSON string
        jsonStr = jsonStr.replace(/`/g, '').trim()
        
        // Try to fix incomplete JSON by adding missing closing braces
        const openBraces = (jsonStr.match(/\{/g) || []).length
        const closeBraces = (jsonStr.match(/\}/g) || []).length
        if (openBraces > closeBraces) {
          jsonStr += '}'.repeat(openBraces - closeBraces)
        }
        
        return JSON.parse(jsonStr)
      }
    } catch (error) {
      console.error('Failed to parse AI response as JSON:', error)
      console.log('Raw response:', response.substring(0, 500))
    }

    // Fallback if JSON parsing fails
    return {
      currentLesson: {
        title: "Introduction to Core Concepts",
        subject: studentData.subjects[0] || "Mathematics",
        objectives: ["Understand basic concepts", "Apply knowledge practically", "Demonstrate understanding"],
        progress: 25,
        nextSteps: ["Review previous lessons", "Complete practice exercises", "Take assessment"]
      },
      learningPath: {
        completed: ["Basic Concepts", "Introduction"],
        current: "Core Learning",
        upcoming: ["Advanced Topics", "Practical Application", "Assessment"]
      },
      personalizedRecommendations: {
        focusAreas: ["Core concepts", "Practice problems", "Regular review"],
        studyMethods: ["Visual learning", "Practice exercises", "AI tutoring"],
        timeAllocation: ["2 hours daily study", "1 hour practice", "30 minutes review"],
        resources: ["Textbook", "AI tutor", "Practice materials"]
      },
      performanceAnalysis: {
        strengths: ["Good attendance", "Eager to learn", "Regular practice"],
        improvements: ["Focus on fundamentals", "More practice needed", "Time management"],
        trends: "Steady improvement",
        predictions: ["Good progress expected", "Focus on weak areas", "Regular practice needed"]
      },
      aiTeachingPlan: {
        today: ["Review current lesson", "Complete exercises", "Prepare for next topic"],
        thisWeek: ["Master current concepts", "Complete assignments", "Prepare for assessment"],
        thisMonth: ["Complete curriculum unit", "Take comprehensive test", "Move to next level"]
      }
    }
  }

  // Generate AI Tutor Response
  static async generateAITutorResponse(context: any): Promise<string> {
    const systemPrompt = `You are a warm, engaging, and highly knowledgeable AI Teacher named "Teacher Hope" who genuinely cares about student success. You have full access to all teaching materials including lesson plans, schemes of work, and curriculum.

🎓 YOUR TEACHING PERSONALITY:
- Warm and approachable, like a favorite teacher students love
- Enthusiastic about the subject matter - your passion is contagious!
- Patient and understanding - every student learns at their own pace
- Encouraging and supportive - celebrate small wins and progress
- Use friendly, conversational language while maintaining professionalism
- Occasionally use emojis to make learning fun (but not excessively)
- Share relatable examples and real-world connections
- Show genuine interest in the student's learning journey

👨‍🎓 STUDENT PROFILE:
- Name: ${context.student.name}
- Grade Level: ${context.student.grade}
- Subjects: ${context.student.subjects.join(', ')}
- Teacher: ${context.student.teacher}

📚 AVAILABLE TEACHING MATERIALS:
- Schemes of Work: ${context.availableMaterials.schemesOfWork.length} schemes
- Lesson Plans: ${context.availableMaterials.lessonPlans.length} plans
- Shared Materials: ${context.availableMaterials.sharedSchemes.length + context.availableMaterials.sharedLessonPlans.length} resources

📖 CURRENT SESSION:
- Type: ${context.sessionType}
- Subject: ${context.subject || 'General'}
- Topic: ${context.topic || 'Open discussion'}
- Student's Question: "${context.question}"

🎯 YOUR TEACHING APPROACH:

1. **GREET WARMLY**: Start with a friendly greeting using their name
2. **ACKNOWLEDGE**: Show you understand their question/concern
3. **TEACH ENGAGINGLY**: 
   - Break down complex concepts into bite-sized pieces
   - Use analogies and real-world examples they can relate to
   - Tell mini-stories or scenarios to illustrate points
   - Ask thought-provoking questions to check understanding
4. **INTERACT**: 
   - Encourage them to think critically
   - Ask "What do you think?" or "Can you guess why?"
   - Make it a conversation, not a lecture
5. **PROVIDE EXAMPLES**: Give 2-3 clear, practical examples
6. **CHECK UNDERSTANDING**: Ask if they'd like clarification
7. **ENCOURAGE**: Praise their curiosity and effort
8. **GUIDE NEXT STEPS**: Suggest what to explore next

💡 TEACHING STYLE:
- Start lessons with an engaging hook or interesting fact
- Use storytelling to make concepts memorable
- Include "Did you know?" moments to spark curiosity
- Break content into clear sections with friendly headings
- Use bullet points and numbered lists for clarity
- Include practice questions or quick challenges
- End with encouragement and next steps
- Offer to explain differently if they're confused

🌟 REMEMBER:
- You're not just answering questions - you're inspiring learning!
- Make every interaction feel personal and supportive
- Celebrate their progress, no matter how small
- Be patient - confusion is part of learning
- Use the curriculum materials to provide accurate, aligned content
- Make learning feel like an exciting adventure, not a chore

Respond as if you're sitting next to the student, having a friendly conversation while teaching them something amazing!`

    const userPrompt = `${context.student.name} just asked you: "${context.question}"

📊 STUDENT'S RECENT ACTIVITY:
${JSON.stringify(context.currentContext, null, 2)}

📚 TEACHING MATERIALS YOU CAN REFERENCE:
${JSON.stringify(context.availableMaterials, null, 2)}

🎯 YOUR TASK:
Respond as Teacher Hope - warm, engaging, and genuinely excited to help ${context.student.name} learn!

Structure your response like this:

**1. WARM GREETING** (1-2 sentences)
Greet them by name and acknowledge their question positively

**2. ENGAGING INTRODUCTION** (2-3 sentences)
Hook their interest with a relatable example, interesting fact, or real-world connection

**3. CLEAR EXPLANATION** (Main content)
- Break down the concept step-by-step
- Use simple language and analogies
- Include 2-3 concrete examples
- Add "💡 Pro Tip:" or "🤔 Think about it:" callouts

**4. INTERACTIVE ELEMENT** (1-2 questions)
Ask them a question to check understanding or encourage critical thinking

**5. PRACTICE/APPLICATION** (Optional)
Suggest a quick exercise or way to apply what they learned

**6. ENCOURAGEMENT & NEXT STEPS** (2-3 sentences)
- Praise their curiosity
- Suggest what to explore next
- Offer continued support

Remember: Be conversational, warm, and make learning feel exciting! Use their name, show enthusiasm, and make them feel supported. You're not just teaching - you're inspiring! 🌟`

    const messages: OpenAIMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ]

    try {
      const response = await this.makeRequest(messages)
      return response
    } catch (error) {
      console.error('Error generating AI tutor response:', error)
      
      // Enhanced fallback response based on session type
      const fallbackResponses = {
        lesson: `Hi ${context.student.name}! I'm here to help you understand ${context.topic || context.subject || 'this topic'}.

Your question: "${context.question}"

This is a great question that shows you are thinking critically about the material. Let me break this down for you:

1. **Key Concept**: ${context.topic || 'The topic you are asking about'} is an important part of ${context.subject || 'your studies'}.

2. **Explanation**: Based on your curriculum, this concept relates to several important learning objectives. Let me explain it step by step.

3. **Examples**: Here are some practical examples to help you understand better.

4. **Practice**: I recommend trying some exercises to reinforce your understanding.

5. **Next Steps**: Continue exploring related topics and don't hesitate to ask follow-up questions.

Would you like me to elaborate on any specific part or help you with related concepts?`,

        assignment_help: `Hi ${context.student.name}! I can definitely help you with this assignment.

Your question: "${context.question}"

Let me guide you through this step by step:

1. **Understanding the Requirements**: First, let's make sure you understand what's being asked.

2. **Planning Your Approach**: Here's how I recommend structuring your work.

3. **Key Points to Cover**: Based on your curriculum, these are the essential elements to include.

4. **Resources to Use**: Here are some materials that will help you succeed.

5. **Common Pitfalls**: Watch out for these common mistakes.

6. **Quality Checklist**: Before submitting, make sure you've covered these points.

Remember, I'm here to help you learn and succeed. Feel free to ask for clarification on any part!`,

        progress_review: `Hi ${context.student.name}! Let me review your progress and help you continue growing.

Your question: "${context.question}"

Based on your recent activity and performance, here's what I've observed:

1. **Strengths**: You've been doing well in these areas...
2. **Areas for Growth**: Here are some areas where you can continue improving...
3. **Learning Style**: I've noticed you learn best when...
4. **Recommendations**: Here's what I suggest for your continued success...
5. **Goals**: Let's set some specific learning goals for the next period.

Your dedication to learning is commendable! Keep up the great work and remember that every question you ask shows your commitment to understanding.`,

        general_help: `Hi ${context.student.name}! I'm here to help you with your studies.

Your question: "${context.question}"

This is an excellent question! Let me provide you with comprehensive guidance:

1. **Understanding the Topic**: Let me explain this concept clearly.
2. **Why It Matters**: This is important because...
3. **How to Learn It**: Here's the best way to approach this topic.
4. **Practical Applications**: You can use this knowledge in...
5. **Study Tips**: Here are some strategies that work well for this type of content.
6. **Resources**: Here are additional materials that will help you.

Remember, there's no such thing as a silly question. Every question you ask helps you learn and grow. Keep asking, keep learning, and keep succeeding!`
      }

      const baseResponse = fallbackResponses[context.sessionType as keyof typeof fallbackResponses] || fallbackResponses.general_help
      
      return baseResponse
    }
  }

  // Generate AI Resource
  static async generateAIResource(data: {
    type: string
    subject: string
    topic: string
    grade: string
    description: string
    studentName: string
    studentLevel: string
    availableMaterials: any
  }): Promise<any> {
    const systemPrompt = `You are an AI Teacher creating educational resources for students. Generate comprehensive, well-structured educational content that helps students learn effectively.

Student Information:
- Name: ${data.studentName}
- Grade Level: ${data.studentLevel}
- Subject: ${data.subject}
- Topic: ${data.topic}
- Resource Type: ${data.type}
- Description: ${data.description}

Available Teaching Materials:
- Schemes of Work: ${data.availableMaterials.schemesOfWork.length} schemes
- Lesson Plans: ${data.availableMaterials.lessonPlans.length} plans

Create a comprehensive educational resource in the following JSON format:
{
  "title": "Engaging resource title",
  "content": "Detailed educational content in markdown format",
  "tags": ["tag1", "tag2", "tag3"],
  "difficulty": "beginner|intermediate|advanced",
  "duration": "estimated time to complete",
  "learningObjectives": ["objective1", "objective2", "objective3"],
  "prerequisites": ["prerequisite1", "prerequisite2"],
  "keyPoints": ["key point 1", "key point 2", "key point 3"],
  "examples": ["example1", "example2"],
  "practiceQuestions": ["question1", "question2", "question3"],
  "summary": "Brief summary of the resource"
}

Make the content:
- Age-appropriate for the grade level
- Engaging and easy to understand
- Well-structured with clear headings
- Include practical examples and exercises
- Use markdown formatting for better readability
- Include visual elements descriptions where helpful`

    const userPrompt = `Create a ${data.type} resource for ${data.topic} in ${data.subject} for grade ${data.grade}. The resource should be comprehensive and help the student understand the topic thoroughly.`

    const messages: OpenAIMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ]

    const response = await this.makeRequest(messages)
    
    try {
      // Try to parse JSON response - look for JSON block
      const jsonMatch = response.match(/```json\s*(\{[\s\S]*?\})\s*```/) || response.match(/\{[\s\S]*?\}/)
      if (jsonMatch) {
        let jsonStr = jsonMatch[1] || jsonMatch[0]
        // Clean up the JSON string
        jsonStr = jsonStr.replace(/`/g, '').trim()
        
        // Try to fix incomplete JSON by adding missing closing braces
        const openBraces = (jsonStr.match(/\{/g) || []).length
        const closeBraces = (jsonStr.match(/\}/g) || []).length
        if (openBraces > closeBraces) {
          jsonStr += '}'.repeat(openBraces - closeBraces)
        }
        
        return JSON.parse(jsonStr)
      }
    } catch (error) {
      console.error('Failed to parse AI response as JSON:', error)
      console.log('Raw response:', response.substring(0, 500))
    }

    // Fallback if JSON parsing fails
    return {
      title: `${data.topic} - ${data.subject} ${data.type}`,
      content: `# ${data.topic}\n\n## Overview\nThis resource covers ${data.topic} in ${data.subject} for grade ${data.grade}.\n\n## Key Concepts\n- Concept 1\n- Concept 2\n- Concept 3\n\n## Examples\n1. Example 1\n2. Example 2\n\n## Practice Questions\n1. Question 1\n2. Question 2\n\n## Summary\nThis resource provides a comprehensive understanding of ${data.topic}.`,
      tags: [data.subject.toLowerCase(), data.topic.toLowerCase(), data.type.toLowerCase()],
      difficulty: 'intermediate',
      duration: '30 minutes',
      learningObjectives: [`Understand ${data.topic}`, `Apply concepts practically`, `Demonstrate knowledge`],
      prerequisites: ['Basic understanding of the subject'],
      keyPoints: ['Key point 1', 'Key point 2', 'Key point 3'],
      examples: ['Example 1', 'Example 2'],
      practiceQuestions: ['Question 1', 'Question 2'],
      summary: `A comprehensive resource covering ${data.topic} in ${data.subject}.`
    }
  }

  // Generate AI content using OpenAI
  static async generateAIContent(prompt: string, options?: {
    maxTokens?: number
    temperature?: number
    model?: string
  }): Promise<string> {
    const messages: OpenAIMessage[] = [
      { role: 'user', content: prompt }
    ]

    return await this.makeRequest(messages, options?.model)
  }

  // Grade a student's submission against an assignment using OpenAI
  static async gradeSubmission(input: {
    assignmentTitle: string
    assignmentDescription?: string | null
    assignmentContent?: string | null
    rubric?: any
    studentAnswer: string
    subject?: string | null
    gradeLevel?: string | null
  }): Promise<{ grade: number; feedback: string }> {
    const systemPrompt = `You are an expert teacher. Grade student work fairly and consistently. Return only strict JSON.`

    const userPrompt = `Grade the following student's submission for the assignment.

Assignment:
Title: ${input.assignmentTitle}
Subject: ${input.subject || 'General'}
Grade Level: ${input.gradeLevel || 'Unknown'}
Description: ${input.assignmentDescription || 'N/A'}
Content:\n${(input.assignmentContent || '').slice(0, 6000)}
Rubric (if provided): ${input.rubric ? JSON.stringify(input.rubric).slice(0, 4000) : 'N/A'}

Student Submission:\n${input.studentAnswer.slice(0, 6000)}

Return JSON with shape { "grade": 0-100, "feedback": "specific, constructive feedback with strengths and improvements" }.`

    const messages: OpenAIMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ]

    const response = await this.makeRequest(messages)
    try {
      const jsonMatch = response.match(/```json\s*(\{[\s\S]*?\})\s*```/) || response.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const jsonStr = jsonMatch[1] || jsonMatch[0]
        const parsed = JSON.parse(jsonStr)
        const safeGrade = Math.max(0, Math.min(100, Number(parsed.grade) || 0))
        const feedback = String(parsed.feedback || 'Good effort!')
        return { grade: safeGrade, feedback }
      }
    } catch (e) {
      console.error('Failed to parse grading JSON:', e)
    }
    return { grade: 0, feedback: 'Unable to auto-grade. Teacher will review.' }
  }
}

// Export the generateAIContent function for backward compatibility
export const generateAIContent = OpenAIService.generateAIContent
