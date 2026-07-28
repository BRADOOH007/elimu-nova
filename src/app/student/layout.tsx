'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { ProfessionalDashboardLayout } from '@/components/layout/professional-dashboard-layout'
import { useSchoolInfo } from '@/hooks/use-school-info'
import { useUnreadMessages } from '@/hooks/use-unread-messages'
import { SubscriptionGuard } from '@/components/subscription/subscription-guard'
import {
  BarChart3, BookOpen, ClipboardList, Calendar,
  Brain, Trophy, MessageSquare, Sparkles, GraduationCap, CreditCard, BookMarked
} from 'lucide-react'
import { DashboardLoading } from '@/components/ui/dashboard-loading'

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const { schoolInfo } = useSchoolInfo()
  const { unreadCount } = useUnreadMessages()
  const [timedOut, setTimedOut] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setTimedOut(true), 4000)
    return () => clearTimeout(t)
  }, [])

  const isSchoolStudent = !!session?.user?.schoolId

  const sidebarItems = [
    { icon: BarChart3,     label: 'Dashboard',  href: '/student/dashboard',    tourId: 'student-dashboard'   },
    { icon: GraduationCap, label: 'Learn',      href: '/student/learn'        },
    { icon: BookMarked,    label: 'Curriculum', href: '/student/curriculum',   tourId: 'student-curriculum'  },
    { icon: BookOpen,      label: 'Lessons',    href: '/student/lesson-plans', tourId: 'student-schedule'    },
    { icon: Calendar,      label: 'Classes',    href: '/student/schedule'     },
    { icon: Trophy,        label: 'Progress',   href: '/student/progress',    tourId: 'student-progress'    },
    { icon: Brain,         label: 'AI & Growth',href: '/student/ai-tutor'     },
    {
      icon: MessageSquare,
      label: 'Messages',
      href: '/student/messages',
      badge: unreadCount > 0 ? unreadCount : undefined,
    },
    ...(!isSchoolStudent
      ? [{ icon: CreditCard, label: 'Billing', href: '/student/billing' as const, tourId: 'student-billing' }]
      : []),
  ]

  if (status === 'loading' && !timedOut) return <DashboardLoading />
  if (!session) return <DashboardLoading />

  return (
    <ProfessionalDashboardLayout
      userRole="STUDENT"
      userName={session.user?.name || 'Student'}
      userEmail={session.user?.email || ''}
      schoolName={schoolInfo?.school?.name || 'Loading...'}
      sidebarItems={sidebarItems}
    >
      <SubscriptionGuard>{children}</SubscriptionGuard>
    </ProfessionalDashboardLayout>
  )
}
