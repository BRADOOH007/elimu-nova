'use client'

import { useSession } from 'next-auth/react'
import { ProfessionalDashboardLayout } from '@/components/layout/professional-dashboard-layout'
import { useSchoolInfo } from '@/hooks/use-school-info'
import { useUnreadMessages } from '@/hooks/use-unread-messages'
import {
  BarChart3, BookOpen, ClipboardList, Calendar,
  Brain, Trophy, MessageSquare, Sparkles, GraduationCap
} from 'lucide-react'
import { DashboardLoading } from '@/components/ui/dashboard-loading'

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession()
  const { schoolInfo, loading } = useSchoolInfo()
  const { unreadCount } = useUnreadMessages()

  const sidebarItems = [
    { icon: BarChart3,      label: 'Dashboard',     href: '/student/dashboard'    },
    // Learning Hub — study, quiz, assignments, AI tutor all in one
    { icon: GraduationCap,  label: 'Learn',          href: '/student/learn'        },
    // Lesson plans from teacher + AI-generated lessons
    { icon: BookOpen,       label: 'Lessons',        href: '/student/lesson-plans' },
    // Schedule + Live Class + Discussions
    { icon: Calendar,       label: 'Classes',        href: '/student/schedule'     },
    // Progress tracking
    { icon: Trophy,         label: 'Progress',       href: '/student/progress'     },
    // AI Tutor + Coding + Career
    { icon: Brain,          label: 'AI & Growth',    href: '/student/ai-tutor'     },
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
