'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { ProfessionalDashboardLayout } from '@/components/layout/professional-dashboard-layout'
import { useSchoolInfo } from '@/hooks/use-school-info'
import { useUnreadMessages } from '@/hooks/use-unread-messages'
import { SubscriptionGuard } from '@/components/subscription/subscription-guard'
import {
  BarChart3, Users, BookOpen, ClipboardList,
  Wand2, Radio, Mail, CreditCard, Calendar, Brain, Activity
} from 'lucide-react'
import { DashboardLoading } from '@/components/ui/dashboard-loading'

export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const { schoolInfo } = useSchoolInfo()
  const { unreadCount } = useUnreadMessages()
  // Hard timeout — never show loading screen for more than 4 seconds
  const [timedOut, setTimedOut] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setTimedOut(true), 4000)
    return () => clearTimeout(t)
  }, [])

  const isSchoolTeacher = !!session?.user?.schoolId

  const sidebarItems = [
    { icon: BarChart3,     label: 'Dashboard',      href: '/teacher/dashboard',    tourId: 'teacher-dashboard'    },
    { icon: Users,         label: 'My Students',    href: '/teacher/students',     tourId: 'teacher-students'     },
    { icon: BookOpen,      label: 'Planning',       href: '/teacher/lesson-plans', tourId: 'teacher-schedule'     },
    { icon: ClipboardList, label: 'Assignments',    href: '/teacher/assignments',  tourId: 'teacher-assignments'  },
    { icon: BarChart3,     label: 'Gradebook',      href: '/teacher/gradebook',    tourId: 'teacher-gradebook'    },
    { icon: BarChart3,     label: 'Analytics',      href: '/teacher/analytics',    tourId: 'teacher-analytics'    },
    { icon: Activity,      label: 'Activity Log',   href: '/teacher/activity-log', tourId: 'teacher-activity-log' },
    { icon: Wand2,         label: 'AI Tools',       href: '/teacher/ai-tools',     tourId: 'teacher-ai-tools'     },
    { icon: Radio,         label: 'Live Teaching',  href: '/teacher/live-class',   tourId: 'teacher-live-classes' },
    { icon: Calendar,      label: 'Calendar',       href: '/teacher/calendar',     tourId: 'teacher-calendar'     },
    {
      icon: Mail,
      label: 'Messages',
      href: '/teacher/messages',
      badge: unreadCount > 0 ? unreadCount : undefined,
      tourId: 'teacher-messages',
    },
    ...(!isSchoolTeacher
      ? [{ icon: CreditCard, label: 'Billing', href: '/teacher/billing' as const, tourId: 'teacher-billing' }]
      : []),
  ]

  // Show loading only while NextAuth is actively hydrating AND we haven't timed out
  if (status === 'loading' && !timedOut) return <DashboardLoading />
  // If unauthenticated after timeout or after auth resolves, middleware handles redirect
  if (!session) return <DashboardLoading />

  return (
    <ProfessionalDashboardLayout
      userRole="TEACHER"
      userName={session.user?.name || 'Teacher'}
      userEmail={session.user?.email || ''}
      schoolName={schoolInfo?.school?.name || 'Loading...'}
      sidebarItems={sidebarItems}
    >
      <SubscriptionGuard>{children}</SubscriptionGuard>
    </ProfessionalDashboardLayout>
  )
}
