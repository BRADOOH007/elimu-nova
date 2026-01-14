# 🎓 How the Autonomous AI Tutor Works

## Overview

The Autonomous AI Tutor is a **self-teaching system** that decides what to teach, when to teach it, and how to adapt to each student's needs - all without human intervention.

---

## 🔄 The Complete Learning Cycle

### 1. **Student Opens AI Tutor Page**

```
Student visits: /student/ai-tutor
↓
Frontend calls: GET /api/student/tutor/next
↓
Backend determines: "What should I teach NOW?"
```

### 2. **System Determines Current Task**

The Tutor Orchestrator analyzes:

**A. Current Time & Schedule**
```typescript
Current time: Monday 9:00 AM
↓
Checks ClassSchedule table
↓
Finds: "Mathematics class from 9:00-10:00"
↓
Subject = "Mathematics"
```

**B. Teacher's Curriculum**
```typescript
Looks for today's LessonPlan
↓
If found: Topic = "Fractions"
↓
If not found: Uses SchemeOfWork for this week
↓
Topic = "Introduction to Fractions"
```

**C. Student's Mastery Level**
```typescript
Checks StudentProgress table
↓
Student's mastery for "Fractions" = 0/100
↓
Determines: Mode = TEACH, Difficulty = EASY
```

**D. Returns Task**
```json
{
  "subject": "Mathematics",
  "topic": "Fractions",
  "mode": "teach",
  "difficulty": "easy",
  "objective": "Understand what fractions represent",
  "estimatedMinutes": 10
}
```

### 3. **Student Sees Personalized Welcome**

Frontend displays:
```
📖 TEACH MODE
Mathematics: Fractions
"Understand what fractions represent"
Difficulty: Easy | ~10 min

"Ready to learn Fractions! Let's get started."
```

### 4. **Student Interacts with Tutor**

**Student types:** "Can you explain fractions?"

**System processes:**
```typescript
POST /api/student/tutor/message
{
  message: "Can you explain fractions?",
  task: { subject: "Mathematics", topic: "Fractions", mode: "teach" }
}
```

**Backend builds AI prompt:**
```typescript
System Prompt = `
You are teaching Mathematics: Fractions

TEACHER'S LESSON PLAN:
- Objective: Students will understand fractions as parts of a whole
- Activity: Use visual examples (pizza, chocolate bar)
- Assessment: Ask students to identify fractions

TEACHING RULES:
- Mode: TEACH (explain + example + check question)
- Difficulty: EASY
- Keep responses SHORT (5-8 lines max)
- Always end with a question
- Be encouraging and supportive

ENGAGEMENT:
- Use simple language
- Give visual examples
- Ask one question at a time
`

User Message: "Can you explain fractions?"
```

**AI responds:**
```
"Great question! Let me explain fractions in a simple way.

A fraction represents a part of a whole. Imagine you have a pizza 
cut into 4 equal slices. If you eat 1 slice, you've eaten 1/4 
(one-fourth) of the pizza.

The top number (1) shows how many parts you have.
The bottom number (4) shows how many parts make the whole.

Can you tell me: If you eat 2 slices out of 4, what fraction is that?"
```

### 5. **Student Answers Question**

**Student types:** "2/4"

**System grades:**
```typescript
POST /api/student/tutor/submit
{
  sessionId: "session-123",
  answer: "2/4"
}
```

**AI grades the answer:**
```typescript
Question: "If you eat 2 slices out of 4, what fraction is that?"
Correct Answer: "2/4 or 1/2"
Student Answer: "2/4"

AI Analysis:
{
  "isCorrect": true,
  "feedback": "Excellent! That's correct. 2/4 means 2 parts out of 4.",
  "hint": null
}
```

**System updates mastery:**
```typescript
StudentProgress.masteryScore: 0 → 5 (+5 for correct)
StudentProgress.xp: 0 → 10 (+10 XP)
StudentProgress.totalQuestions: 0 → 1
StudentProgress.correctAnswers: 0 → 1
StudentProgress.lastPracticedAt: NOW
```

