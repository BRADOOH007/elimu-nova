'use client'

import { useSession } from 'next-auth/react'
import { ProfessionalDashboardLayout } from '@/components/layout/professional-dashboard-layout'
import { useSchoolInfo } from '@/hooks/use-school-info'
import {
  BarChart3, Users, School, Settings,
  CreditCard, FileText, Calendar, BookOpen
} from 'lucide-react'
import { DashboardLoading } from '@/components/ui/dashboard-loading'

export default function SchoolAdminLayout({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession()
  const { schoolInfo, loading } = useSchoolInfo()

  const sidebarItems = [
    // 1
    { icon: BarChart3,  label: 'Overview',       href: '/school-admin/dashboard'       },
    // 2 — Teachers + Teacher Allocation (tabs inside teachers page)
    { icon: Users,      label: 'Staff',          href: '/school-admin/teachers'        },
    // 3 — Students + Learning Areas (tabs inside students page)
    { icon: School,     label: 'Students',       href: '/school-admin/students'        },
    // 4 — Timetable + Meetings + Activities (tabs inside timetable page)
    { icon: Calendar,   label: 'Academics',      href: '/school-admin/timetable'       },
    // 5 — Reports + Security (tabs inside reports page)
    { icon: FileText,   label: 'Reports',        href: '/school-admin/reports'         },
    // 6 — Billing + Settings (tabs inside billing page)
    { icon: CreditCard, label: 'Billing',        href: '/school-admin/billing'         },
    // 7
    { icon: Settings,   label: 'Settings',       href: '/school-admin/settings'        },
  ]

  if (!session || loading) return <DashboardLoading />

  return (
    <ProfessionalDashboardLayout
      userRole="SCHOOL_ADMIN"
      userName={session.user?.name || 'School Admin'}
      userEmail={session.user?.email || ''}
      schoolName={schoolInfo?.school?.name || 'Loading...'}
      sidebarItems={sidebarItems}
    >
      {children}
    </ProfessionalDashboardLayout>
  )
}
