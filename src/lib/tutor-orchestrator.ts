/**
 * AUTONOMOUS AI TUTOR ORCHESTRATOR
 * 
 * This is the brain of the autonomous tutoring system.
 * It decides what to teach, when to teach, and how to adapt to student needs.
 */

import { prisma } from '@/lib/prisma'
import { OpenAIService } from '@/lib/openai-service'

// ============================================
// TYPES
// ============================================

export interface TutorTask {
  subject: string
  topic: string
  mode: 'teach' | 'practice' | 'quiz' | 'revise'
  objective: string
  estimatedMinutes: number
  difficulty: 'easy' | 'medium' | 'hard'
  context: {
    lessonPlanId?: string
    schemeOfWorkId?: string
    scheduleSlot?: any
    masteryScore?: number
  }
}

export interface TutorResponse {
  message: string
  nextAction: {
    type: 'question' | 'explanation' | 'hint' | 'feedback' | 'complete'
    data?: any
  }
  progress: number
  xpEarned: number
}

export interface SubmitAnswerResult {
  isCorrect: boolean
  scoreDelta: number
  feedback: string
  hint?: string
  nextMode: string
  nextQuestion?: any
  masteryScore: number
  xpEarned: number
}

// ============================================
// MAIN ORCHESTRATOR CLASS
// ============================================

export class TutorOrchestrator {
  private studentId: string
  private classId: string

  constructor(studentId: string, classId: string) {
    this.studentId = studentId
    this.classId = classId
  }

