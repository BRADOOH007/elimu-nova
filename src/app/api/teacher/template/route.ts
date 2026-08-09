import { NextResponse } from 'next/server'
import { route } from '@/lib/api-middleware'
import { getCurriculumProfile } from '@/lib/curriculum-prompt'

// GET /api/teacher/template — returns lesson plan template structure for AI generation
export const GET = route({}, async (req) => {
  const { searchParams } = new URL(req.url)
  const curriculum = searchParams.get('curriculum') || 'cbc'
  const country = searchParams.get('country')
  const profile = getCurriculumProfile(curriculum, country)
  const isCBC = !curriculum || curriculum === 'cbc'

  const strandLabel = profile.strandLabel || 'Strand'
  const subStrandLabel = profile.subStrandLabel || 'Sub-Strand'

  const lessonPlanTemplate = isCBC
    ? `KICD CBC LESSON PLAN TEMPLATE

SCHOOL: ____________________
TERM: _____  YEAR: _____  WEEK: _____  LESSON: _____
DATE: __________  DURATION: _____ minutes
CLASS: __________  SUBJECT: __________  TOPIC: __________
SUB-STRAND: __________  SUB-TOPIC: __________

LEARNING OUTCOMES:
By the end of the lesson, the learner should be able to:
1. ...
2. ...
3. ...

KEY INQUIRY QUESTION(s):
- ...

LEARNING RESOURCES:
- ...

ORGANIZATION OF LEARNING:
Learners to work in pairs, groups or individually.

INTRODUCTION (5 minutes):
- ...

LESSON DEVELOPMENT (30 minutes):
Step 1: ...
Step 2: ...
Step 3: ...

ASSESSMENT (5 minutes):
- ...

SUMMARY/CONCLUSION (5 minutes):
- ...

REFLECTION ON THE LESSON:
- What went well?
- What needs improvement?
- Follow-up activities.`
    : `CURRICULUM-ALIGNED LESSON PLAN TEMPLATE

SCHOOL: ____________________
DATE: __________  DURATION: _____ minutes
CLASS: __________  SUBJECT: __________  TOPIC: __________
${strandLabel}: __________  ${subStrandLabel}: __________

LEARNING OBJECTIVES:
By the end of the lesson, students will be able to:
1. ...
2. ...
3. ...

ESSENTIAL QUESTION:
- ...

STANDARDS ALIGNMENT:
- ...

LEARNING RESOURCES/MATERIALS:
- ...

LESSON INTRODUCTION / HOOK (5 minutes):
- ...

DIRECT INSTRUCTION & GUIDED PRACTICE (30 minutes):
Step 1: ...
Step 2: ...
Step 3: ...

INDEPENDENT PRACTICE / ASSESSMENT (5 minutes):
- ...

CLOSURE / SUMMARY (5 minutes):
- ...

DIFFERENTIATION & FOLLOW-UP:
- What went well?
- What needs improvement?
- Follow-up activities.`

  const schemeOfWorkTemplate = isCBC
    ? `KICD SCHEME OF WORK TEMPLATE

TERM: _____  YEAR: _____  SUBJECT: __________  GRADE: __________
NO. OF LESSONS: _____

| WK | LESSON | TOPIC | SUB-TOPIC | OBJECTIVES | LEARNING ACTIVITIES | LEARNING RESOURCES | REFERENCES | REMARKS |
|----|--------|-------|-----------|-----------|---------------------|--------------------|-------------|---------|`
    : `SCHEME OF WORK TEMPLATE

TERM: _____  YEAR: _____  SUBJECT: __________  GRADE: __________
NO. OF LESSONS: _____

| WK | LESSON | TOPIC | SUB-TOPIC | OBJECTIVES | LEARNING ACTIVITIES | LEARNING RESOURCES | REFERENCES | REMARKS |
|----|--------|-------|-----------|-----------|---------------------|--------------------|-------------|---------|`

  const rubricTemplate = `ASSESSMENT RUBRIC TEMPLATE

CRITERIA | EXCELLENT (5) | GOOD (4) | SATISFACTORY (3) | NEEDS IMPROVEMENT (2) | POOR (1)
---------|---------------|----------|------------------|-----------------------|----------
Content  |               |          |                  |                       |
Organization |          |          |                  |                       |
Language |               |          |                  |                       |
Creativity |              |          |                  |                       |`

  return NextResponse.json({ lessonPlanTemplate, schemeOfWorkTemplate, rubricTemplate })
})