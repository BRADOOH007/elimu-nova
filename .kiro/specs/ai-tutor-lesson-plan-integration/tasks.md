# Implementation Plan

- [ ] 1. Add shared lesson plan retrieval method to TutorOrchestrator
  - Create `getSharedLessonPlan()` private method that queries SharedLessonPlan table
  - Query by studentId, isActive=true, and subject match
  - Order by sharedAt DESC to get most recent
  - Return the lesson plan or null
  - _Requirements: 1.1, 1.2, 1.3_

- [ ] 2. Enhance getNextTask() method with priority-based lesson plan lookup
  - Add SharedLessonPlan query as first priority before date-based lookup
  - Remove date restriction (createdAt filter) from lesson plan queries
  - Implement fallback chain: shared plans → teacher plans → schemes → general mode
  - Set lessonPlanId when shared plan is found
  - _Requirements: 1.1, 1.4, 1.5, 4.1, 4.2, 4.3, 4.4, 4.5_

- [ ] 3. Refactor getTeacherContext() to support dual-mode operation
  - Modify return type to include mode indicator ('general' | 'structured')
  - Check for shared lesson plan first using new method
  - Set mode to 'structured' when lesson plan exists
  - Set mode to 'general' when no lesson plan exists
  - Return context object with lessonPlan, scheme, and mode
  - _Requirements: 2.1, 5.1, 5.2_

- [ ] 4. Split buildSystemPrompt() into mode-specific prompt builders
  - Create `buildGeneralTutoringPrompt()` for general mode
  - Create `buildStructuredLessonPrompt()` for structured mode
  - Update main `buildSystemPrompt()` to route based on context.mode
  - _Requirements: 5.1, 5.2, 5.3_

- [ ] 5. Implement buildGeneralTutoringPrompt() method
  - Create flexible, encouraging prompt for general tutoring
  - Allow any educational questions
  - Maintain subject focus when subject is known
  - Include markdown formatting guidelines
  - Add instructions for handling various question types
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 5.4, 5.5_

- [ ] 6. Implement buildStructuredLessonPrompt() method
  - Create lesson-focused prompt that includes lesson objectives
  - Add instructions to follow lesson plan content
  - Include guidance for handling clarifying questions
  - Add instructions to guide back to lesson after off-topic questions
  - Maintain markdown formatting guidelines
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 5.4, 5.5_

- [ ] 7. Update TypeScript interfaces for new context structure
  - Add TeacherContext interface with lessonPlan, scheme, and mode properties
  - Update getTeacherContext() return type
  - Update buildSystemPrompt() parameter types
  - Ensure type safety across all modified methods
  - _Requirements: All (supporting)_

- [ ] 8. Create diagnostic script to verify shared lesson plan integration
  - Script to test shared lesson plan retrieval for a student
  - Verify priority order (shared → teacher → scheme → general)
  - Test with student who has shared plans
  - Test with student who has no shared plans
  - Output clear results showing which lesson plan was selected
  - _Requirements: 1.1, 1.2, 1.3, 4.1, 4.2, 4.3, 4.4, 4.5_

- [ ] 9. Create integration test for complete tutoring flow
  - Test student with shared lesson plan receives structured tutoring
  - Test student without lesson plan receives general tutoring
  - Test question handling in both modes
  - Verify AI responses are appropriate for each mode
  - _Requirements: All_

- [ ] 10. Add unit tests for new methods
  - Test getSharedLessonPlan() with various scenarios
  - Test getNextTask() priority logic
  - Test buildGeneralTutoringPrompt() output
  - Test buildStructuredLessonPrompt() output
  - _Requirements: All_