**Student sees:**
```
✅ Correct! +10 XP
Mastery: 5/100
"Excellent! That's correct. 2/4 means 2 parts out of 4."
```

### 6. **System Adapts Automatically**

After 10 correct answers:
```typescript
Mastery: 50/100
↓
Mode changes: TEACH → PRACTICE
↓
Difficulty increases: EASY → MEDIUM
↓
Badge color changes: Blue → Green
```

After 20 correct answers:
```typescript
Mastery: 100/100
↓
Mode changes: PRACTICE → QUIZ
↓
Difficulty increases: MEDIUM → HARD
↓
Badge color changes: Green → Purple
```

---

## 🎯 The Four Teaching Modes

### 1. TEACH Mode (Mastery < 40)
**Purpose:** Introduce new concepts

**Behavior:**
- Explain concept in 5-8 lines
- Give 1 clear example
- Ask 1 check question
- Provide hints if student struggles

**Example:**
```
Tutor: "Fractions represent parts of a whole. 
        For example, 1/2 means one part out of two.
        Can you identify the fraction if you have 3 out of 5 apples?"

Student: "3/5"
Tutor: "Perfect! You got it! +10 XP"
```

### 2. PRACTICE Mode (Mastery 40-75)
**Purpose:** Reinforce learning

**Behavior:**
- Give 3 questions, one at a time
- Provide hints if needed
- Track common mistakes
- Mixed difficulty

**Example:**
```
Tutor: "Let's practice! Question 1: What is 1/2 + 1/4?"
Student: "I'm not sure..."
Tutor: "Hint: Find a common denominator. What number can both 2 and 4 divide into?"
Student: "4?"
Tutor: "Yes! So 1/2 = 2/4. Now add 2/4 + 1/4 = ?"
Student: "3/4"
Tutor: "Excellent! +10 XP. Next question..."
```

### 3. QUIZ Mode (Mastery > 75)
**Purpose:** Assess mastery

**Behavior:**
- 5-10 questions
- No hints
- Score at end
- Update mastery based on performance

**Example:**
```
Tutor: "Time for a quiz! Answer these 5 questions:
        1. What is 1/3 + 1/3?
        2. Simplify 4/8
        3. What is 3/4 - 1/4?
        ..."

[After all answers]
Tutor: "Quiz complete! Score: 4/5 (80%)
        Mastery: 100/100 ✅
        Topic mastered! +50 XP"
```

### 4. REVISE Mode (On Demand)
**Purpose:** Quick review

**Behavior:**
- Flashcard-style questions
- Quick recall
- Fill-in-the-blanks
- Timed rounds

**Example:**
```
Tutor: "Quick revision! Fill in the blank:
        A fraction has two parts: the _____ and the _____"

Student: "numerator and denominator"
Tutor: "Perfect! +5 XP. Next..."
```

---

## 📊 How Mastery Tracking Works

### Initial State:
```typescript
masteryScore: 0/100
totalQuestions: 0
correctAnswers: 0
xp: 0
streak: 0
```

### After Each Answer:
```typescript
if (correct) {
  masteryScore += 5  // Max 100
  xp += 10
  correctAnswers += 1
} else {
  masteryScore -= 3  // Min 0
  xp += 2  // Still reward for trying
}
totalQuestions += 1
lastPracticedAt = NOW
```

### Adaptive Difficulty:
```typescript
if (masteryScore < 40) {
  mode = "teach"
  difficulty = "easy"
} else if (masteryScore < 75) {
  mode = "practice"
  difficulty = "medium"
} else {
  mode = "quiz"
  difficulty = "hard"
}
```

---

## 🎯 Schedule-Based Teaching

### How It Works:

**1. ClassSchedule Table:**
```sql
classId: "class-123"
dayOfWeek: 1 (Monday)
startTime: "09:00"
endTime: "10:00"
subject: "Mathematics"
```

**2. Current Time Check:**
```typescript
NOW = Monday 9:15 AM
↓
Finds matching schedule
↓
Subject = "Mathematics"
```

