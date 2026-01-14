# Requirements Document

## Introduction

The AI Tutor system currently has limitations that prevent it from effectively using shared lesson plans and handling general student questions. This feature will enhance the AI Tutor to:
1. Properly retrieve and use lesson plans shared with students
2. Provide flexible responses when no lesson plan is available
3. Handle general student questions while maintaining lesson plan focus when appropriate

## Glossary

- **AI Tutor System**: The autonomous tutoring system that teaches students based on lesson plans and curriculum
- **TutorOrchestrator**: The core service class that manages tutoring logic and lesson plan retrieval
- **SharedLessonPlan**: Database table that tracks which lesson plans have been shared with which students
- **LessonPlan**: Teacher-created educational content with objectives, activities, and assessments
- **General Tutoring Mode**: AI tutor behavior when no specific lesson plan is available
- **Structured Lesson Mode**: AI tutor behavior when following a specific lesson plan
- **Student**: A user with role STUDENT who receives tutoring

## Requirements

### Requirement 1: Shared Lesson Plan Retrieval

**User Story:** As a student, I want the AI tutor to use lesson plans that my teacher has shared with me, so that I can learn the content my teacher wants me to focus on.

#### Acceptance Criteria

1. WHEN the TutorOrchestrator retrieves lesson plans for a student, THE System SHALL query the SharedLessonPlan table for active lesson plans shared with that student
2. WHEN multiple shared lesson plans exist for a subject, THE System SHALL prioritize the most recently shared lesson plan
3. WHEN a shared lesson plan is found, THE System SHALL use that lesson plan regardless of its creation date
4. WHEN no shared lesson plan exists for the current subject, THE System SHALL fall back to checking teacher-created lesson plans
5. THE System SHALL NOT restrict lesson plan retrieval to only those created on the current day

### Requirement 2: General Tutoring Mode

**User Story:** As a student, I want to ask the AI tutor general questions even when there's no lesson plan, so that I can get help with any topic I'm studying.

#### Acceptance Criteria

1. WHEN no lesson plan is available for the student's current subject, THE System SHALL activate general tutoring mode
2. WHILE in general tutoring mode, THE System SHALL respond to any educational question from the student
3. WHEN a student asks a question in general tutoring mode, THE System SHALL provide clear, helpful explanations with examples
4. THE System SHALL format responses using markdown for better readability
5. WHILE in general tutoring mode, THE System SHALL maintain an encouraging and supportive tone

### Requirement 3: Flexible Question Handling

**User Story:** As a student, I want to ask clarifying questions about the lesson content, so that I can better understand topics I'm confused about.

#### Acceptance Criteria

1. WHEN a lesson plan is active, THE System SHALL primarily teach content from that lesson plan
2. WHEN a student asks a question related to the lesson topic, THE System SHALL answer the question while staying within the lesson context
3. WHEN a student asks a general educational question, THE System SHALL provide a helpful answer and then guide back to the lesson
4. THE System SHALL NOT refuse to answer legitimate educational questions
5. THE System SHALL distinguish between on-topic questions and off-topic questions

### Requirement 4: Lesson Plan Priority Logic

**User Story:** As a teacher, I want shared lesson plans to take priority over automatically selected content, so that students focus on what I've specifically assigned to them.

#### Acceptance Criteria

1. THE System SHALL check for shared lesson plans before checking date-based lesson plans
2. WHEN a lesson plan is shared with a student, THE System SHALL use that lesson plan for the specified subject
3. WHEN no shared lesson plan exists, THE System SHALL check for teacher-created lesson plans for the current day
4. WHEN no lesson plans are found, THE System SHALL check for schemes of work
5. WHEN no structured content is found, THE System SHALL use general tutoring mode

### Requirement 5: System Prompt Adaptation

**User Story:** As a student, I want the AI tutor to adapt its teaching style based on whether there's a lesson plan or not, so that I get appropriate guidance in all situations.

#### Acceptance Criteria

1. WHEN a lesson plan is available, THE System SHALL generate a system prompt that focuses on lesson objectives
2. WHEN no lesson plan is available, THE System SHALL generate a system prompt that enables general tutoring
3. THE System SHALL include clear instructions in the prompt about handling student questions
4. THE System SHALL maintain consistent formatting guidelines across both modes
5. THE System SHALL ensure the AI tutor remains helpful and educational in all modes
