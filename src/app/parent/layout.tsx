'use client'

import { useSession } from 'next-auth/react'
import { ProfessionalDashboardLayout } from '@/components/layout/professional-dashboard-layout'
import { useSchoolInfo } from '@/hooks/use-school-info'
import { useUnreadMessages } from '@/hooks/use-unread-messages'
import {
  BarChart3, Users, ClipboardList, BookOpen,
  MessageSquare, Settings
} from 'lucide-react'
import { DashboardLoading } from '@/components/ui/dashboard-loading'

export default function ParentLayout({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession()
  const { schoolInfo, loading } = useSchoolInfo()
  const { unreadCount } = useUnreadMessages()

  const sidebarItems = [
    // 1
    { icon: BarChart3,     label: 'Overview',     href: '/parent/dashboard'    },
    // 2 — Children + Progress + Assignments (tabs inside children page)
    { icon: Users,         label: 'My Children',  href: '/parent/children'     },
    // 3 — Schedule + Alerts (tabs inside schedule page)
    { icon: ClipboardList, label: 'School Life',  href: '/parent/schedule'     },
    // 4
    { icon: BookOpen,      label: 'Progress',     href: '/parent/progress'     },
    // 5
    {
      icon: MessageSquare,
      label: 'Messages',
      href: '/parent/messages',
      badge: unreadCount > 0 ? unreadCount : undefined,
    },
    // 6
    { icon: Settings,      label: 'Settings',     href: '/parent/settings'     },
  ]

  if (!session || loading) return <DashboardLoading />

  return (
    <ProfessionalDashboardLayout
      userRole="PARENT"
      userName={session.user?.name || 'Parent'}
      userEmail={session.user?.email || ''}
      schoolName={schoolInfo?.school?.name || 'Loading...'}
      sidebarItems={sidebarItems}
    >
      {children}
    </ProfessionalDashboardLayout>
  )
}
