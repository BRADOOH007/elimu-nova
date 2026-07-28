import type { TourStep } from '@/components/tour/TourProvider'

const STEPS: TourStep[] = [
  {
    id: 'parent-welcome',
    title: 'Welcome, Parent!',
    content: 'Welcome to your Parent Dashboard. Here you can monitor your children\'s academic progress, communicate with teachers, and manage billing.',
    placement: 'center',
  },
  {
    id: 'parent-sidebar-dashboard',
    target: '[data-tour="parent-dashboard"]',
    title: 'Dashboard Overview',
    content: 'Your dashboard gives you a quick view of each child\'s recent activity, upcoming events, and any alerts that need your attention.',
    placement: 'right',
  },
  {
    id: 'parent-sidebar-children',
    target: '[data-tour="parent-children"]',
    title: 'My Children',
    content: 'View detailed profiles for each of your children, including their teachers, subjects, and overall performance.',
    placement: 'right',
  },
  {
    id: 'parent-sidebar-schedule',
    target: '[data-tour="parent-schedule"]',
    title: 'Schedule',
    content: 'See your children\'s class schedules at a glance. View upcoming sessions across all your children in one place.',
    placement: 'right',
  },
  {
    id: 'parent-sidebar-assignments',
    target: '[data-tour="parent-assignments"]',
    title: 'Assignments',
    content: 'Review assignments given to your children. Track submission status, due dates, and completed work.',
    placement: 'right',
  },
  {
    id: 'parent-sidebar-progress',
    target: '[data-tour="parent-progress"]',
    title: 'Progress Reports',
    content: 'View detailed academic progress reports for each child. Monitor grades, attendance, and teacher feedback.',
    placement: 'right',
  },
  {
    id: 'parent-sidebar-meetings',
    target: '[data-tour="parent-meetings"]',
    title: 'Parent-Teacher Meetings',
    content: 'Schedule and join meetings with your children\'s teachers. Manage availability and view past meeting notes.',
    placement: 'right',
  },
  {
    id: 'parent-sidebar-billing',
    target: '[data-tour="parent-billing"]',
    title: 'Billing & Payments',
    content: 'Manage your subscription, view invoices, update payment methods, and track your billing history.',
    placement: 'right',
  },
  {
    id: 'parent-sidebar-alerts',
    target: '[data-tour="parent-alerts"]',
    title: 'Alerts',
    content: 'Get important alerts about your children — missed classes, grade changes, upcoming deadlines, and school announcements.',
    placement: 'right',
  },
]

export const PARENT_TOUR: { id: string; steps: TourStep[] } = {
  id: 'parent-onboarding',
  steps: STEPS,
}
