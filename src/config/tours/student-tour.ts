import type { TourStep } from '@/components/tour/TourProvider'

const STEPS: TourStep[] = [
  {
    id: 'student-welcome',
    title: 'Welcome, Student!',
    content: 'Welcome to your learning dashboard! This is your hub for classes, assignments, and tracking your progress.',
    placement: 'center',
  },
  {
    id: 'student-sidebar-dashboard',
    target: '[data-tour="student-dashboard"]',
    title: 'Your Dashboard',
    content: 'Your main dashboard shows upcoming classes, recent grades, and any pending assignments that need your attention.',
    placement: 'right',
  },
  {
    id: 'student-sidebar-schedule',
    target: '[data-tour="student-schedule"]',
    title: 'Class Schedule',
    content: 'View your upcoming classes and sessions. Book new sessions with your teachers based on available slots.',
    placement: 'right',
  },
  {
    id: 'student-sidebar-assignments',
    target: '[data-tour="student-assignments"]',
    title: 'Assignments',
    content: 'See all your assignments here. Submit your work, track deadlines, and check your grades once they\'re reviewed.',
    placement: 'right',
  },
  {
    id: 'student-sidebar-progress',
    target: '[data-tour="student-progress"]',
    title: 'Progress Tracking',
    content: 'Monitor your academic performance over time. View grades by subject and see how you\'re improving.',
    placement: 'right',
  },
  {
    id: 'student-sidebar-meetings',
    target: '[data-tour="student-meetings"]',
    title: 'Meetings',
    content: 'Join scheduled video calls with your teachers. You can also review recordings of past sessions.',
    placement: 'right',
  },
  {
    id: 'student-sidebar-alerts',
    target: '[data-tour="student-alerts"]',
    title: 'Notifications',
    content: 'Get notified about new assignments, grade updates, and important announcements from your school.',
    placement: 'right',
  },
]

export const STUDENT_TOUR: { id: string; steps: TourStep[] } = {
  id: 'student-onboarding',
  steps: STEPS,
}
