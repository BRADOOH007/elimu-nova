import type { TourStep } from '@/components/tour/TourProvider'

export const STUDENT_TOUR = {
  id: 'student-onboarding',
  steps: [
    {
      id: 'student-welcome',
      title: 'Welcome to ElimuNova! 🎓',
      content: `Hi there! Welcome to your personal learning platform.

**Hope AI Tutor** is your always-available assistant — ask anything, get instant explanations, and level up your understanding.

Click the **MessageSquare** icon or the **Chat with AI** button anytime to open Hope. She knows your subjects, topics, and learning level.

Let's explore your dashboard together!`,
      placement: 'center' as const,
    },
    {
      id: 'student-focus',
      title: "Today's Focus",
      content: `This is your command center. The **Today's Focus** section shows:

- Your **Daily Challenge** — a recommended topic to study
- **Due Reviews** — topics the system thinks you should revisit
- **My Learning Areas** — tap any subject chip to jump straight into studying

Your streaks, XP, and level progress are visible in the hero card at the top.`,
      target: '[data-tour="student-dashboard"]',
      placement: 'right' as const,
    },
    {
      id: 'student-learn',
      title: 'Curriculum & Learn Hub',
      content: `This is where the magic happens! The **Learning Hub** is your study companion:

- **Browse the Curriculum** by grade and subject
- **Active Recall Study** — preview, learn, and then test yourself
- **Quick Quizzes** appear right after each lesson
- **Spaced Repetition** schedules reviews at the perfect time

Pro tip: Complete a lesson + quiz every day to keep your streak alive! 🔥`,
      target: '[data-tour="student-learn"]',
      placement: 'right' as const,
    },
    {
      id: 'student-assignments',
      title: 'Assignments & Analytics',
      content: `Track your progress and stay on top of your work:

- **Pending Assignments** appear on your dashboard — submit before the due date
- **Progress** page shows your grades, study time, and mastery levels
- **Achievements** celebrate your milestones

Check back daily to see your streak grow and new topics unlock! 🚀`,
      target: '[data-tour="student-assignments"]',
      placement: 'right' as const,
    },
  ],
}
