'use client'

import { useSession } from 'next-auth/react'
import { ProfessionalDashboardLayout } from '@/components/layout/professional-dashboard-layout'
import { useSchoolInfo } from '@/hooks/use-school-info'
import { useUnreadMessages } from '@/hooks/use-unread-messages'
import {
  BarChart3, BookOpen, ClipboardList, Calendar,
  Brain, Trophy, MessageSquare, Sparkles
} from 'lucide-react'
import { DashboardLoading } from '@/components/ui/dashboard-loading'

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession()
  const { schoolInfo, loading } = useSchoolInfo()
  const { unreadCount } = useUnreadMessages()

  const sidebarItems = [
    // 1
    { icon: BarChart3,     label: 'Dashboard',     href: '/student/dashboard'   },
    // 2 — Lesson Plans + Courses + Schemes (tabs inside lesson-plans page)
    { icon: BookOpen,      label: 'Learning',      href: '/student/lesson-plans' },
    // 3
    { icon: ClipboardList, label: 'Assignments',   href: '/student/assignments'  },
    // 4 — Schedule + Live Class + Discussions (tabs inside schedule page)
    { icon: Calendar,      label: 'Classes',       href: '/student/schedule'     },
    // 5
    { icon: Trophy,        label: 'Progress',      href: '/student/progress'     },
    // 6 — AI Tutor + Coding Studio + Career (tabs inside ai-tutor page)
    { icon: Brain,         label: 'AI & Growth',   href: '/student/ai-tutor'     },
    // 7
    {
      icon: MessageSquare,
      label: 'Messages',
      href: '/student/messages',
      badge: unreadCount > 0 ? unreadCount : undefined,
    },
  ]

  if (!session || loading) return <DashboardLoading />

  return (
    <ProfessionalDashboardLayout
      userRole="STUDENT"
      userName={session.user?.name || 'Student'}
      userEmail={session.user?.email || ''}
      schoolName={schoolInfo?.school?.name || 'Loading...'}
      sidebarItems={sidebarItems}
    >
      {children}
    </ProfessionalDashboardLayout>
  )
}
