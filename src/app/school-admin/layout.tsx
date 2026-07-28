'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { ProfessionalDashboardLayout } from '@/components/layout/professional-dashboard-layout'
import { useSchoolInfo } from '@/hooks/use-school-info'
import { SubscriptionGuard } from '@/components/subscription/subscription-guard'
import {
  BarChart3, Users, School, Settings,
  CreditCard, FileText, Calendar, BookOpen
} from 'lucide-react'
import { DashboardLoading } from '@/components/ui/dashboard-loading'

export default function SchoolAdminLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const { schoolInfo } = useSchoolInfo()
  const [timedOut, setTimedOut] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setTimedOut(true), 4000)
    return () => clearTimeout(t)
  }, [])

  const sidebarItems = [
    { icon: BarChart3,  label: 'Overview',  href: '/school-admin/dashboard', tourId: 'admin-dashboard' },
    { icon: Users,      label: 'Staff',     href: '/school-admin/teachers',  tourId: 'admin-teachers'  },
    { icon: School,     label: 'Students',  href: '/school-admin/students',  tourId: 'admin-students'  },
    { icon: Calendar,   label: 'Academics', href: '/school-admin/timetable' },
    { icon: FileText,   label: 'Reports',   href: '/school-admin/reports'   },
    { icon: CreditCard, label: 'Billing',   href: '/school-admin/billing',  tourId: 'admin-billing'   },
    { icon: Settings,   label: 'Settings',  href: '/school-admin/settings'  },
  ]

  if (status === 'loading' && !timedOut) return <DashboardLoading />
  if (!session) return <DashboardLoading />

  return (
    <ProfessionalDashboardLayout
      userRole="SCHOOL_ADMIN"
      userName={session.user?.name || 'School Admin'}
      userEmail={session.user?.email || ''}
      schoolName={schoolInfo?.school?.name || 'Loading...'}
      sidebarItems={sidebarItems}
    >
      <SubscriptionGuard>{children}</SubscriptionGuard>
    </ProfessionalDashboardLayout>
  )
}
