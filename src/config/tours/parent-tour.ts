import type { TourStep } from '@/components/tour/TourProvider'

const STEPS: TourStep[] = [
  {
    id: 'parent-welcome',
    title: 'Welcome to ElimuNova, Parent',
    content: `You are now connected to your child's educational journey like never before.

## Your Portal
- **Real-Time Visibility** — See what your child is learning, how they are performing, and where they need support
- **Direct Communication** — Message teachers, schedule meetings, and receive progress updates
- **Financial Management** — Handle subscriptions, payments, and billing in one place
- **AI-Powered Insights** — Get intelligent recommendations on how to support your child's learning

Let us show you how to make the most of your parent portal.`,
    placement: 'center',
  },
  {
    id: 'parent-dashboard',
    target: '[data-tour="parent-dashboard"]',
    title: 'Dashboard — Your Family Overview',
    content: `A unified view of all your children's academic lives.

## What You Will See
- **Each Child's Snapshot** — Current grades, recent assignments, attendance streak
- **Upcoming Events** — Parent-teacher meetings, exams, school events
- **Alert Summary** — Any issues requiring your immediate attention
- **Quick Actions** — Pay fees, message a teacher, view a report
- **Financial Status** — Subscription validity and payment due dates

One dashboard, all your children, complete peace of mind.`,
    placement: 'right',
  },
  {
    id: 'parent-children',
    target: '[data-tour="parent-children"]',
    title: 'My Children — Detailed Learner Profiles',
    content: `Deep insights into each child's educational journey.

## Profile Contents
- **Academic Performance** — Grades across all subjects with trend analysis
- **Attendance Records** — Class-by-class attendance with absence reasons
- **Teacher Feedback** — Notes and observations from each subject teacher
- **Behavioural Reports** — Commendations, conduct records, and any flagged concerns
- **Timetable** — Your child's complete weekly schedule
- **Documents** — Report cards, certificates, and important communications

Know more than just the grades — understand the full picture.`,
    placement: 'right',
  },
  {
    id: 'parent-progress',
    target: '[data-tour="parent-progress"]',
    title: 'Progress Reports — Academic Intelligence',
    content: `Comprehensive progress reporting that goes beyond simple scores.

## Report Features
- **Subject Performance** — Detailed breakdown by subject with teacher comments
- **Comparative Analysis** — How your child is performing relative to class averages
- **Strengths & Weaknesses** — AI-identified areas of excellence and topics needing improvement
- **Progress Over Time** — Track improvement across terms and academic years
- **Download Reports** — Official report cards and progress summaries in PDF format
- **Automatic Updates** — Receive notifications when new reports are published

No more waiting for end-of-term — know your child's progress in real time.`,
    placement: 'right',
  },
  {
    id: 'parent-schedule',
    target: '[data-tour="parent-schedule"]',
    title: 'Schedule — Family Academic Calendar',
    content: `Every class, event, and meeting across all your children, consolidated.

## Schedule View
- **Weekly Overview** — See all your children's classes side by side
- **Exam Timetables** — Upcoming tests and examination schedules
- **School Events** — Sports days, concerts, parent gatherings
- **Holiday Calendar** — Term breaks and public holidays
- **Meeting Schedule** — Upcoming parent-teacher conferences
- **Colour Coding** — Each child's commitments in their own colour

Your family's academic life, beautifully organised.`,
    placement: 'right',
  },
  {
    id: 'parent-assignments',
    title: 'Assignments — Track Homework & Submissions',
    content: `Stay on top of your children's coursework without hovering.

## Assignment Tracking
- **All Assignments View** — See every task across all subjects and children
- **Deadline Monitoring** — Know what is due, what is submitted, and what is overdue
- **Grade Notifications** — Instant alerts when assignments are graded
- **Submission History** — Review past work and teacher feedback
- **Effort Indicators** — See how much time each assignment should take versus what was spent

Support your child's independence while staying informed.`,
    placement: 'center',
  },
  {
    id: 'parent-meetings',
    target: '[data-tour="parent-messages"]',
    title: 'Parent-Teacher Meetings — Collaborative Partnership',
    content: `Meaningful engagement with your child's educators, made effortless.

## Meeting Management
- **Schedule Conferences** — Book time with any of your child's teachers
- **Join Virtually** — Attend meetings from anywhere via integrated video
- **Prepare with Context** — View recent grades and teacher notes before each meeting
- **Meeting History** — Access notes and action items from past meetings
- **Automatic Reminders** — Never miss a scheduled conference
- **Multiple Teachers** — Consecutive or group meetings for comprehensive reviews

Partnership between home and school is the foundation of success.`,
    placement: 'right',
  },
  {
    id: 'parent-billing',
    target: '[data-tour="parent-billing"]',
    title: 'Billing & Payments — Financial Management',
    content: `Complete control over your educational investments.

## Financial Dashboard
- **Subscription Status** — Current plan, renewal dates, and feature access
- **Payment History** — Complete transaction records with receipts
- **Invoice Management** — View and download all invoices
- **Payment Methods** — Securely manage your payment information
- **Auto-Renewal** — Configure automatic subscription renewal preferences
- **Fee Breakdown** — Understand exactly what you are paying for

Transparent, secure, and always under your control.`,
    placement: 'right',
  },
  {
    id: 'parent-communication',
    target: '[data-tour="parent-messages"]',
    title: 'Alerts & Communication — Stay Connected',
    content: `Intelligent notifications that keep you informed without overwhelming you.

## Communication Channels
- **Academic Alerts** — Grade changes, missing assignments, attendance flags
- **School Announcements** — Important updates from the school administration
- **Teacher Messages** — Direct communication from your child's teachers
- **Financial Notifications** — Payment reminders, invoice available, subscription expiring
- **Custom Preferences** — Choose what you receive and how (in-app, email, SMS)
- **Quiet Hours** — Configure times when non-urgent notifications are held

The right information, at the right time, through the right channel.`,
    placement: 'right',
  },
  {
    id: 'parent-final',
    title: 'You Are Ready, Parent',
    content: `You are now fully equipped to be an engaged, informed partner in your child's education.

## Recommended First Steps
1. **Visit your dashboard** — See an overview of each child's current status
2. **Review progress reports** — Understand where your children excel and where they need support
3. **Schedule a meeting** — Introduce yourself to your children's teachers
4. **Set notification preferences** — Configure alerts to match your preference

## Always Available
The **?** button at the bottom-right of your screen can restart this tour whenever you need a refresher.

Together, we ensure your child receives nothing less than an exceptional education.`,
    placement: 'center',
  },
]

export const PARENT_TOUR: { id: string; steps: TourStep[] } = {
  id: 'parent-onboarding',
  steps: STEPS,
}
