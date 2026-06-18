'use client'

import { useSession } from 'next-auth/react'
import { ProfessionalDashboardLayout } from '@/components/layout/professional-dashboard-layout'
import { useSchoolInfo } from '@/hooks/use-school-info'
import { useUnreadMessages } from '@/hooks/use-unread-messages'
import {
  BarChart3,
  Users,
  ClipboardList,
  Calendar,
  BookOpen,
  MessageSquare,
  Settings
} from 'lucide-react'

import { DashboardLoading } from '@/components/ui/dashboard-loading'

export default function ParentLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { data: session } = useSession()
  const { schoolInfo, loading } = useSchoolInfo()
  const { unreadCount } = useUnreadMessages()

  const sidebarItems = [
    { icon: BarChart3, label: "Overview", href: "/parent/dashboard" },
    { icon: Users, label: "My Children", href: "/parent/children" },
    { icon: ClipboardList, label: "Assignments", href: "/parent/assignments" },
    { icon: BookOpen, label: "Progress & Grades", href: "/parent/progress" },
    { icon: Calendar, label: "Schedule", href: "/parent/schedule" },
    {
      icon: MessageSquare,
      label: "Messages",
      href: "/parent/messages",
      badge: unreadCount > 0 ? unreadCount : undefined
    },
    { icon: Settings, label: "Settings", href: "/parent/settings" }
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