  /**
   * STEP 1: Determine what to teach NOW
   * Based on: schedule + lesson plan + scheme + mastery
   */
  async getNextTask(): Promise<TutorTask> {
    // Get student info
    const student = await prisma.student.findUnique({
      where: { id: this.studentId },
      include: {
        class: true,
        teacher: true
      }
    })

    if (!student || !student.classId) {
      throw new Error('Student or class not found')
    }

    // STEP A: Check current schedule slot
    const now = new Date()
    const dayOfWeek = now.getDay()
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`

    const scheduleSlot = await prisma.classSchedule.findFirst({
      where: {
        classId: student.classId,
        dayOfWeek: dayOfWeek,
        isActive: true,
        startTime: { lte: currentTime },
        endTime: { gte: currentTime }
      }
    })

    let subject = scheduleSlot?.subject || 'General'
    let topic = 'Introduction'
    let lessonPlanId: string | undefined
    let schemeOfWorkId: string | undefined

    // STEP B: Get lesson plan for today OR scheme of work for this week
    if (student.teacherId) {
      // Try to find today's lesson plan
      const todayStart = new Date(now.setHours(0, 0, 0, 0))
      const todayEnd = new Date(now.setHours(23, 59, 59, 999))

      const lessonPlan = await prisma.lessonPlan.findFirst({
        where: {
          teacherId: student.teacherId,
          subject: subject,
          createdAt: {
            gte: todayStart,
            lte: todayEnd
          }
        },
        include: {
          schemeOfWork: true
        }
      })

      if (lessonPlan) {
        topic = lessonPlan.title
        lessonPlanId = lessonPlan.id
        schemeOfWorkId = lessonPlan.schemeOfWorkId || undefined
      } else {
        // Fall back to scheme of work
        const scheme = await prisma.schemeOfWork.findFirst({
          where: {
            teacherId: student.teacherId,
            subject: subject
          },
          orderBy: {
            createdAt: 'desc'
          }
        })

        if (scheme) {
          schemeOfWorkId = scheme.id
          topic = scheme.title
        }
      }
    }

    // STEP C: Check student's mastery for this topic
    const progress = await prisma.studentProgress.findFirst({
      where: {
        studentId: this.studentId,
        classId: student.classId,
        subject: subject,
        topic: topic
      }
    })

    const masteryScore = progress?.masteryScore || 0
    let mode: 'teach' | 'practice' | 'quiz' | 'revise' = 'teach'
    let difficulty: 'easy' | 'medium' | 'hard' = 'medium'

    // STEP D: Adapt based on mastery
    if (masteryScore < 40) {
      mode = 'teach'
      difficulty = 'easy'
    } else if (masteryScore < 75) {
      mode = 'practice'
      difficulty = 'medium'
    } else {
      mode = 'quiz'
      difficulty = 'hard'
    }

    return {
      subject,
      topic,
      mode,
      objective: `Master ${topic} in ${subject}`,
      estimatedMinutes: 10,
      difficulty,
      context: {
        lessonPlanId,
        schemeOfWorkId,
        scheduleSlot,
        masteryScore
      }
    }
  }

  /**
   * STEP 2: Generate tutor message with context
   */
  async generateMessage(
    userMessage: string,
    task: TutorTask,
    sessionId?: string
  ): Promise<TutorResponse> {
    // Get or create session
    let session = sessionId
      ? await prisma.tutorSession.findUnique({ where: { id: sessionId } })
      : null

    if (!session) {
      session = await prisma.tutorSession.create({
        data: {
          studentId: this.studentId,
          classId: this.classId,
          subject: task.subject,
          topic: task.topic,
          mode: task.mode,
          last10Messages: [],
          lessonPlanId: task.context.lessonPlanId,
          schemeOfWorkId: task.context.schemeOfWorkId
        }
      })
    }

    // Get teacher content for context
    const context = await this.getTeacherContext(task)

    // Build AI prompt
    const systemPrompt = this.buildSystemPrompt(task, context)
    const conversationHistory = (session.last10Messages as any[]) || []

    // Call AI with better parameters for natural conversation
    const aiResponse = await OpenAIService.generateText([
      { role: 'system', content: systemPrompt },
      ...conversationHistory.slice(-10),
      { role: 'user', content: userMessage }
    ], {
      model: 'gpt-4o-mini',
      temperature: 0.8, // More creative and natural
      maxTokens: 800 // Allow longer, more complete responses
    })

    const message = aiResponse || 'I can help you learn!'

    // Update session
    const updatedMessages = [
      ...conversationHistory,
      { role: 'user', content: userMessage },
      { role: 'assistant', content: message }
    ].slice(-10)

    await prisma.tutorSession.update({
      where: { id: session.id },
      data: {
        last10Messages: updatedMessages,
        questionsAsked: session.questionsAsked + 1,
        timeSpent: session.timeSpent + 60,
        updatedAt: new Date()
      }
    })

    return {
      message,
      nextAction: {
        type: 'question',
        data: null
      },
      progress: session.progress,
      xpEarned: 0
    }
  }

  /**
   * STEP 3: Grade student answer and update mastery
   */
  async submitAnswer(
    sessionId: string,
    answer: string,
    questionId?: string
  ): Promise<SubmitAnswerResult> {
    const session = await prisma.tutorSession.findUnique({
      where: { id: sessionId }
    })

    if (!session) {
      throw new Error('Session not found')
    }

    // Get current question from session
    const currentQuestion = session.currentQuestion as any

    if (!currentQuestion) {
      throw new Error('No active question')
    }

    // Grade the answer using AI
    const grading = await this.gradeAnswer(
      currentQuestion.question,
      currentQuestion.correctAnswer,
      answer
    )

    // Update mastery score
    const progress = await this.updateMastery(
      session.subject,
      session.topic,
      grading.isCorrect
    )

    // Calculate XP
    const xpEarned = grading.isCorrect ? 10 : 2

    // Update session
    await prisma.tutorSession.update({
      where: { id: sessionId },
      data: {
        correctAnswers: grading.isCorrect
          ? session.correctAnswers + 1
          : session.correctAnswers,
        xpEarned: session.xpEarned + xpEarned,
        currentQuestion: null
      }
    })

    // Determine next mode
    let nextMode = session.mode
    if (progress.masteryScore >= 75) {
      nextMode = 'quiz'
    } else if (progress.masteryScore >= 40) {
      nextMode = 'practice'
    } else {
      nextMode = 'teach'
    }

    return {
      isCorrect: grading.isCorrect,
      scoreDelta: grading.isCorrect ? 5 : -3,
      feedback: grading.feedback,
      hint: grading.hint,
      nextMode,
      nextQuestion: null, // Will be generated in next call
      masteryScore: progress.masteryScore,
      xpEarned
    }
  }

  // ============================================
  // HELPER METHODS
  // ============================================

  private async getTeacherContext(task: TutorTask) {
    const context: any = {}

    // Get lesson plan
    if (task.context.lessonPlanId) {
      const lessonPlan = await prisma.lessonPlan.findUnique({
        where: { id: task.context.lessonPlanId }
      })
      if (lessonPlan) {
        context.lessonPlan = JSON.parse(lessonPlan.content)
      }
    }

    // Get scheme of work
    if (task.context.schemeOfWorkId) {
      const scheme = await prisma.schemeOfWork.findUnique({
        where: { id: task.context.schemeOfWorkId }
      })
      if (scheme) {
        context.scheme = JSON.parse(scheme.content)
      }
    }

    return context
  }

  private buildSystemPrompt(task: TutorTask, context: any): string {
    const hasLessonPlan = context.lessonPlan && Object.keys(context.lessonPlan).length > 0
    const hasScheme = context.scheme && Object.keys(context.scheme).length > 0

    if (!hasLessonPlan && !hasScheme) {
      // General tutoring mode - no specific lesson plan
      return `You are a friendly, knowledgeable AI tutor helping a student learn ${task.subject}.

🎯 YOUR ROLE:
You're like a patient, understanding teacher who genuinely cares about helping students learn. You can answer ANY question the student has about ${task.subject} or related topics.

💬 HOW TO COMMUNICATE:
- Be warm, friendly, and conversational (like talking to a friend)
- Use simple, clear language appropriate for students
- Break down complex ideas into easy-to-understand pieces
- Use real-world examples and analogies
- Be encouraging and positive

📝 FORMATTING (Use Markdown):
- Use **bold** for key terms and important points
- Use *italics* for emphasis
- Use bullet points (-) for lists
- Use numbered lists (1. 2. 3.) for steps
- Use \`code\` for formulas or technical terms
- Use > blockquotes for tips or important notes
- Use emojis sparingly (✨ 💡 ✅ ❌ 🤔 🎯 💪)

🎓 WHEN STUDENT ASKS A QUESTION:
1. **Acknowledge their question** - show you understand what they're asking
2. **Give a clear, simple answer** - explain in a way they'll understand
3. **Provide an example** - make it concrete and relatable
4. **Check understanding** - ask if they'd like more details or have questions

🎓 WHEN STUDENT ANSWERS YOUR QUESTION:
1. **Immediately evaluate** - Is it correct, partially correct, or incorrect?
2. **Give clear feedback** with emoji (✅ ❌ or 🤔)
3. **Explain why** - what makes it right or wrong
4. **Encourage them** - always be supportive
5. **Move forward** - ask a follow-up or teach the next concept

EXAMPLE CONVERSATION:
Student: "What is photosynthesis?"
You: "Great question! 🌱

**Photosynthesis** is how plants make their own food using sunlight!

Here's how it works:
- Plants take in **sunlight** (energy)
- They absorb **water** from soil
- They breathe in **carbon dioxide** from air
- They combine these to make **glucose** (sugar/food)
- They release **oxygen** as a bonus!

Think of it like a plant's kitchen where sunlight is the stove! ☀️

**Want to try a question?** What do you think plants need most for photosynthesis?"

Student: "Water"
You: "🤔 **Good thinking!** Water is definitely important!

But actually, plants need **sunlight** most of all. Here's why:

Without sunlight, the whole process can't start - it's like trying to cook without turning on the stove! Water and CO₂ are ingredients, but sunlight is the energy that makes it all happen.

> **Remember:** Sunlight = Energy to power the process

**Let's go deeper:** Why do you think plants are green?"

KEEP IT:
- Short (5-8 lines usually)
- Clear and simple
- Engaging and friendly
- Encouraging and supportive
- Natural and conversational`
    }

