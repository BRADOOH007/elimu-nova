import { NextResponse } from 'next/server'
import { OpenAIService } from '@/lib/openai-service'
import { prisma } from '@/lib/prisma'
import { buildKICDLessonPrompt } from '@/lib/cbc-context'
import { route } from '@/lib/api-middleware'
import { cleanAiJson } from '@/lib/ai-generation-utils'
import { buildFullGenerationContext } from '@/lib/curriculum-intelligence'
import { buildCurriculumLessonContext, getCurriculumProfile } from '@/lib/curriculum-prompt'
import { buildSubjectPedagogySection } from '@/lib/subject-pedagogy'
import { buildGradeBandSection } from '@/lib/grade-bands'
import { buildSmartLessonPlan } from '@/lib/deterministic-lesson-plan'
import { lookupLessonPlan, saveLessonPlan } from '@/lib/lesson-plan-cache'

export const POST = route({ auth: ['TEACHER', 'SUPER_ADMIN'] }, async (request, { user }) => {
    const body = await request.json()
    const { mode = 'single', subject, grade, topic, duration, objectives, prerequisites, documentContext, term, weeksCount, lessonsPerWeek, topics: requestTopics, curriculum, country } = body

    if (!subject || !grade) {
      return NextResponse.json({ error: 'Subject and grade are required' }, { status: 400 })
    }

    if (mode === 'single' && !topic) {
      return NextResponse.json({ error: 'Topic is required for single lesson mode' }, { status: 400 })
    }

    if (mode === 'term' && (!requestTopics || requestTopics.length === 0)) {
      return NextResponse.json({ error: 'At least one topic is required for term mode' }, { status: 400 })
    }

    let templateText = documentContext
    if (!templateText && user.role === 'TEACHER') {
      const teacher = await prisma.teacher.findUnique({
        where: { userId: user.id },
        select: { lessonPlanTemplate: true },
      })
      templateText = teacher?.lessonPlanTemplate || null
    }
    // Don't treat the default KICD template as a custom upload — deterministic already handles it
    if (templateText && templateText.includes('KICD CBC LESSON PLAN TEMPLATE')) {
      templateText = null
    }

    const filteredObjectives = Array.isArray(objectives)
      ? objectives.filter((obj: string) => obj && obj.trim() !== '')
      : []
    const filteredPrerequisites = Array.isArray(prerequisites)
      ? prerequisites.filter((prereq: string) => prereq && prereq.trim() !== '')
      : []

    const isKiswahili = subject.toLowerCase() === 'kiswahili'
    const languageInstruction = isKiswahili
      ? 'IMPORTANT: Generate this lesson plan entirely in Swahili language.'
      : 'IMPORTANT: Generate this lesson plan entirely in English language.'

    const templateBlock = templateText
      ? `\n\nA reference lesson plan document was uploaded. Study its structure, then generate in the same format:\n\n${templateText.slice(0, 2000)}\n\n---\n`
      : ''

    const kicdContext = curriculum && curriculum !== 'cbc'
      ? buildCurriculumLessonContext({ curriculum, country, grade, subject })
      : buildKICDLessonPrompt(grade, subject)

    // Fetch curriculum intelligence — official outcomes + teacher examples + RAG
    const { curriculumSection, examplesSection, ragContext } = await buildFullGenerationContext(
      grade, subject as string, { generationType: 'lesson_plan', topic: topic as string, curriculum: curriculum as string }
    )

    // Subject-specific pedagogy
    const pedagogySection = buildSubjectPedagogySection(subject as string)

    // Grade-band adaptations
    const gradeBandSection = buildGradeBandSection(grade)

    const systemPrompt = `You are ${curriculum && curriculum !== 'cbc' ? `an expert educator creating detailed lesson plans for the ${getCurriculumProfile(curriculum, country).name} curriculum` : 'a Kenyan CBC/CBE curriculum expert creating detailed lesson plans in the official KICD format'}.${templateBlock}
${kicdContext}

${curriculumSection}
${ragContext}
${examplesSection}
${pedagogySection}
${gradeBandSection}

Return a JSON object EXACTLY matching this 11-section structure (field names are fixed; adapt the terminology inside them to the curriculum, e.g. "strand" = ${curriculum && curriculum !== 'cbc' ? getCurriculumProfile(curriculum, country).strandLabel : 'Strand'}):
{
  "title": string,
  "duration": number (minutes),
  "lessonHeader": {
    "school": "string",
    "teacher": "string",
    "learningArea": "${subject}",
    "grade": "${grade}",
    "term": "string",
    "week": 1,
    "lesson": 1,
    "date": "string",
    "duration": number,
    "enrolment": number
  },
  "strand": "string (${curriculum && curriculum !== 'cbc' ? getCurriculumProfile(curriculum, country).strandLabel : 'exact from KICD curriculum design'})",
  "subStrand": "string (${curriculum && curriculum !== 'cbc' ? getCurriculumProfile(curriculum, country).subStrandLabel : 'exact from KICD curriculum design'})",
  "specificLearningOutcomes": ["SLO1 - knowledge", "SLO2 - skill", "SLO3 - attitude"],
  "keyInquiryQuestions": ["open-ended question"],
  "coreCompetencies": ["pick 2-3 relevant to this curriculum"],
  "values": ["pick 1-2 from the curriculum values"],
  "pcis": ["pick 1-2 relevant contemporary/cross-curricular issues"],
  "learningResources": ["resource with page numbers"],
  "organisationOfLearning": {
    "introduction": { "duration": 5, "teacherActivity": "string", "learnerActivity": "string" },
    "step1": { "duration": number, "teacherActivity": "string", "learnerActivity": "string" },
    "step2": { "duration": number, "teacherActivity": "string", "learnerActivity": "string" },
    "step3": { "duration": number, "teacherActivity": "string", "learnerActivity": "string" },
    "conclusion": { "duration": number, "teacherActivity": "string", "learnerActivity": "string" }
  },
  "assessment": "string",
  "extendedActivities": "string",
  "reflection": "string",
  "vocabulary": [{ "term": "key term", "definition": "clear definition", "example": "usage in context" }],
  "misconceptions": [{ "statement": "common student mistake", "correction": "how to address it", "preventionTip": "how to prevent this misconception" }],
  "differentiation": {
    "support": "strategies for struggling learners",
    "extension": "activities for advanced learners",
    "learningStyles": ["visual", "kinesthetic", "auditory"],
    "grouping": "suggested grouping strategy"
  },
  "crossCurricularLinks": [{ "subject": "connected subject", "connection": "how topics relate", "activity": "joint activity idea" }],
  "rubric": [{ "criteria": "assessment criteria", "excellent": "descriptor", "good": "descriptor", "developing": "descriptor" }],
  "formativeCheckpoints": ["check point 1 during lesson", "check point 2 during lesson"]
}
Return ONLY valid JSON. No markdown or explanation.`

    if (mode === 'single') {
      if (!topic || !duration || filteredObjectives.length === 0) {
        return NextResponse.json({ error: 'Topic, duration, and at least one objective required' }, { status: 400 })
      }

      // Check cache first
      const cached = await lookupLessonPlan(subject, topic, grade, 'single', curriculum)
      if (cached) {
        return NextResponse.json({
          success: true,
          mode: 'single',
          lesson: cached.content,
          metadata: { subject, grade, topic, duration, language: isKiswahili ? 'swahili' : 'english', fromCache: true },
        })
      }

      // Deterministic default: build a smart, curriculum-driven lesson plan entirely
      // without AI (real DB outcomes + grade-band + subject pedagogy). This is fast,
      // reliable, and matches KICD/AI plan quality. It also serves as the safety
      // net when AI is unavailable or times out.
      const deterministicPlan = await buildSmartLessonPlan({
        subject, grade, topic, duration,
        objectives: filteredObjectives,
        prerequisites: filteredPrerequisites,
        curriculum, country,
      })
      let lessonData: any = deterministicPlan
      let lastError = ''
      let lessonDataFromAi: any = null

      // Always try AI first when it is available: it produces richer, more natural
      // plans. The deterministic plan stands by as a fast fallback. A hard deadline
      // guarantees the teacher is never left waiting on a slow/failed provider chain
      // (callAI can take up to 60s per provider when degraded).
      const userPrompt = `Create a detailed ${duration}-minute lesson plan for:

Subject: ${subject}
Grade: ${grade}
Topic: ${topic}
${languageInstruction}

Learning Objectives: ${filteredObjectives.join(', ')}
Prerequisites: ${filteredPrerequisites.length > 0 ? filteredPrerequisites.join(', ') : 'None specified'}

Make this lesson plan practical, engaging, and specifically tailored for ${curriculum && curriculum !== 'cbc' ? `${getCurriculumProfile(curriculum, country).name} ${grade} students in the United States` : `Kenyan ${grade} students`}.
Use local examples. Each activity should have clear timing and instructions.`

      const aiAttempt = (async () => {
        const raw = await OpenAIService.generateLongContent(
          [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          { maxTokens: 10000, temperature: 0.5 }
        )
        const json = cleanAiJson(raw)
        if (!json) throw new Error('cleanAiJson returned empty')
        return JSON.parse(json)
      })()

      // Swallow any late rejection (e.g. the attempt resolves/rejects after we already
      // fell back to deterministic on timeout) so it never surfaces as an unhandled
      // promise rejection on the server.
      aiAttempt.catch(() => {})

      const AI_DEADLINE_MS = 20_000
      try {
        lessonDataFromAi = await Promise.race([
          aiAttempt,
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('AI attempt timed out')), AI_DEADLINE_MS)
          ),
        ])
      } catch (e) {
        lastError = (e as Error).message
        console.warn(`[LessonPlan] AI unavailable/slow — using deterministic plan. ${lastError}`)
      }

      // Prefer the AI plan when it succeeded, else keep the deterministic builder result.
      if (lessonDataFromAi) {
        lessonData = lessonDataFromAi
      }

      // Save the winning plan (AI or deterministic) to cache for future requests.
      // When AI succeeds its output is cached, so even if AI later goes down the same
      // high-quality plan is reused (self-improving, AI-seeded cache).
      await saveLessonPlan(subject, topic, grade, 'single', lessonData as any, curriculum)

      return NextResponse.json({
        success: true,
        mode: 'single',
        lesson: lessonData,
        metadata: {
          subject, grade, topic, duration,
          language: isKiswahili ? 'swahili' : 'english',
          fromFallback: !lessonDataFromAi,
          deterministic: !lessonDataFromAi,
        },
      })
    }

    // ── Term mode: generate multiple lessons across weeks ──
    const finalWeeks = weeksCount || 13
    const finalLessonsPerWeek = lessonsPerWeek || 5
    const topicsList: string[] = requestTopics || (topic ? [topic] : [])

    // Check cache for term plan (use first topic as cache key)
    const termCacheTopic = topicsList[0] || topic || 'term-plan'
    const cachedTerm = await lookupLessonPlan(subject, termCacheTopic, grade, 'term', curriculum)
    if (cachedTerm) {
      return NextResponse.json({
        success: true,
        mode: 'term',
        termPlan: cachedTerm.content,
        metadata: { subject, grade, weeks: finalWeeks, lessonsPerWeek: finalLessonsPerWeek, topics: topicsList, language: isKiswahili ? 'swahili' : 'english', fromCache: true },
      })
    }

    const termPrompt = `Create a comprehensive set of lesson plans covering an entire term.

Subject: ${subject}
Grade: ${grade}
Term: ${term || 'Term'}
Duration: ${finalWeeks} weeks, ${finalLessonsPerWeek} lessons per week
Topics to cover: ${topicsList.join(', ')}
${languageInstruction}

You must generate lesson plans for ALL ${finalWeeks * finalLessonsPerWeek} lessons across ${finalWeeks} weeks.
Cover ALL topics: ${topicsList.join(', ')}
Distribute topics evenly across the weeks.

Return a JSON object with this structure:
{
  "title": "${subject} - ${grade} - Term Plan",
  "weeks": [
    {
      "weekNumber": 1,
      "theme": string,
      "lessons": [
        {
          "lessonNumber": 1,
          "topic": string,
          "duration": 40,
          "specificLearningOutcomes": string,
          "keyInquiryQuestions": string[],
          "introduction": { "duration": number, "activity": string, "teacherActions": string, "studentActions": string },
          "mainActivity": { "duration": number, "activity": string, "teacherActions": string, "studentActions": string, "coreCompetencies": string[] },
          "practiceActivity": { "duration": number, "activity": string },
          "conclusion": { "duration": number, "activity": string, "assessment": string },
          "learningResources": string[],
          "assessment": string,
          "homework": string
        }
      ]
    }
  ]
}
Return ONLY valid JSON. No markdown or explanation.`

    let termData: any = null
    let lastTermError = ''
    for (let attempt = 0; attempt < 3 && !termData; attempt++) {
      try {
        const raw = await OpenAIService.generateLongContent(
          [
            { role: 'system', content: systemPrompt.replace('Return ONLY valid JSON.', 'Return the full term plan as valid JSON.') },
            { role: 'user', content: termPrompt },
          ],
          { maxTokens: 16000, temperature: 0.5 }
        )
        const json = cleanAiJson(raw)
        if (json) {
          termData = JSON.parse(json)
        } else {
          lastTermError = 'cleanAiJson returned empty'
          console.warn(`[GenerateLessonPlan] Term attempt ${attempt + 1}: cleanAiJson returned empty. Raw length: ${raw.length}`)
        }
      } catch (e) {
        lastTermError = (e as Error).message
        console.warn(`[GenerateLessonPlan] Term attempt ${attempt + 1} failed:`, lastTermError)
      }
    }

    if (!termData) {
      // Deterministic term fallback — build each topic through the smart builder so
      // the teacher still receives a complete, curriculum-driven term plan even when
      // AI is unavailable or times out (never a hard 500).
      const perLessonDuration = typeof duration === 'number' && duration > 0 ? duration : 40
      const weeks: any[] = []
      let topicIdx = 0
      for (let w = 1; w <= finalWeeks; w++) {
        const lessons: any[] = []
        for (let l = 1; l <= finalLessonsPerWeek; l++) {
          const topicName = topicsList[topicIdx % topicsList.length]
          topicIdx++
          const plan: any = await buildSmartLessonPlan({
            subject, grade, topic: topicName, duration: perLessonDuration,
            objectives: filteredObjectives,
            prerequisites: filteredPrerequisites,
            curriculum, country,
          })
          lessons.push({
            lessonNumber: l,
            topic: topicName,
            duration: perLessonDuration,
            ...plan,
          })
        }
        weeks.push({ weekNumber: w, theme: `Week ${w}`, lessons })
      }
      termData = { title: `${subject} - ${grade} - Term Plan`, weeks }
      lastTermError = 'AI unavailable — generated deterministic term plan'
    }

    // Save term plan to cache
    await saveLessonPlan(subject, termCacheTopic, grade, 'term', termData as any, curriculum)

    return NextResponse.json({
      success: true,
      mode: 'term',
      termPlan: termData,
      metadata: { subject, grade, weeks: finalWeeks, lessonsPerWeek: finalLessonsPerWeek, topics: topicsList, language: isKiswahili ? 'swahili' : 'english', deterministic: lastTermError.startsWith('AI unavailable') },
    })
})
