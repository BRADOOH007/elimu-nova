# Setup Instructions for Autonomous AI Tutor

## ⚠️ IMPORTANT: Run These Commands in Order

### Step 1: Generate Prisma Client with New Schema
```bash
npx prisma generate
```

This will generate the TypeScript types for the new models and fields.

### Step 2: Create Database Migration
```bash
npx prisma migrate dev --name autonomous-tutor
```

This will:
- Create a new migration file
- Apply the schema changes to your database
- Regenerate the Prisma Client

### Step 3: Run Data Migration
```bash
npx tsx scripts/migrate-autonomous-tutor-schema.ts
```

This will:
- Update existing StudentProgress records with new fields
- Update existing AITutorSession records with classId
- Create sample ClassSchedule entries for testing

### Step 4: Test the System
```bash
npx tsx scripts/test-autonomous-tutor.ts
```

This will verify:
- Database schema is correct
- Students have classes assigned
- Schedules are created
- Progress tracking works
- Class isolation is enforced

---

## 🔧 If You Get Errors

### Error: "Property 'tutorSession' does not exist"
**Solution:** Run `npx prisma generate` to regenerate the Prisma Client

### Error: "Property 'masteryScore' does not exist"
**Solution:** Run `npx prisma migrate dev` to apply the schema changes

### Error: "Property 'classSchedule' does not exist"
**Solution:** Run `npx prisma generate` after the migration

### Error: Migration conflicts
**Solution:** 
```bash
npx prisma migrate reset
npx prisma migrate dev --name autonomous-tutor
npx tsx scripts/migrate-autonomous-tutor-schema.ts
```

---

## 📝 What Gets Created

### New Database Tables:
1. **tutor_sessions** - Active tutoring sessions
2. **class_schedules** - Timetable for each class
3. **tutor_questions** - Question bank

### Updated Tables:
1. **student_progress** - Now has mastery tracking
2. **ai_tutor_sessions** - Now has classId and mode

### New Fields:
- StudentProgress: `classId`, `subject`, `topic`, `masteryScore`, `xp`, `streak`, etc.
- AITutorSession: `classId`, `mode`, `conversationHistory`, etc.

---

## ✅ Verification

After running all steps, you should see:
- ✅ No TypeScript errors in the code
- ✅ New tables in your database
- ✅ Sample schedules created
- ✅ Existing data migrated

---

## 🚀 Next: Test the API

Once setup is complete, you can test the API endpoints:

### Test 1: Get Next Task
```bash
curl -X GET http://localhost:3000/api/student/tutor/next \
  -H "Cookie: your-session-cookie"
```

### Test 2: Send Message
```bash
curl -X POST http://localhost:3000/api/student/tutor/message \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie" \
  -d '{"message": "Can you teach me about fractions?"}'
```

### Test 3: Submit Answer
```bash
curl -X POST http://localhost:3000/api/student/tutor/submit \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie" \
  -d '{"sessionId": "session-id", "answer": "1/2"}'
```

---

## 📚 Documentation

See `AUTONOMOUS_TUTOR_IMPLEMENTATION.md` for complete documentation of:
- System architecture
- API endpoints
- Security features
- Teaching modes
- Mastery tracking
- Deployment guide
