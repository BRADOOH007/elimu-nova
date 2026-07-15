'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { ProfessionalDashboardLayout } from '@/components/layout/professional-dashboard-layout'
import { useSchoolInfo } from '@/hooks/use-school-info'
import { useUnreadMessages } from '@/hooks/use-unread-messages'
import {
  BarChart3, Users, ClipboardList, BookOpen,
  MessageSquare, Settings, CreditCard
} from 'lucide-react'
import { DashboardLoading } from '@/components/ui/dashboard-loading'

export default function ParentLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const { schoolInfo } = useSchoolInfo()
  const { unreadCount } = useUnreadMessages()
  const [timedOut, setTimedOut] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setTimedOut(true), 4000)
    return () => clearTimeout(t)
  }, [])

  const isSchoolParent = !!session?.user?.schoolId

  const sidebarItems = [
    { icon: BarChart3,     label: 'Overview',    href: '/parent/dashboard'  },
    { icon: Users,         label: 'My Children', href: '/parent/children'   },
    { icon: ClipboardList, label: 'School Life', href: '/parent/schedule'   },
    { icon: BookOpen,      label: 'Progress',    href: '/parent/progress'   },
    {
      icon: MessageSquare,
      label: 'Messages',
      href: '/parent/messages',
      badge: unreadCount > 0 ? unreadCount : undefined,
    },
    ...(!isSchoolParent
      ? [{ icon: CreditCard, label: 'Billing', href: '/parent/billing' as const }]
      : []),
    { icon: Settings, label: 'Settings', href: '/parent/settings' },
  ]

  if (status === 'loading' && !timedOut) return <DashboardLoading />
  if (!session) return <DashboardLoading />

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
