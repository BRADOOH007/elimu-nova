import type { TourStep } from '@/components/tour/TourProvider'

const STEPS: TourStep[] = [
  {
    id: 'teacher-welcome',
    title: 'Welcome to ElimuNova, Teacher',
    content: `You are now at the helm of Kenya's most advanced AI-powered learning platform.

## What Awaits You
- **AI Lesson Planning** — Generate complete, curriculum-aligned lesson plans in under 60 seconds
- **Smart Marking** — Auto-grade assignments with AI-powered feedback for each student
- **Live Classes** — Conduct interactive sessions with whiteboard, screen sharing, and recordings
- **Real-time Analytics** — Track every student's progress, performance trends, and learning gaps

Let us walk you through your command centre.`,
    placement: 'center',
  },
  {
    id: 'teacher-dashboard',
    target: '[data-tour="teacher-dashboard"]',
    title: 'Dashboard — Your Mission Control',
    content: `This is your personalised command centre. Every time you log in, you get an instant snapshot of what matters most.

## At a Glance
- Upcoming classes and sessions scheduled for today
- Recent student activity and submissions requiring your attention
- Quick-access AI tools for lesson generation and quiz creation
- Performance alerts flagging students who may need intervention

Use this as your daily launchpad — everything you need is one click away.`,
    placement: 'right',
  },
  {
    id: 'teacher-students',
    target: '[data-tour="teacher-students"]',
    title: 'Students — Complete Learner Profiles',
    content: `A comprehensive view of every student under your guidance.

## Capabilities
- **Individual Profiles** — View academic history, attendance patterns, and behavioural notes
- **Progress Tracking** — Monitor performance across subjects with visual trend charts
- **Intervention Tools** — Flag at-risk students and assign remedial work directly
- **Parent Communication** — Share progress reports and schedule parent-teacher meetings

No student falls through the cracks.`,
    placement: 'right',
  },
  {
    id: 'teacher-schedule',
    target: '[data-tour="teacher-schedule"]',
    title: 'Schedule — Intelligent Time Management',
    content: `Your timetable, intelligently organised.

## Key Features
- **Weekly View** — See all your classes, office hours, and meetings in one place
- **Availability Management** — Set your working hours; students book slots accordingly
- **AI Timetable Suggestions** — Optimal scheduling recommendations based on your patterns
- **Conflict Detection** — Automatic alerts if any session overlaps

Spend less time organising, more time teaching.`,
    placement: 'right',
  },
  {
    id: 'teacher-assignments',
    target: '[data-tour="teacher-assignments"]',
    title: 'Assignments — Create, Distribute, Grade',
    content: `A complete assignment lifecycle management system.

## Workflow
- **Create** — Attach resources, set deadlines, define grading rubrics
- **Distribute** — Assign to individuals, groups, or entire classes instantly
- **Auto-Grade** — AI marks objective questions and provides suggested scores for subjective
- **Personalised Feedback** — Every student receives individual comments on their work
- **Analytics** — Class-wide performance distribution and question-level difficulty analysis

From creation to feedback, all in one seamless flow.`,
    placement: 'right',
  },
  {
    id: 'teacher-ai-tools',
    target: '[data-tour="teacher-ai-tools"]',
    title: 'AI Toolkit — Your Teaching Assistant',
    content: `ElimuNova's AI suite is designed to amplify your impact, not replace your expertise.

## Available AI Tools
- **Lesson Plan Generator** — Input topic and grade; receive a full lesson plan with objectives, activities, and assessments
- **Quiz Creator** — Generate custom quizzes with varying difficulty levels in seconds
- **Presentation Builder** — Turn any lesson into a professional PowerPoint deck
- **Scheme of Work Generator** — Plan an entire term's curriculum aligned to KNEC standards
- **AI Tutor** — Let students ask questions and receive explanations in a safe, controlled environment

Your 24/7 teaching assistant that never sleeps.`,
    placement: 'right',
  },
  {
    id: 'teacher-live-classes',
    target: '[data-tour="teacher-live-classes"]',
    title: 'Live Classes — Immersive Virtual Classroom',
    content: `Conduct engaging, interactive sessions that rival in-person teaching.

## Session Features
- **Interactive Whiteboard** — Real-time drawing, text, and annotation tools with touch support
- **Screen Sharing** — Present slides, documents, or any application
- **Raise Hand** — Students signal for attention without disrupting the flow
- **Chat** — Side-channel for questions and discussions
- **Recordings** — Every session is recorded and available for replay
- **Google Meet Integration** — One-click meeting launch

Deliver lessons that captivate, whether your students are next door or across the country.`,
    placement: 'right',
  },
  {
    id: 'teacher-analytics',
    target: '[data-tour="teacher-analytics"]',
    title: 'Analytics — Data-Driven Instruction',
    content: `Move beyond intuition. Make instructional decisions backed by real data.

## Analytics Dashboard
- **Class Performance** — Average scores, completion rates, and grade distributions
- **Student Rankings** — Identify top performers and those needing additional support
- **Subject Analysis** — Break down performance by topic to pinpoint weak areas
- **Trend Tracking** — Compare performance across weeks, months, and terms
- **Export Reports** — Download comprehensive reports for parent meetings or school administration

Know exactly where each student stands, at all times.`,
    placement: 'right',
  },
  {
    id: 'teacher-meetings',
    target: '[data-tour="teacher-calendar"]',
    title: 'Meetings — Seamless Collaboration',
    content: `Connect with students, parents, and colleagues through integrated video conferencing.

## Meeting Management
- **Schedule Sessions** — One-time or recurring meetings with automatic reminders
- **Parent-Teacher Conferences** — Structured meetings with progress report sharing
- **Integration** — Works with Google Meet and Zoom for a familiar experience
- **Recording Library** — Access past session recordings for review
- **Attendance Tracking** — Automatic logging of who attended and for how long

Communication without friction.`,
    placement: 'right',
  },
  {
    id: 'teacher-billing',
    target: '[data-tour="teacher-billing"]',
    title: 'Billing & Earnings — Financial Clarity',
    content: `Full transparency into your earnings and account management.

## Financial Tools
- **Earnings Dashboard** — Track your revenue with detailed breakdowns
- **Payment History** — Complete record of all transactions
- **Payout Management** — Configure payment methods and withdrawal schedules
- **Invoice Generation** — Automatic invoices for your records
- **Subscription Management** — View and manage your plan

Your financial data, always accessible and always accurate.`,
    placement: 'right',
  },
  {
    id: 'teacher-alerts',
    target: '[data-tour="teacher-activity-log"]',
    title: 'Alerts & Notifications — Stay Informed',
    content: `Never miss what matters. Intelligent alerts keep you ahead of the curve.

## Notification Categories
- **Academic Alerts** — Late submissions, failing grades, attendance concerns
- **Schedule Reminders** — Upcoming classes, meetings, and deadlines
- **Student Activity** — New sign-ups, profile changes, parent inquiries
- **System Announcements** — Platform updates, new features, maintenance notices
- **Custom Preferences** — Configure exactly which alerts you receive and how (in-app, email, SMS)

Information when you need it, where you need it.`,
    placement: 'right',
  },
  {
    id: 'teacher-final',
    title: 'You Are Ready, Teacher',
    content: `You now have a complete understanding of your ElimuNova teaching platform.

## What You Can Do Today
1. **Generate your first lesson plan** — Takes under 60 seconds
2. **Review your class roster** — Get to know your students' profiles
3. **Create your first assignment** — Set it up and let AI help with grading
4. **Schedule a live class** — Experience the interactive whiteboard

## Pro Tip
The **?** button at the bottom-right of your screen relaunches this tour anytime you need a refresher.

Welcome aboard. Transform education, one student at a time.`,
    placement: 'center',
  },
]

export const TEACHER_TOUR: { id: string; steps: TourStep[] } = {
  id: 'teacher-onboarding',
  steps: STEPS,
}
