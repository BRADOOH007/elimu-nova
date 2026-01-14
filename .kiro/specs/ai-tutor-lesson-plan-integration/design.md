# Design Document

## Overview

This design enhances the AI Tutor system to properly integrate shared lesson plans and provide flexible tutoring capabilities. The solution modifies the TutorOrchestrator class to prioritize shared lesson plans and implements dual-mode operation: structured lesson mode when lesson plans are available, and general tutoring mode when they're not.

## Architecture

### Current System Flow
```
Student Message → API Route → TutorOrchestrator.getNextTask()
                                    ↓
                            Check schedule → Check lesson plans (TODAY only)
                                    ↓
                            Generate AI prompt → Return response
```

### Enhanced System Flow
```
Student Message → API Route → TutorOrchestrator.getNextTask()
                                    ↓
                            Check schedule → Check SHARED lesson plans (priority)
                                    ↓                    ↓
                                 Found?              Not found?
                                    ↓                    ↓
                            Use shared plan    → Check teacher lesson plans (today)
                                    ↓                    ↓
                                    ↓                 Found?
                                    ↓                    ↓
                                    ↓              Use teacher plan
                                    ↓                    ↓
                                    ↓                Not found?
                                    ↓                    ↓
                                    ↓              Check schemes of work
                                    ↓                    ↓
                                    ↓                Not found?
                                    ↓                    ↓
                                    └──────────→ General Tutoring Mode
                                             ↓
                                    Generate appropriate AI prompt
                                             ↓
                                        Return response
```

## Components and Interfaces

### 1. TutorOrchestrator Enhancement

**Modified Methods:**

```typescript
// Enhanced lesson plan retrieval
private async getTeacherContext(task: TutorTask): Promise<TeacherContext> {
  const context: TeacherContext = {
    lessonPlan: null,
    scheme: null,
    mode: 'general' | 'structured'
  }
  
  // Priority 1: Check shared lesson plans
  if (task.context.lessonPlanId) {
    const sharedPlan = await this.getSharedLessonPlan(task.subject)
    if (sharedPlan) {
      context.lessonPlan = sharedPlan
      context.mode = 'structured'
      return context
    }
  }
  
  // Priority 2: Check teacher lesson plans (today)
  // Priority 3: Check schemes of work
  // Priority 4: General mode
  
  return context
}

// New method to retrieve shared lesson plans
private async getSharedLessonPlan(subject: string): Promise<LessonPlan | null> {
  const sharedPlan = await prisma.sharedLessonPlan.findFirst({
    where: {
      studentId: this.studentId,
      isActive: true,
      lessonPlan: {
        subject: subject
      }
    },
    include: {
      lessonPlan: true
    },
    orderBy: {
      sharedAt: 'desc' // Most recently shared
    }
  })
  
  return sharedPlan?.lessonPlan || null
}
```

**Modified System Prompt Generation:**

```typescript
private buildSystemPrompt(task: TutorTask, context: TeacherContext): string {
  if (context.mode === 'general') {
    return this.buildGeneralTutoringPrompt(task)
  } else {
    return this.buildStructuredLessonPrompt(task, context)
  }
}

private buildGeneralTutoringPrompt(task: TutorTask): string {
  // Flexible, open-ended tutoring
  // Can answer any educational question
  // Maintains subject focus but not rigid
}

private buildStructuredLessonPrompt(task: TutorTask, context: TeacherContext): string {
  // Follows lesson plan objectives
  // Teaches specific content
  // Allows clarifying questions
  // Guides back to lesson when off-topic
}
```

### 2. Enhanced getNextTask Method

**Current Logic Issues:**
- Only checks lesson plans created TODAY
- Doesn't check SharedLessonPlan table
- No fallback for general questions

**Enhanced Logic:**

```typescript
async getNextTask(): Promise<TutorTask> {
  const student = await this.getStudent()
  const schedule = await this.getCurrentSchedule()
  
  const subject = schedule?.subject || 'General'
  let lessonPlanId: string | undefined
  let schemeOfWorkId: string | undefined
  let topic = 'Introduction'
  
  // PRIORITY 1: Check shared lesson plans
  const sharedPlan = await prisma.sharedLessonPlan.findFirst({
    where: {
      studentId: this.studentId,
      isActive: true,
      lessonPlan: {
        subject: subject
      }
    },
    include: {
      lessonPlan: true
    },
    orderBy: {
      sharedAt: 'desc'
    }
  })
  
  if (sharedPlan) {
    lessonPlanId = sharedPlan.lessonPlan.id
    topic = sharedPlan.lessonPlan.title
  } else {
    // PRIORITY 2: Check teacher lesson plans (today)
    // PRIORITY 3: Check schemes of work
    // PRIORITY 4: Use general subject
  }
  
  // Determine mode and difficulty based on mastery
  const progress = await this.getProgress(subject, topic)
  const mode = this.determineMode(progress.masteryScore)
  
  return {
    subject,
    topic,
    mode,
    objective: `Master ${topic} in ${subject}`,
    estimatedMinutes: 10,
    difficulty: this.determineDifficulty(progress.masteryScore),
    context: {
      lessonPlanId,
      schemeOfWorkId,
      scheduleSlot: schedule,
      masteryScore: progress.masteryScore
    }
  }
}
```

