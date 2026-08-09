'use client'

import { useSession } from 'next-auth/react'
import { ProfessionalDashboardLayout } from '@/components/layout/professional-dashboard-layout'
import { useSchoolInfo } from '@/hooks/use-school-info'
import { useUnreadMessages } from '@/hooks/use-unread-messages'
import { SubscriptionGuard } from '@/components/subscription/subscription-guard'
import {
  BarChart3, Users, ClipboardList, BookOpen,
  MessageSquare, Settings, CreditCard
} from 'lucide-react'
import { DashboardSessionGate } from '@/components/ui/dashboard-session-gate'

export default function ParentLayout({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession()
  const { schoolInfo } = useSchoolInfo()
  const { totalUnread } = useUnreadMessages()

  const isSchoolParent = !!schoolInfo?.school?.id || !!session?.user?.schoolId
  const isIndependent = !isSchoolParent

  const sidebarItems = [
    { icon: BarChart3,     label: 'Overview',    href: '/parent/dashboard', tourId: 'parent-dashboard' },
    { icon: Users,         label: 'My Children', href: '/parent/children',  tourId: 'parent-children'  },
    ...(isSchoolParent ? [
      { icon: ClipboardList, label: 'School Life', href: '/parent/schedule', tourId: 'parent-schedule' },
    ] : []),
    { icon: BookOpen,      label: 'Progress',    href: '/parent/progress',  tourId: 'parent-progress'  },
    ...(isSchoolParent ? [{
      icon: MessageSquare, label: 'Messages', href: '/parent/messages',
      badge: totalUnread > 0 ? totalUnread : undefined, tourId: 'parent-messages',
    }] : []),
    ...(isIndependent ? [
      { icon: CreditCard, label: 'Billing', href: '/parent/billing' as const, tourId: 'parent-billing' },
    ] : []),
    { icon: Settings, label: 'Settings', href: '/parent/settings', tourId: 'parent-settings' },
  ]

  if (!session) return null

  return (
    <DashboardSessionGate>
      <ProfessionalDashboardLayout
        userRole="PARENT"
        userName={session.user?.name || 'Parent'}
        userEmail={session.user?.email || ''}
        schoolName={isSchoolParent ? (schoolInfo?.school?.name || 'Your School') : 'Independent · Home School'}
        sidebarItems={sidebarItems}
      >
        <SubscriptionGuard>{children}</SubscriptionGuard>
      </ProfessionalDashboardLayout>
    </DashboardSessionGate>
  )
}
