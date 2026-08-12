'use client'

import { useSession } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import { ProfessionalDashboardLayout } from '@/components/layout/professional-dashboard-layout'
import { useSchoolInfo } from '@/hooks/use-school-info'
import { useUnreadMessages } from '@/hooks/use-unread-messages'
import { SubscriptionGuard } from '@/components/subscription/subscription-guard'
import {
  BarChart3, Users, ClipboardList, BookOpen,
  MessageSquare, Settings, CreditCard, Bell, FileText, Calendar, GraduationCap
} from 'lucide-react'
import { DashboardSessionGate } from '@/components/ui/dashboard-session-gate'

export default function ParentLayout({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession()
  const pathname = usePathname()
  const { schoolInfo } = useSchoolInfo()
  const { totalUnread } = useUnreadMessages()

  const isSchoolParent = !!schoolInfo?.school?.id || !!session?.user?.schoolId
  const isIndependent = !isSchoolParent

  // Billing and pricing pages should be accessible even without an active subscription
  const isBillingPath = pathname?.startsWith('/parent/billing') || pathname === '/pricing'

  const sidebarItems = [
    { icon: BarChart3,     label: 'Overview',    href: '/parent/dashboard', tourId: 'parent-dashboard' },
    { icon: Users,         label: 'My Children', href: '/parent/children',  tourId: 'parent-children'  },
    ...(isSchoolParent ? [
      { icon: ClipboardList, label: 'School Life', href: '/parent/schedule', tourId: 'parent-schedule' },
    ] : []),
    { icon: BookOpen,      label: 'Progress',    href: '/parent/progress',  tourId: 'parent-progress'  },
    { icon: FileText,      label: 'Assignments', href: '/parent/assignments', tourId: 'parent-assignments' },
    { icon: GraduationCap, label: 'Grades',      href: '/parent/grades',      tourId: 'parent-grades' },
    { icon: Bell,          label: 'Alerts',      href: '/parent/alerts',       tourId: 'parent-alerts' },
    { icon: Calendar,      label: 'Meetings',    href: '/parent/meetings',    tourId: 'parent-meetings' },
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

  const content = (
    <ProfessionalDashboardLayout
      userRole="PARENT"
      userName={session.user?.name || 'Parent'}
      userEmail={session.user?.email || ''}
      schoolName={isSchoolParent ? (schoolInfo?.school?.name || 'Your School') : 'Independent · Home School'}
      sidebarItems={sidebarItems}
    >
      {children}
    </ProfessionalDashboardLayout>
  )

  return (
    <DashboardSessionGate>
      {isBillingPath ? content : <SubscriptionGuard>{content}</SubscriptionGuard>}
    </DashboardSessionGate>
  )
}