## Data Models

### Existing Models (No Changes Required)

```prisma
model SharedLessonPlan {
  id           String      @id @default(cuid())
  lessonPlanId String
  studentId    String
  teacherId    String
  isActive     Boolean     @default(true)
  sharedAt     DateTime    @default(now())
  
  lessonPlan   LessonPlan  @relation(...)
  student      Student     @relation(...)
  teacher      Teacher     @relation(...)
}

model LessonPlan {
  id        String   @id @default(cuid())
  teacherId String
  title     String
  subject   String
  grade     String
  content   String   @db.Text
  createdAt DateTime @default(now())
  
  sharedWith SharedLessonPlan[]
}
```

### New TypeScript Interfaces

```typescript
interface TeacherContext {
  lessonPlan: any | null
  scheme: any | null
  mode: 'general' | 'structured'
}

interface TutorMode {
  type: 'general' | 'structured'
  allowsGeneralQuestions: boolean
  strictness: 'flexible' | 'moderate' | 'strict'
}
```

## Error Handling

### Scenario 1: No Lesson Plan Found
- **Behavior**: Activate general tutoring mode
- **User Experience**: Student can ask any educational question
- **System Response**: Helpful, encouraging, educational

### Scenario 2: Lesson Plan Exists But Student Asks Off-Topic Question
- **Behavior**: Answer the question briefly, then guide back to lesson
- **Example**: "That's a great question about [topic]! [Brief answer]. Now, let's get back to our lesson on [lesson topic]..."

### Scenario 3: Shared Lesson Plan Inactive
- **Behavior**: Treat as if no shared lesson plan exists
- **Fallback**: Check teacher lesson plans, then schemes, then general mode

### Scenario 4: Multiple Shared Lesson Plans for Same Subject
- **Behavior**: Use the most recently shared lesson plan
- **Rationale**: Teacher's latest assignment takes priority

## Testing Strategy

### Unit Tests

1. **Test Shared Lesson Plan Retrieval**
   - Verify shared plans are found correctly
   - Verify most recent plan is selected
   - Verify inactive plans are ignored

2. **Test Fallback Logic**
   - No shared plan → check teacher plans
   - No teacher plans → check schemes
   - No schemes → general mode

3. **Test System Prompt Generation**
   - General mode prompt allows any questions
   - Structured mode prompt follows lesson plan
   - Both modes maintain formatting standards

### Integration Tests

1. **Test Complete Tutoring Flow**
   - Student with shared lesson plan
   - Student without shared lesson plan
   - Student asking general questions
   - Student asking lesson-related questions

2. **Test Question Handling**
   - On-topic questions in structured mode
   - Off-topic questions in structured mode
   - Any questions in general mode

### Manual Testing Scenarios

1. **Teacher shares lesson plan → Student uses AI tutor**
   - Expected: AI tutor uses shared lesson plan
   
2. **Student asks general question with no lesson plan**
   - Expected: AI tutor provides helpful answer
   
3. **Student asks clarifying question during lesson**
   - Expected: AI tutor answers and continues lesson

## Implementation Notes

### Key Changes

1. **TutorOrchestrator.getNextTask()**
   - Add SharedLessonPlan query as first priority
   - Remove date restriction on lesson plan lookup
   - Add fallback chain: shared → teacher → scheme → general

2. **TutorOrchestrator.getTeacherContext()**
   - Check for shared lesson plans first
   - Return context with mode indicator

3. **TutorOrchestrator.buildSystemPrompt()**
   - Split into two prompt builders
   - General mode: flexible, open-ended
   - Structured mode: lesson-focused, allows questions

### Backward Compatibility

- Existing tutor sessions continue to work
- No database schema changes required
- API endpoints remain unchanged
- Only internal orchestrator logic changes

### Performance Considerations

- SharedLessonPlan query adds one additional database call
- Query is indexed on studentId and isActive
- Minimal performance impact (< 10ms)
- Results can be cached per session

## Design Decisions

### Decision 1: Shared Plans Take Priority
**Rationale**: When a teacher explicitly shares a lesson plan with a student, that represents intentional assignment and should override automatic content selection.

### Decision 2: General Mode as Fallback
**Rationale**: Students should always be able to get help, even without structured content. An AI tutor that refuses to answer questions is not helpful.

### Decision 3: Allow Questions in Structured Mode
**Rationale**: Learning requires asking questions. The AI should answer clarifying questions while maintaining lesson focus.

### Decision 4: Most Recent Shared Plan Wins
**Rationale**: If multiple lesson plans are shared for the same subject, the most recent represents the teacher's current intent.

### Decision 5: No UI Changes Required
**Rationale**: This is a backend enhancement. The student experience improves automatically without requiring interface changes.
