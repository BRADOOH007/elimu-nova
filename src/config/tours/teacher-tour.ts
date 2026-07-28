import type { TourStep } from '@/components/tour/TourProvider'

const STEPS: TourStep[] = [
  {
    id: 'teacher-welcome',
    title: 'Welcome, Teacher!',
    content: 'This is your Teacher Dashboard. Let\'s walk through the key tools available to you so you can get started right away.',
    placement: 'center',
  },
  {
    id: 'teacher-sidebar-dashboard',
    target: '[data-tour="teacher-dashboard"]',
    title: 'Dashboard Overview',
    content: 'This is your main dashboard. Here you can see your schedule, recent activity, and quick stats about your students.',
    placement: 'right',
  },
  {
    id: 'teacher-sidebar-students',
    target: '[data-tour="teacher-students"]',
    title: 'Students',
    content: 'View and manage your students from here. You can see individual progress, assign work, and track performance.',
    placement: 'right',
  },
  {
    id: 'teacher-sidebar-schedule',
    target: '[data-tour="teacher-schedule"]',
    title: 'Schedule',
    content: 'Manage your classes, set availability, and view your timetable. Students can book slots based on your availability.',
    placement: 'right',
  },
  {
    id: 'teacher-sidebar-assignments',
    target: '[data-tour="teacher-assignments"]',
    title: 'Assignments',
    content: 'Create and manage assignments here. You can attach resources, set due dates, and grade submissions.',
    placement: 'right',
  },
  {
    id: 'teacher-sidebar-meetings',
    target: '[data-tour="teacher-meetings"]',
    title: 'Meetings',
    content: 'Schedule and join video conferences with students and parents. Integrates with Zoom for seamless meetings.',
    placement: 'right',
  },
  {
    id: 'teacher-sidebar-billing',
    target: '[data-tour="teacher-billing"]',
    title: 'Billing & Earnings',
    content: 'Track your earnings, manage payment methods, and view billing history — all in one place.',
    placement: 'right',
  },
  {
    id: 'teacher-sidebar-alerts',
    target: '[data-tour="teacher-alerts"]',
    title: 'Alerts & Notifications',
    content: 'Stay updated with important alerts about your students, upcoming deadlines, and system announcements.',
    placement: 'right',
  },
]

export const TEACHER_TOUR: { id: string; steps: TourStep[] } = {
  id: 'teacher-onboarding',
  steps: STEPS,
}
