import type { TourStep } from '@/components/tour/TourProvider'

const STEPS: TourStep[] = [
  {
    id: 'admin-welcome',
    title: 'Welcome, Admin!',
    content: 'Welcome to your School Admin dashboard. You have full control over managing your school\'s teachers, students, courses, and more.',
    placement: 'center',
  },
  {
    id: 'admin-sidebar-dashboard',
    target: '[data-tour="admin-dashboard"]',
    title: 'Dashboard Overview',
    content: 'Your dashboard provides a high-level view of your school\'s performance, including student counts, revenue, and recent activity.',
    placement: 'right',
  },
  {
    id: 'admin-sidebar-teachers',
    target: '[data-tour="admin-teachers"]',
    title: 'Manage Teachers',
    content: 'View, add, and manage all teachers in your school. You can assign subjects, monitor performance, and handle approvals.',
    placement: 'right',
  },
  {
    id: 'admin-sidebar-students',
    target: '[data-tour="admin-students"]',
    title: 'Manage Students',
    content: 'Manage student enrollments, view profiles, track academic progress across all subjects and teachers.',
    placement: 'right',
  },
  {
    id: 'admin-sidebar-courses',
    target: '[data-tour="admin-courses"]',
    title: 'Courses',
    content: 'Create and manage your school\'s course offerings. Set pricing, assign teachers, and define the curriculum structure.',
    placement: 'right',
  },
  {
    id: 'admin-sidebar-curriculum',
    target: '[data-tour="admin-curriculum"]',
    title: 'Curriculum',
    content: 'Design your school\'s curriculum by defining subjects, topics, and learning objectives across grade levels.',
    placement: 'right',
  },
  {
    id: 'admin-sidebar-activities',
    target: '[data-tour="admin-activities"]',
    title: 'Activities',
    content: 'Track school-wide activities, events, and extracurricular programs. Manage sign-ups and participation.',
    placement: 'right',
  },
  {
    id: 'admin-sidebar-billing',
    target: '[data-tour="admin-billing"]',
    title: 'Billing & Revenue',
    content: 'Monitor school revenue, manage invoices, and handle financial reporting — all from this section.',
    placement: 'right',
  },
  {
    id: 'admin-sidebar-alerts',
    target: '[data-tour="admin-alerts"]',
    title: 'System Alerts',
    content: 'Stay informed about important system notifications, pending approvals, and school-wide announcements.',
    placement: 'right',
  },
]

export const SCHOOL_ADMIN_TOUR: { id: string; steps: TourStep[] } = {
  id: 'school-admin-onboarding',
  steps: STEPS,
}
