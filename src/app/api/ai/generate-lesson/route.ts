import { NextResponse } from 'next/server'
import { OpenAIService } from '@/lib/openai-service'
import { route } from '@/lib/api-middleware'
import { cleanAiJson } from '@/lib/ai-generation-utils'
import { buildFullGenerationContext } from '@/lib/curriculum-intelligence'
import { buildSubjectPedagogySection } from '@/lib/subject-pedagogy'
import { buildGradeBandSection } from '@/lib/grade-bands'

export const POST = route({ auth: ['TEACHER', 'SCHOOL_ADMIN', 'SUPER_ADMIN'] }, async (req, { user }) => {
    const body = await req.json()
    const { subject, topic, grade, difficulty, learningStyle, curriculum } = body

    const requestId = Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
    const approaches = ['inquiry-based', 'storytelling', 'real-world application', 'Socratic', 'hands-on discovery', 'project-based']
    const approach = approaches[Math.floor(Math.random() * approaches.length)]

    const gradeStr = grade || 'Grade 8'

    // Fetch curriculum intelligence
    let curriculumSection = ''
    try {
      const { curriculumSection: cs } = await buildFullGenerationContext(
        gradeStr, subject || 'General', { generationType: 'lesson_plan', topic, curriculum: curriculum as string }
      )
      curriculumSection = cs
    } catch { /* curriculum intelligence unavailable */ }

    // Subject-specific pedagogy
    const pedagogySection = buildSubjectPedagogySection(subject || 'General')

    // Grade-band adaptations
    const gradeBandSection = buildGradeBandSection(gradeStr)

    const content = await OpenAIService.generateText([
      { role: 'system', content: `You are an expert AI tutor creating unique lesson content for students. Use a ${approach} approach — vary examples and structure every time.
${curriculumSection}
${pedagogySection}
${gradeBandSection}
Return ONLY valid JSON with: title, subject, grade, difficulty, duration, type, objectives (array), prerequisites (array), insights (array), vocabulary (array of {term, definition, example}), misconceptions (array of {statement, correction, tip}), content (detailed markdown lesson body).` },
      { role: 'user',   content: `Create a unique, personalized lesson for: Subject: ${subject}, Topic: ${topic}, Grade: ${gradeStr}, Level: ${difficulty || 'intermediate'}, Style: ${learningStyle || 'visual'}. ${curriculum ? `Curriculum: ${curriculum}.` : ''} Request ID: ${requestId}. Use a specific, relatable local example that's different from any previous lesson. Return ONLY valid JSON.` },
    ], { maxTokens: 6000, temperature: 0.85 })

    let lessonData: any = {}
    try {
      const json = cleanAiJson(content)
      if (json) lessonData = JSON.parse(json)
    } catch { lessonData = { title: topic, subject, grade, content } }

    return NextResponse.json({
      lesson: {
        id: `ai-lesson-${Date.now()}`,
        title: lessonData.title || topic,
        subject: lessonData.subject || subject,
        grade: lessonData.grade || grade,
        difficulty: lessonData.difficulty || difficulty,
        duration: lessonData.duration || 40,
        type: lessonData.type || 'lesson',
        aiGenerated: true, personalized: true, progress: 0, completed: false, rating: 0,
        estimatedTime: lessonData.duration || 40,
        learningObjectives: lessonData.objectives || [],
        prerequisites: lessonData.prerequisites || [],
        vocabulary: lessonData.vocabulary || [],
        misconceptions: lessonData.misconceptions || [],
        aiInsights: lessonData.insights || [],
        generatedContent: lessonData.content || content,
      },
      message: 'AI lesson generated successfully',
    })
})
