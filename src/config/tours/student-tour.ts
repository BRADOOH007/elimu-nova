import type { TourStep } from '@/components/tour/TourProvider'

const STEPS: TourStep[] = [
  {
    id: 'student-welcome',
    title: 'Welcome to ElimuNova, Student',
    content: `Your personal AI-powered learning journey begins here.

## What Makes ElimuNova Different
- **Adaptive AI Tutor** — Learns your strengths and weaknesses, adapts to your pace
- **Curriculum-Aligned** — Everything follows the Kenyan Competency-Based Curriculum (CBC)
- **Interactive Live Classes** — Real-time sessions with your teachers, from anywhere
- **Instant Feedback** — Know how you performed moments after submitting your work

Your success is our mission. Let us show you around.`,
    placement: 'center',
  },
  {
    id: 'student-dashboard',
    target: '[data-tour="student-dashboard"]',
    title: 'Dashboard — Your Learning Hub',
    content: `Your personalised command centre for everything academic.

## What You Will See
- **Today's Schedule** — Upcoming classes and sessions at a glance
- **Pending Assignments** — Never miss a deadline with clear due-date indicators
- **Recent Grades** — Instant access to your most recent assessment results
- **Learning Streak** — Your attendance and submission consistency tracked
- **Quick Actions** — Join live class, start homework, or ask the AI tutor

Everything you need, the moment you log in.`,
    placement: 'right',
  },
  {
    id: 'student-schedule',
    target: '[data-tour="student-schedule"]',
    title: 'Schedule — Your Academic Calendar',
    content: `A complete view of your time at school.

## Features
- **Weekly Timetable** — All your classes, sessions, and events in one place
- **Book Sessions** — Reserve one-on-one time with your teachers based on their availability
- **Automatic Reminders** — Never miss a class with built-in notifications
- **Colour-Coded Subjects** — Quickly identify different subjects and lesson types

Stay organised, stay ahead.`,
    placement: 'right',
  },
  {
    id: 'student-assignments',
    target: '[data-tour="student-assignments"]',
    title: 'Assignments — Your Work Dashboard',
    content: `Complete control over your academic submissions.

## How It Works
- **View All Tasks** — See every assignment across all subjects in one unified list
- **Track Deadlines** — Colour-coded urgency indicators help you prioritise
- **Submit Work** — Upload documents, images, or type directly into the platform
- **AI Feedback** — Receive instant, personalised feedback on your submissions
- **Grade History** — Track your performance across every assignment ever submitted

Work smarter, not harder.`,
    placement: 'right',
  },
  {
    id: 'student-ai-tutor',
    target: '[data-tour="student-ai-tutor"]',
    title: 'AI Tutor — Your Personal Learning Assistant',
    content: `Available 24/7, the AI Tutor is like having a teacher in your pocket.

## What You Can Ask
- **Explain Concepts** — "Explain photosynthesis in simple terms"
- **Practice Questions** — "Give me practice problems on algebra"
- **Homework Help** — "Walk me through solving this equation step by step"
- **Study Tips** — "Create a revision schedule for my end-of-term exams"
- **Subject Deep Dives** — "Tell me about the history of the Mau Mau"

The AI adapts to your level. The more you use it, the better it understands you.`,
    placement: 'right',
  },
  {
    id: 'student-progress',
    target: '[data-tour="student-progress"]',
    title: 'Progress Tracking — Know Your Growth',
    content: `See not just your grades, but your trajectory.

## Analytics Available
- **Grade Overview** — Current scores across all subjects with visual indicators
- **Performance Trends** — Charts showing your improvement (or decline) over time
- **Subject Breakdown** — Which topics you excel at and which need more attention
- **Class Ranking** — See where you stand among your peers (anonymous)
- **Attendance Record** — Your class participation history

Data is power. Use it to take control of your learning.`,
    placement: 'right',
  },
  {
    id: 'student-live-classes',
    title: 'Live Classes — Interactive Learning',
    content: `Experience the classroom from wherever you are.

## What to Expect
- **Interactive Whiteboard** — Watch your teacher explain concepts in real time
- **Raise Hand** — Signal when you have a question without interrupting
- **Chat** — Ask questions and participate in discussions
- **Screen Sharing** — Follow along with presentations and demonstrations
- **Session Recordings** — Replay any class whenever you need to revise
- **Google Meet** — Seamless video integration for a familiar experience

Learning has no boundaries.`,
    placement: 'center',
  },
  {
    id: 'student-meetings',
    target: '[data-tour="student-messages"]',
    title: 'Meetings & Messages — Connect With Your Teachers',
    content: `One-on-one time with your teachers, made simple.

## Features
- **Direct Messaging** — Send and receive messages from your teachers in real time
- **Book Sessions** — Schedule one-on-one time with any of your teachers
- **Join With One Click** — No complicated setup, just click and connect
- **Past Recordings** — Review previous sessions if you missed something
- **Parent Invites** — Your parents can join parent-teacher meetings too

Support when you need it, how you need it.`,
    placement: 'right',
  },
  {
    id: 'student-achievements',
    title: 'Achievements & Rewards — Celebrating Your Success',
    content: `Your hard work deserves recognition.

## Recognition System
- **Badges** — Earn badges for streaks, top grades, and consistent submissions
- **Milestones** — Celebrate when you complete terms, master subjects, or hit learning goals
- **Leaderboards** — Friendly competition with classmates (opt-in)
- **Certificates** — Downloadable achievement certificates for your portfolio

Every step forward is worth celebrating.`,
    placement: 'center',
  },
  {
    id: 'student-alerts',
    title: 'Notifications — Stay in the Loop',
    content: `Never miss what matters to your academic life.

## What Gets Notified
- **New Assignments** — Know the moment work is assigned
- **Grade Updates** — See your results as soon as they are published
- **Schedule Changes** — Class cancellations or room changes
- **Teacher Messages** — Direct communication from your teachers
- **Deadline Reminders** — 24-hour, 1-hour, and 15-minute warnings

Configure your preferences to receive alerts via in-app, email, or SMS.`,
    placement: 'right',
  },
  {
    id: 'student-final',
    title: 'You Are Ready, Student',
    content: `You now know everything you need to thrive on ElimuNova.

## Your First Steps
1. **Check your dashboard** — See what is scheduled for today
2. **Review pending assignments** — Prioritise your workload
3. **Meet the AI Tutor** — Ask it a question about a topic you are studying
4. **Join your first live class** — Experience interactive learning

## Remember
The **?** button at the bottom-right of your screen can restart this tour anytime.

Your education, amplified by AI. Make the most of it.`,
    placement: 'center',
  },
]

export const STUDENT_TOUR: { id: string; steps: TourStep[] } = {
  id: 'student-onboarding',
  steps: STEPS,
}
