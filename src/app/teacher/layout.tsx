'use client'

import { useSession } from 'next-auth/react'
import { ProfessionalDashboardLayout } from '@/components/layout/professional-dashboard-layout'
import { useSchoolInfo } from '@/hooks/use-school-info'
import { useUnreadMessages } from '@/hooks/use-unread-messages'
import {
  BarChart3, Users, BookOpen, ClipboardList,
  Wand2, Radio, Mail, CreditCard, Calendar, Brain
} from 'lucide-react'
import { DashboardLoading } from '@/components/ui/dashboard-loading'

export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession()
  const { schoolInfo, loading } = useSchoolInfo()
  const { unreadCount } = useUnreadMessages()

  const sidebarItems = [
    // 1
    { icon: BarChart3,     label: 'Dashboard',      href: '/teacher/dashboard'       },
    // 2 — Students + Attendance + Progress Monitor (tabs inside)
    { icon: Users,         label: 'My Students',    href: '/teacher/students'        },
    // 3 — Lesson Plans + Schemes of Work + Lesson Notes (tabs inside — lesson-plans page)
    { icon: BookOpen,      label: 'Planning',       href: '/teacher/lesson-plans'    },
    // 4 — Assignments + Marks + Exam Bank (tabs inside — assignments page)
    { icon: ClipboardList, label: 'Assessments',    href: '/teacher/assignments'     },
    // 5
    { icon: BarChart3,     label: 'Analytics',      href: '/teacher/analytics'       },
    // 6 — AI Tools + Hope AI + PowerPoint AI (tabs inside — ai-tools page)
    { icon: Wand2,         label: 'AI Tools',       href: '/teacher/ai-tools'        },
    // 7 — Live Teaching + Discussions (tabs inside — live-class page)
    { icon: Radio,         label: 'Live Teaching',  href: '/teacher/live-class'      },
    // 8 — Calendar + Schedule + Timetable + Meetings (tabs inside — calendar page)
    { icon: Calendar,      label: 'Calendar',       href: '/teacher/calendar'        },
    // 9 — Messages + Notifications (tabs inside — messages page)
    {
      icon: Mail,
      label: 'Messages',
      href: '/teacher/messages',
      badge: unreadCount > 0 ? unreadCount : undefined,
    },
    // 10
    { icon: CreditCard,    label: 'Billing',        href: '/teacher/billing'         },
  ]

  if (!session || loading) return <DashboardLoading />

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