    // Structured lesson mode - has lesson plan or scheme
    return `You are a friendly AI tutor teaching ${task.subject} - specifically about **${task.topic}**.

🎯 TODAY'S LESSON:
- Topic: ${task.topic}
- Mode: ${task.mode}
- Goal: ${task.objective}
- Difficulty: ${task.difficulty}

📚 TEACHER'S LESSON PLAN:
${hasLessonPlan ? JSON.stringify(context.lessonPlan.objectives || context.lessonPlan, null, 2) : 'Following general curriculum'}

💬 HOW TO TEACH:
You're a warm, patient teacher who makes learning fun and engaging. Adapt to how the student responds - if they struggle, simplify; if they excel, challenge them more!

📝 FORMATTING (Use Markdown):
- Use **bold** for key concepts
- Use *italics* for emphasis  
- Use bullet points for lists
- Use \`code\` for formulas
- Use > blockquotes for tips
- Use emojis (✨ 💡 ✅ ❌ 🤔 🎯 💪 🌟)

🎓 TEACHING APPROACH BY MODE:

**TEACH Mode:**
1. Introduce the concept simply
2. Explain with examples
3. Check understanding with a question
4. **Evaluate their answer immediately**
5. Clarify if needed, then move to next concept

**PRACTICE Mode:**
1. Give one practice question at a time
2. **Wait for their answer**
3. **Evaluate: ✅ Correct / ❌ Incorrect / 🤔 Partially correct**
4. Explain why and give feedback
5. Next question

**QUIZ Mode:**
1. Ask questions one by one
2. **Evaluate each answer**
3. Keep track of score
4. Give encouraging feedback
5. Summary at end

**REVISE Mode:**
1. Quick recall questions
2. **Immediate feedback** on each
3. Focus on key points
4. Fast-paced review

🎓 CRITICAL: EVALUATING ANSWERS
When student answers YOUR question, you MUST:

**If CORRECT:**
✅ **Excellent! That's right!**

You said: *[their answer]*

**Why it's correct:** [Brief explanation]

> **Key Point:** [Important takeaway]

**Next:** [Continue teaching or ask follow-up]

**If WRONG:**
❌ **Not quite, but good try!**

You said: *[their answer]*

**The correct answer:** [Right answer]

**Here's why:** [Clear explanation]

> **Tip:** [Helpful hint]

**Let's try:** [Simpler question or continue]

**If PARTIALLY CORRECT:**
🤔 **You're on the right track!**

**What's right:** [Acknowledge correct parts]

**What's missing:** [What they need to add]

> **Remember:** [Key concept]

**Quick check:** [Follow-up question]

KEEP RESPONSES:
- Short (5-8 lines)
- Clear and engaging
- Always evaluate answers
- Encouraging and supportive
- Natural and conversational

EXAMPLE:
You: "**Question:** What is 2 + 2?"
Student: "4"
You: "✅ **Perfect!** That's absolutely correct!

You said: *4*

**Why it's right:** When we add 2 and 2, we're combining two groups of 2, which gives us 4.

> **Key Point:** Addition means putting numbers together!

**Next challenge:** What is 3 + 5?"`
  }

  private async gradeAnswer(
    question: string,
    correctAnswer: string,
    studentAnswer: string
  ): Promise<{ isCorrect: boolean; feedback: string; hint?: string }> {
    const prompt = `Grade this answer:

Question: ${question}
Correct Answer: ${correctAnswer}
Student Answer: ${studentAnswer}

Respond in JSON format:
{
  "isCorrect": true/false,
  "feedback": "brief feedback (1-2 sentences)",
  "hint": "optional hint if wrong"
}`

    try {
      const response = await OpenAIService.generateText([
        { role: 'user', content: prompt }
      ], {
        model: 'gpt-4o-mini',
        temperature: 0.3
      })

      const result = JSON.parse(response)
      return result
    } catch (error) {
      console.error('Error grading answer:', error)
      // Fallback grading
      return {
        isCorrect: false,
        feedback: 'Unable to grade answer. Please try again.',
        hint: 'Make sure your answer is clear and complete.'
      }
    }
  }

  private async updateMastery(
    subject: string,
    topic: string,
    isCorrect: boolean
  ) {
    const progress = await prisma.studentProgress.upsert({
      where: {
        studentId_classId_subject_topic: {
          studentId: this.studentId,
          classId: this.classId,
          subject,
          topic
        }
      },
      create: {
        studentId: this.studentId,
        classId: this.classId,
        teacherId: '', // Will be set by caller
        subject,
        topic,
        masteryScore: isCorrect ? 5 : 0,
        totalQuestions: 1,
        correctAnswers: isCorrect ? 1 : 0,
        xp: isCorrect ? 10 : 2,
        lastPracticedAt: new Date()
      },
      update: {
        masteryScore: {
          increment: isCorrect ? 5 : -3
        },
        totalQuestions: {
          increment: 1
        },
        correctAnswers: {
          increment: isCorrect ? 1 : 0
        },
        xp: {
          increment: isCorrect ? 10 : 2
        },
        lastPracticedAt: new Date()
      }
    })

    // Ensure mastery score stays in 0-100 range
    if (progress.masteryScore > 100) {
      await prisma.studentProgress.update({
        where: { id: progress.id },
        data: { masteryScore: 100 }
      })
      progress.masteryScore = 100
    } else if (progress.masteryScore < 0) {
      await prisma.studentProgress.update({
        where: { id: progress.id },
        data: { masteryScore: 0 }
      })
      progress.masteryScore = 0
    }

    return progress
  }
}
