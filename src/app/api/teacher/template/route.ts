import { NextResponse } from 'next/server'
import { route } from '@/lib/api-middleware'

// GET /api/teacher/template — returns KICD/CBC lesson plan template structure for AI generation
export const GET = route({}, async () => {
  return NextResponse.json({
    lessonPlanTemplate: `KICD CBC LESSON PLAN TEMPLATE

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
- Follow-up activities.`,
    schemeOfWorkTemplate: `KICD SCHEME OF WORK TEMPLATE

TERM: _____  YEAR: _____  SUBJECT: __________  GRADE: __________
NO. OF LESSONS: _____

| WK | LESSON | TOPIC | SUB-TOPIC | OBJECTIVES | LEARNING ACTIVITIES | LEARNING RESOURCES | REFERENCES | REMARKS |
|----|--------|-------|-----------|-----------|---------------------|--------------------|-------------|---------|`,
    rubricTemplate: `ASSESSMENT RUBRIC TEMPLATE

CRITERIA | EXCELLENT (5) | GOOD (4) | SATISFACTORY (3) | NEEDS IMPROVEMENT (2) | POOR (1)
---------|---------------|----------|------------------|-----------------------|----------
Content  |               |          |                  |                       |
Organization |          |          |                  |                       |
Language |               |          |                  |                       |
Creativity |              |          |                  |                       |`
  })
})