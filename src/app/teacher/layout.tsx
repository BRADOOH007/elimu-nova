'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { ProfessionalDashboardLayout } from '@/components/layout/professional-dashboard-layout'
import { useSchoolInfo } from '@/hooks/use-school-info'
import { useUnreadMessages } from '@/hooks/use-unread-messages'
import {
  BarChart3, Users, BookOpen, ClipboardList,
  Wand2, Radio, Mail, CreditCard, Calendar, Brain
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
    { icon: BarChart3,     label: 'Dashboard',      href: '/teacher/dashboard'    },
    { icon: Users,         label: 'My Students',    href: '/teacher/students'     },
    { icon: BookOpen,      label: 'Planning',       href: '/teacher/lesson-plans' },
    { icon: ClipboardList, label: 'Assessments',    href: '/teacher/assignments'  },
    { icon: BarChart3,     label: 'Analytics',      href: '/teacher/analytics'    },
    { icon: Wand2,         label: 'AI Tools',       href: '/teacher/ai-tools'     },
    { icon: Radio,         label: 'Live Teaching',  href: '/teacher/live-class'   },
    { icon: Calendar,      label: 'Calendar',       href: '/teacher/calendar'     },
    {
      icon: Mail,
      label: 'Messages',
      href: '/teacher/messages',
      badge: unreadCount > 0 ? unreadCount : undefined,
    },
    ...(!isSchoolTeacher
      ? [{ icon: CreditCard, label: 'Billing', href: '/teacher/billing' as const }]
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
      {children}
    </ProfessionalDashboardLayout>
  )
}
