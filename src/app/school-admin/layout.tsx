'use client'

import { useSession } from 'next-auth/react'
import { ProfessionalDashboardLayout } from '@/components/layout/professional-dashboard-layout'
import { useSchoolInfo } from '@/hooks/use-school-info'
import { SubscriptionGuard } from '@/components/subscription/subscription-guard'
import {
  BarChart3, Users, School, Settings,
  CreditCard, FileText, Calendar, BookOpen, ClipboardList, Activity, MessageSquare, TrendingUp
} from 'lucide-react'
import { DashboardSessionGate } from '@/components/ui/dashboard-session-gate'

export default function SchoolAdminLayout({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession()
  const { schoolInfo } = useSchoolInfo()

  const sidebarItems = [
    { icon: BarChart3,     label: 'Overview',    href: '/school-admin/dashboard',        tourId: 'admin-dashboard'   },
    { icon: Users,         label: 'Staff',       href: '/school-admin/teachers',         tourId: 'admin-teachers'    },
    { icon: School,        label: 'Students',    href: '/school-admin/students',         tourId: 'admin-students'    },
    { icon: ClipboardList, label: 'Curriculum',  href: '/school-admin/curriculum',       tourId: 'admin-curriculum'  },
    { icon: Calendar,      label: 'Calendar',    href: '/school-admin/academic-calendar', tourId: 'admin-calendar'   },
    { icon: Calendar,      label: 'Timetable',   href: '/school-admin/timetable',        tourId: 'admin-timetable'   },
    { icon: MessageSquare, label: 'Messages',    href: '/school-admin/messages',         tourId: 'admin-messages'    },
    { icon: TrendingUp,    label: 'Analytics',   href: '/school-admin/analytics',        tourId: 'admin-analytics'   },
    { icon: Activity,      label: 'Activities',  href: '/school-admin/activities',       tourId: 'admin-activities'  },
    { icon: FileText,      label: 'Reports',     href: '/school-admin/reports',          tourId: 'admin-reports'     },
    { icon: CreditCard,    label: 'Billing',     href: '/school-admin/billing',          tourId: 'admin-billing'     },
    { icon: Settings,      label: 'Settings',    href: '/school-admin/settings',         tourId: 'admin-settings'    },
  ]

  if (!session) return null

  return (
    <DashboardSessionGate>
      <ProfessionalDashboardLayout
        userRole="SCHOOL_ADMIN"
        userName={session.user?.name || 'School Admin'}
        userEmail={session.user?.email || ''}
        schoolName={schoolInfo?.school?.name || 'Loading...'}
        sidebarItems={sidebarItems}
      >
        <SubscriptionGuard>{children}</SubscriptionGuard>
      </ProfessionalDashboardLayout>
    </DashboardSessionGate>
  )
}
