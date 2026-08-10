# Elimu Nova — Independent USA Parent Demo

## Flow: Parent Signup → Child Learning → Monitoring

---

### Step 1: Parent Creates Account
```
Go to: elimunova.com → Sign Up

Account Type: [Parent]
First Name: Sarah
Last Name: Williams  
Email: sarah.w@email.com
Password: ********

Country: 🇺🇸 United States
Curriculum: Common Core (Grade 1-12)
Grade for parent: (automatically hidden)

→ Account created. Parent logged in immediately.
→ 14-day free trial starts automatically.
```

### Step 2: Parent Enrolls Children
```
Dashboard → [+ Add Child] button

Number of children: [2]

Child 1:
  First Name: James
  Last Name: Williams
  Grade: Grade 4
  Username preview: james.williams (auto-generated)

Child 2:
  First Name: Emma
  Last Name: Williams  
  Grade: Grade 2
  Username preview: emma.williams

→ [Enroll 2 Children]
→ Credentials displayed immediately — copy and share
```

### Step 3: Student Logs In (James, Grade 4)
```
Sign In → james.williams / password

Dashboard shows:
→ "Self-Paced" badge (emerald green)
→ "Hi, James!" greeting with XP and streak
→ My Learning Areas: Common Core subjects
→ Start Learning button
→ No billing visible (children never see billing)

Navigation:
→ Learn → pick subject + topic → AI generates lesson
→ 3-Phase Active Recall: Preview → Learn → Recall (MCQ quiz)
→ Hope AI tutor available for any question
→ Floating Notes widget (auto-saves)
→ Gamification: XP, levels, streaks, daily challenge
```

### Step 4: Student Takes Quiz
```
Learn page → Complete lesson → [Take Quiz]

→ 10 multiple-choice questions (all MCQ, auto-graded)
→ Instant score + XP awarded
→ Wrong answers go to Mistake Bank for review
→ Score visible to parent and teacher
```

### Step 5: Parent Monitors Progress
```
Parent Dashboard shows:
→ My Children: James (Grade 4) + Emma (Grade 2)
→ Children card → click → see full details:
   - Average Grade, Pending Work, Streak Days
   - Login Credentials (username + show/hide password)
   - Regenerate Password button
→ Progress tab: grades, completed assignments
→ AI Alerts: flags if child struggles
→ Danger Zone: Delete Child Profile (COPPA/GDPR compliant)
```

### Step 6: Parent Manages Billing
```
Billing page:
→ 14-day free trial status
→ Upgrade to Premium ($9.99/month)
→ Payment Methods: Credit/Debit Card, Apple Pay, Google Pay, ACH
→ (M-Pesa HIDDEN — USA only)
→ Invoice history
```

### Step 7: Super Admin View
```
Super Admin → Users:
→ Sarah Williams | PARENT | 🇺🇸 | Common Core | Independent badge
→ James Williams | STUDENT | Self-Paced | Independent badge
→ Emma Williams | STUDENT | Self-Paced | Independent badge
→ Full user management: edit, deactivate, regenerate password
```

---

## Key Differentiators (Independent vs School)

| Feature | Independent | School-Connected |
|---------|:----------:|:----------------:|
| Curriculum | Parent chooses at signup | School determines |
| Grade | Parent assigns per child | School assigns |
| Enrollment | Parent creates child accounts | Admin/Teacher enrolls |
| Billing | Parent pays | School pays |
| Teacher | AI Tutor (Hope) | Real teacher + AI |
| Parent Dashboard | Add Child, Billing, Credentials | View Children, Messages, School Life |
| Sidebar | Overview, Children, Progress, Billing, Settings | Overview, Children, School Life, Progress, Messages, Settings |

---

## URLs to Demo

| Page | Path |
|------|------|
| Signup | `/auth/signup` |
| Parent Dashboard | `/parent/dashboard` |
| Enroll Child | `/parent/dashboard` → Add Child button |
| Student Dashboard | `/student/dashboard` |
| Student Learn | `/student/learn` |
| Student Quizzes | `/student/lesson-plans?tab=quizzes` |
| Parent Billing | `/parent/billing` |
| Child Credentials | `/parent/children/[id]` |
| Privacy Policy | `/privacy` |