**3. If Outside Schedule:**
```typescript
NOW = Monday 2:00 PM (no class)
↓
Mode = "Revision" or "Homework Help"
↓
Student can practice any subject
```

---

## 📚 Curriculum Integration

### How Teacher Content is Used:

**1. Lesson Plan:**
```json
{
  "title": "Introduction to Fractions",
  "objectives": [
    "Understand fractions as parts of a whole",
    "Identify numerator and denominator",
    "Compare simple fractions"
  ],
  "activities": [
    "Visual examples with pizza/chocolate",
    "Practice identifying fractions",
    "Compare 1/2 and 1/4"
  ]
}
```

**2. AI Prompt Includes:**
```typescript
System Prompt = `
TEACHER'S OBJECTIVES:
- Understand fractions as parts of a whole
- Identify numerator and denominator

TEACHER'S ACTIVITIES:
- Use visual examples (pizza, chocolate)
- Practice identifying fractions

Teach according to these objectives...
`
```

**3. AI Response Aligns:**
```
"Let me explain using a pizza example, just like your teacher planned!
A pizza cut into 4 slices..."
```

---

## 🔒 Security: Class Isolation

### How It's Enforced:

**Every Query Includes classId:**
```typescript
// Get student's progress
StudentProgress.findMany({
  where: {
    studentId: student.id,
    classId: student.classId  // ✅ ENFORCED
  }
})

// Get lesson plans
LessonPlan.findMany({
  where: {
    teacherId: student.teacherId,
    // Only lessons for this class
  }
})
```

**Session Validation:**
```typescript
// Verify session belongs to student
if (session.studentId !== student.id) {
  return 403 Forbidden
}

// Verify class matches
if (session.classId !== student.classId) {
  return 403 Forbidden
}
```

---

## 🎮 Engagement System

### XP Rewards:
- Correct answer: **+10 XP**
- Wrong answer: **+2 XP** (for trying)
- Complete session: **+50 XP**
- Daily streak: **+20 XP**

### Streaks:
- Practice on consecutive days
- Resets if student misses a day
- Motivates daily engagement

### Progress Visualization:
- Mastery bar (0-100%)
- XP counter
- Streak flame icon
- Questions answered

---

## 🚀 Complete Example Flow

### Monday 9:00 AM - First Time:

```
1. Student opens AI Tutor
   ↓
2. System checks: Monday 9:00 AM → Mathematics class
   ↓
3. Gets today's lesson: "Fractions"
   ↓
4. Checks mastery: 0/100 → TEACH mode
   ↓
5. Shows: "Ready to learn Fractions!"
   ↓
6. Student: "Can you explain?"
   ↓
7. AI: Explains + gives example + asks question
   ↓
8. Student answers correctly
   ↓
9. System: +5 mastery, +10 XP
   ↓
10. Continues teaching...
```

### After 10 Correct Answers:

```
Mastery: 50/100
Mode: TEACH → PRACTICE
Difficulty: EASY → MEDIUM
Badge: Blue → Green

"Great progress! Let's practice with some questions..."
```

### After 20 Correct Answers:

```
Mastery: 100/100
Mode: PRACTICE → QUIZ
Difficulty: MEDIUM → HARD
Badge: Green → Purple

"You've mastered the basics! Time for a quiz..."
```

---

## ✅ Key Features

1. **Autonomous** - Decides what to teach without human input
2. **Schedule-Based** - Knows what subject is NOW
3. **Curriculum-Aligned** - Uses teacher's lesson plans
4. **Adaptive** - Adjusts difficulty based on mastery
5. **Engaging** - XP, streaks, progress tracking
6. **Secure** - Strong class isolation
7. **Interactive** - Short cycles, always asks questions
8. **Intelligent** - AI-powered grading and feedback

---

## 🎓 The Result

Students get a **personalized tutor** that:
- Teaches the right subject at the right time
- Adapts to their learning pace
- Follows their teacher's curriculum
- Keeps them engaged with rewards
- Provides instant feedback
- Never gets tired or impatient

**It's like having a 1-on-1 tutor available 24/7!** 🚀
