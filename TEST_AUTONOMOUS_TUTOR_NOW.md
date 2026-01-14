# 🧪 Test the Autonomous AI Tutor NOW

## ✅ System is DEPLOYED and READY

---

## 🚀 Quick Test (5 minutes)

### Step 1: Start Your Dev Server
```bash
npm run dev
```

### Step 2: Login as Student
- Go to: `http://localhost:3000/auth/signin`
- Email: `jayson.gitehi@example.com`
- Password: Check your database or reset it

### Step 3: Test the Endpoints

#### Test 1: What to Teach Now
Open browser console and run:
```javascript
fetch('/api/student/tutor/next')
  .then(r => r.json())
  .then(console.log)
```

**Expected Response:**
```json
{
  "success": true,
  "task": {
    "subject": "Mathematics",  // Based on current day/time
    "topic": "...",
    "mode": "teach",
    "difficulty": "easy",
    "objective": "...",
    "estimatedMinutes": 10
  },
  "message": "Ready to teach ..."
}
```

#### Test 2: Send a Message
```javascript
fetch('/api/student/tutor/message', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: "Can you teach me about fractions?",
    task: {
      subject: "Mathematics",
      topic: "Fractions",
      mode: "teach",
      difficulty: "easy"
    }
  })
})
  .then(r => r.json())
  .then(console.log)
```

**Expected Response:**
```json
{
  "success": true,
  "response": "Let me explain fractions! A fraction represents...",
  "nextAction": { "type": "question" },
  "progress": 0,
  "xpEarned": 0,
  "task": { ... }
}
```

#### Test 3: Submit an Answer
First, you need a sessionId from Test 2, then:
```javascript
fetch('/api/student/tutor/submit', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    sessionId: "session-id-from-test-2",
    answer: "1/2"
  })
})
  .then(r => r.json())
  .then(console.log)
```

**Expected Response:**
```json
{
  "success": true,
  "result": {
    "isCorrect": true,
    "feedback": "Excellent! That's correct.",
    "masteryScore": 5,
    "xpEarned": 10,
    "nextMode": "teach"
  }
}
```

---

## 📊 Check the Database

### View Progress:
```sql
SELECT * FROM student_progress 
WHERE studentId = 'student-id'
ORDER BY masteryScore DESC;
```

### View Sessions:
```sql
SELECT * FROM tutor_sessions 
WHERE studentId = 'student-id'
ORDER BY createdAt DESC;
```

### View Schedules:
```sql
SELECT * FROM class_schedules 
WHERE classId = 'class-id';
```

---

## 🎯 What to Look For

### ✅ Success Indicators:
1. `/next` returns a task with subject from schedule
2. `/message` returns AI response with context
3. `/submit` updates mastery score
4. Database shows new progress records
5. XP is awarded correctly

### ❌ Common Issues:
1. **"No class assigned"** → Student needs classId
2. **"Invalid session"** → SessionId mismatch
3. **"Class mismatch"** → Security working correctly!
4. **Generic subject** → No schedule for current time

---

## 🔍 Debug Mode

### Enable Detailed Logging:
Add to your API routes:
```typescript
console.log('Student:', student)
console.log('Task:', task)
console.log('Response:', response)
```

### Check OpenAI Calls:
```typescript
// In tutor-orchestrator.ts
console.log('AI Prompt:', systemPrompt)
console.log('AI Response:', aiResponse)
```

---

## 📝 Test Checklist

- [ ] Server is running
- [ ] Logged in as student
- [ ] `/next` endpoint works
- [ ] Returns correct subject based on schedule
- [ ] `/message` endpoint works
- [ ] AI response is contextual
- [ ] `/submit` endpoint works
- [ ] Mastery score updates
- [ ] XP is awarded
- [ ] Database records created
- [ ] Class isolation enforced

---

## 🎓 Full Test Scenario

### Scenario: Student Learns Fractions

1. **Monday 9:00 AM** (Mathematics time)
   ```javascript
   // Call /next
   // Expected: subject="Mathematics", mode="teach"
   ```

2. **Start Learning**
   ```javascript
   // Call /message with "Teach me fractions"
   // Expected: Explanation + example + question
   ```

3. **Answer Question**
   ```javascript
   // Call /submit with answer
   // Expected: Graded, mastery +5, XP +10
   ```

4. **Continue Practice**
   ```javascript
   // Repeat steps 2-3 multiple times
   // Watch mastery increase: 0 → 5 → 10 → 15...
   ```

5. **Mode Changes**
   ```javascript
   // After mastery reaches 40
   // Expected: mode switches to "practice"
   
   // After mastery reaches 75
   // Expected: mode switches to "quiz"
   ```

6. **Check Progress**
   ```sql
   SELECT * FROM student_progress 
   WHERE topic = 'Fractions';
   -- Should show: masteryScore, xp, streak, etc.
   ```

---

## 🚀 Production Test

### Test with Real Data:
1. Create a real lesson plan for today
2. Add it to the database
3. Test if tutor uses it
4. Verify objectives appear in responses

### Test Schedule Awareness:
1. Check current day/time
2. Verify schedule has matching slot
3. Confirm tutor teaches that subject
4. Test at different times

### Test Mastery Adaptation:
1. Start with mastery = 0
2. Answer 5 questions correctly
3. Check if mastery = 25
4. Answer 5 more correctly
5. Check if mode changes at 40

---

## 📊 Expected Results

### After 10 Correct Answers:
- Mastery: 50/100
- XP: 100
- Mode: PRACTICE
- Streak: 1 (if first day)

### After 20 Correct Answers:
- Mastery: 100/100
- XP: 200
- Mode: QUIZ
- Topic: Mastered! 🎉

---

## 🎉 Success!

If all tests pass, you have a **fully functional autonomous AI tutoring system**!

The tutor:
- ✅ Knows what to teach (schedule-based)
- ✅ Adapts difficulty (mastery-based)
- ✅ Uses curriculum (lesson plans)
- ✅ Tracks progress (mastery scores)
- ✅ Engages students (XP, streaks)
- ✅ Enforces security (class isolation)

**Ready to revolutionize learning!** 🚀🎓
