import type { TourStep } from '@/components/tour/TourProvider'

const STEPS: TourStep[] = [
  {
    id: 'admin-welcome',
    title: 'Welcome to ElimuNova, School Administrator',
    content: `You have been entrusted with the administration of your school's digital transformation.

## Your Command Centre
- **Full School Oversight** — Every teacher, student, class, and financial transaction
- **AI-Powered Operations** — Timetable generation, curriculum planning, performance analytics
- **Real-Time Intelligence** — Live dashboards showing exactly what is happening across your school
- **Subscription Management** — Complete control over billing, packages, and access

Let us take you through the tools that put your school's success in your hands.`,
    placement: 'center',
  },
  {
    id: 'admin-dashboard',
    target: '[data-tour="admin-dashboard"]',
    title: 'Dashboard — Institutional Overview',
    content: `A comprehensive, real-time view of your entire school's health and performance.

## At a Glance
- **Student Population** — Total enrolled, active, and new registrations
- **Teacher Workforce** — Active teachers, pending approvals, subject coverage gaps
- **Financial Summary** — Revenue, pending payments, subscription status
- **Recent Activity** — New enrollments, completed classes, submitted assignments
- **Alert Centre** — Flagged issues requiring your immediate attention

Everything you need to know about your school, updated in real time.`,
    placement: 'right',
  },
  {
    id: 'admin-teachers',
    target: '[data-tour="admin-teachers"]',
    title: 'Teachers — Faculty Management',
    content: `Complete oversight of your teaching staff.

## Management Capabilities
- **Faculty Roster** — View all teachers, their qualifications, subjects, and class loads
- **Approval Workflow** — Review and approve new teacher registrations
- **Performance Metrics** — Track lesson completion rates, student feedback, and attendance
- **Assignment & Transfer** — Move teachers between classes or subjects as needed
- **Leave Management** — Monitor and approve leave requests
- **Communication** — Broadcast announcements to all or selected teachers

Build and manage your dream faculty.`,
    placement: 'right',
  },
  {
    id: 'admin-students',
    target: '[data-tour="admin-students"]',
    title: 'Students — Full Learner Lifecycle',
    content: `Every student's journey, from enrollment to graduation, tracked and managed.

## Student Management
- **Enrollment Dashboard** — New admissions, transfers, and withdrawals
- **Academic Tracking** — Performance across all subjects, teachers, and terms
- **Behavioural Records** — Flagged incidents, disciplinary actions, commendations
- **Attendance Monitoring** — Class-by-class attendance with automated parent alerts
- **Graduation Pipeline** — Track cohorts from admission to completion
- **Bulk Operations** — Import, export, and batch-update student records

No detail is too small when it comes to your students' success.`,
    placement: 'right',
  },
  {
    id: 'admin-courses',
    target: '[data-tour="admin-courses"]',
    title: 'Courses & Curriculum — Academic Architecture',
    content: `Design and manage your school's entire academic offering.

## Curriculum Tools
- **Course Catalogue** — Define every course, subject, and grade level offered
- **Curriculum Mapping** — Align courses to CBC, KNEC, or custom standards
- **Teacher Assignment** — Assign subject teachers with workload balancing
- **Pricing Configuration** — Set tuition fees per course, grade, or package
- **Prerequisite Chains** — Define learning pathways and progression requirements
- **Syllabus Management** — Upload and organise term-by-term syllabi

Your academic blueprint, fully configurable.`,
    placement: 'right',
  },
  {
    id: 'admin-curriculum',
    target: '[data-tour="admin-curriculum"]',
    title: 'Scheme of Work — Term Planning',
    content: `Plan an entire term's curriculum in minutes, not days.

## Planning Features
- **AI-Assisted Generation** — Input the subject and grade; receive a complete term scheme
- **Topic Sequencing** — Logically ordered topics with suggested time allocations
- **Resource Attachment** — Link lesson plans, worksheets, and assessments to each topic
- **Progress Tracking** — Monitor which topics have been covered by each teacher
- **KNEC Alignment** — Automatically aligned to national curriculum standards
- **Export** — Download as PDF or share digitally with your teachers

Strategic planning made effortless.`,
    placement: 'right',
  },
  {
    id: 'admin-timetable',
    target: '[data-tour="admin-timetable"]',
    title: 'Timetable — Intelligent Scheduling',
    content: `Generate optimal timetables that respect every constraint.

## Scheduling Intelligence
- **AI Timetable Generator** — Input teachers, subjects, rooms, and times; receive an optimised schedule
- **Conflict Resolution** — Automatic detection and suggestion for overlaps
- **Room Utilisation** — Maximise classroom usage with smart allocation
- **Teacher Preferences** — Respect staff availability and preferences
- **Student Groups** — Create and manage class groups for streaming
- **Live Updates** — Instant adjustments when changes are needed

Eliminate the headache of manual scheduling.`,
    placement: 'right',
  },
  {
    id: 'admin-activities',
    target: '[data-tour="admin-activities"]',
    title: 'Activities — Beyond the Classroom',
    content: `Manage the full spectrum of school life.

## Activity Management
- **Co-Curricular Programs** — Sports, clubs, societies, and competitions
- **Event Calendar** — School events, parent days, examination schedules
- **Sign-Up Management** — Track student participation and attendance
- **Resource Allocation** — Assign venues, equipment, and supervising staff
- **Budget Tracking** — Monitor activity expenditures against allocations

A holistic education requires holistic management.`,
    placement: 'right',
  },
  {
    id: 'admin-billing',
    target: '[data-tour="admin-billing"]',
    title: 'Billing & Revenue — Financial Control',
    content: `Complete financial intelligence for your school.

## Financial Dashboard
- **Revenue Overview** — Real-time income from tuition, subscriptions, and fees
- **Subscription Management** — View and manage all school subscriptions and packages
- **Invoice Generation** — Automated billing with manual override capability
- **Payment Tracking** — Monitor paid, pending, and overdue payments
- **Financial Reports** — Export detailed statements for audits and board meetings
- **Discount & Waiver Management** — Apply scholarships and financial aid

Full financial transparency, always.`,
    placement: 'right',
  },
  {
    id: 'admin-reports',
    target: '[data-tour="admin-reports"]',
    title: 'Reports & Analytics — Institutional Intelligence',
    content: `Data-driven insights for informed decision-making.

## Reporting Suite
- **Academic Performance** — School-wide grade analysis, subject performance, teacher effectiveness
- **Attendance Analytics** — Truancy patterns, chronic absenteeism flags
- **Financial Reports** — Revenue trends, collection efficiency, outstanding balances
- **Teacher Performance** — Lesson delivery metrics, student evaluation summaries
- **Comparative Analysis** — Term-over-term, year-over-year performance comparisons
- **Export & Share** — Generate professional PDF reports for stakeholders

Lead with evidence, not intuition.`,
    placement: 'right',
  },
  {
    id: 'admin-settings',
    target: '[data-tour="admin-settings"]',
    title: 'Settings — School Configuration',
    content: `Customise every aspect of your school's platform experience.

## Configuration Options
- **School Profile** — Name, logo, contact details, branding
- **Academic Calendar** — Term dates, holidays, examination periods
- **Grading System** — Define grade boundaries, pass marks, and reporting periods
- **Notification Templates** — Customise emails, SMS, and in-app alerts
- **Role Permissions** — Configure what teachers, staff, and students can access
- **Integration Settings** — Connect with external systems (SMS gateways, payment processors)

Your school, configured your way.`,
    placement: 'right',
  },
  {
    id: 'admin-notifications',
    title: 'System Alerts — Stay Ahead',
    content: `Intelligent alerts that keep you informed of everything requiring your attention.

## Alert Categories
- **Operational** — Subscription renewals, system limits, storage warnings
- **Academic** — Failing grades at scale, mass absenteeism, curriculum delays
- **Financial** — Payment defaults, subscription expirations, billing anomalies
- **Staffing** — Teacher shortages, pending approvals, leave conflicts
- **Custom** — Configure your own alert triggers based on your school's priorities

What gets measured, gets managed.`,
    placement: 'center',
  },
  {
    id: 'admin-final',
    title: 'You Are Ready, Administrator',
    content: `You now have complete command of your ElimuNova administrative platform.

## Your Priority Actions
1. **Review your dashboard** — Understand your school's current status
2. **Check teacher approvals** — Ensure all staff have access
3. **Verify curriculum alignment** — Confirm courses match your standards
4. **Explore the reports section** — Familiarise yourself with available analytics

## Ongoing Support
The **?** button at the bottom-right of your screen can restart this tour at any time.

You are not just managing a school — you are shaping the future of education.`,
    placement: 'center',
  },
]

export const SCHOOL_ADMIN_TOUR: { id: string; steps: TourStep[] } = {
  id: 'school-admin-onboarding',
  steps: STEPS,
}
