'use client'

import { useSession } from 'next-auth/react'
import { ProfessionalDashboardLayout } from '@/components/layout/professional-dashboard-layout'
import { useSchoolInfo } from '@/hooks/use-school-info'
import { 
  BarChart3, 
  Users, 
  School, 
  Settings, 
  CreditCard,
  FileText,
  Calendar,
  Shield,
  Bell,
  LayoutGrid
} from 'lucide-react'

import { DashboardLoading } from '@/components/ui/dashboard-loading'

export default function SchoolAdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { data: session } = useSession()
  const { schoolInfo, loading } = useSchoolInfo()

  const sidebarItems = [
    { icon: BarChart3,   label: "Overview",        href: "/school-admin/dashboard"   },
    { icon: Users,       label: "Teachers & Staff",  href: "/school-admin/teachers"    },
    { icon: School,      label: "Students",          href: "/school-admin/students"    },
    { icon: Calendar,    label: "Academics",         href: "/school-admin/activities"  },
    { icon: LayoutGrid,  label: "Timetable & Staff", href: "/school-admin/timetable"   },
    { icon: Bell,        label: "Meetings",          href: "/school-admin/meetings"    },
    { icon: FileText,    label: "Reports",           href: "/school-admin/reports"     },
    { icon: Shield,      label: "Security",          href: "/school-admin/security"    },
    { icon: CreditCard,  label: "Billing",           href: "/school-admin/billing"     },
    { icon: Settings,    label: "Settings",          href: "/school-admin/settings"    },
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
