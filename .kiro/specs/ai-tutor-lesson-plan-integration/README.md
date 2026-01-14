# AI Tutor Lesson Plan Integration - Spec Complete

## Overview

This spec addresses three critical issues with the AI Tutor system:

1. **Shared lesson plans not being retrieved** - The system only looks for lesson plans created today, ignoring plans shared with students
2. **No fallback for general questions** - When there's no lesson plan, students can't get help
3. **Need for flexible question handling** - Students should be able to ask clarifying questions while following a lesson plan

## What This Fixes

### Before
- AI tutor only finds lesson plans created TODAY
- Shared lesson plans are completely ignored
- No general tutoring mode when lesson plans don't exist
- Students can't ask general questions

### After
- AI tutor checks shared lesson plans FIRST (priority)
- Falls back to teacher plans → schemes → general mode
- Students can always get help, even without a lesson plan
- Flexible question handling in both structured and general modes

## Implementation Status

✅ Requirements defined (5 requirements with acceptance criteria)
✅ Design completed (architecture, components, data flow)
✅ Tasks created (10 implementation tasks)

## Next Steps

You can now begin implementing the tasks. To get started:

1. Open `.kiro/specs/ai-tutor-lesson-plan-integration/tasks.md`
2. Click "Start task" next to task 1
3. Follow the implementation plan step by step

## Key Changes

### TutorOrchestrator Enhancements

1. **New Method**: `getSharedLessonPlan()` - Retrieves lesson plans shared with student
2. **Enhanced**: `getNextTask()` - Priority-based lookup (shared → teacher → scheme → general)
3. **Enhanced**: `getTeacherContext()` - Returns mode indicator (structured vs general)
4. **Split**: `buildSystemPrompt()` - Separate prompts for structured and general modes

### Priority Chain

```
1. Shared Lesson Plans (most recent)
   ↓
2. Teacher Lesson Plans (today)
   ↓
3. Schemes of Work
   ↓
4. General Tutoring Mode
```

## Testing Strategy

- Diagnostic script to verify shared lesson plan retrieval
- Integration tests for complete tutoring flow
- Unit tests for all new methods
- Manual testing with real students and lesson plans

## Files Modified

- `src/lib/tutor-orchestrator.ts` - Core orchestrator logic
- No database changes required
- No API endpoint changes required
- No UI changes required

## Expected Outcomes

1. Teachers share lesson plans → Students see them in AI tutor
2. Students without lesson plans can still ask questions
3. AI tutor maintains lesson focus while allowing clarifying questions
4. Better learning experience for all students

## Documentation

- Requirements: `.kiro/specs/ai-tutor-lesson-plan-integration/requirements.md`
- Design: `.kiro/specs/ai-tutor-lesson-plan-integration/design.md`
- Tasks: `.kiro/specs/ai-tutor-lesson-plan-integration/tasks.md`
