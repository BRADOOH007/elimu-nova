'use client'

import { useSession } from 'next-auth/react'
import { ProfessionalDashboardLayout } from '@/components/layout/professional-dashboard-layout'
import { useSchoolInfo } from '@/hooks/use-school-info'
import { useUnreadMessages } from '@/hooks/use-unread-messages'
import { SubscriptionGuard } from '@/components/subscription/subscription-guard'
import {
  BarChart3, BookOpen, ClipboardList, Calendar,
  Brain, Trophy, MessageSquare, MessagesSquare, Sparkles, GraduationCap, CreditCard, BookMarked
} from 'lucide-react'
import { DashboardSessionGate } from '@/components/ui/dashboard-session-gate'

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession()
  const { schoolInfo } = useSchoolInfo()
  const { totalUnread } = useUnreadMessages()

  const isSchoolStudent = !!session?.user?.schoolId

  const sidebarItems = [
    { icon: BarChart3,     label: 'Dashboard',  href: '/student/dashboard',    tourId: 'student-dashboard'    },
    { icon: GraduationCap, label: 'Learn',      href: '/student/learn',        tourId: 'student-learn'        },
    { icon: BookMarked,    label: 'Curriculum', href: '/student/curriculum',   tourId: 'student-curriculum'   },
    { icon: BookOpen,      label: 'Lessons',    href: '/student/lesson-plans', tourId: 'student-schedule'     },
    { icon: ClipboardList, label: 'Assignments',href: '/student/assignments',  tourId: 'student-assignments' },
    { icon: Calendar,      label: 'Classes',    href: '/student/schedule',     tourId: 'student-classes'     },
    { icon: Trophy,        label: 'Progress',   href: '/student/progress',    tourId: 'student-progress'     },
    { icon: MessagesSquare, label: 'Discussions', href: '/student/discussions', tourId: 'student-discussions' },
    { icon: Brain,         label: 'AI & Growth',href: '/student/ai-tutor',     tourId: 'student-ai-tutor'     },
    {
      icon: MessageSquare,
      label: 'Messages',
      href: '/student/messages',
      badge: totalUnread > 0 ? totalUnread : undefined,
      tourId: 'student-messages',
    },
    ...(!isSchoolStudent
      ? [{ icon: CreditCard, label: 'Billing', href: '/student/billing' as const, tourId: 'student-billing' }]
      : []),
  ]

  if (!session) return null

  return (
    <DashboardSessionGate>
      <ProfessionalDashboardLayout
        userRole="STUDENT"
        userName={session.user?.name || 'Student'}
        userEmail={session.user?.email || ''}
        schoolName={schoolInfo?.school?.name || 'Loading...'}
        sidebarItems={sidebarItems}
      >
        <SubscriptionGuard>{children}</SubscriptionGuard>
      </ProfessionalDashboardLayout>
    </DashboardSessionGate>
  )
}
