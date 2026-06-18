'use client'

import { useSession } from 'next-auth/react'
import { ProfessionalDashboardLayout } from '@/components/layout/professional-dashboard-layout'
import { BarChart3, School, Users, Settings, CreditCard, Brain } from 'lucide-react'
import { DashboardLoading } from '@/components/ui/dashboard-loading'

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession()

  const sidebarItems = [
    { icon: BarChart3,  label: "Overview",    href: "/super-admin/dashboard"      },
    { icon: School,     label: "Schools",     href: "/super-admin/schools"        },
    { icon: Users,      label: "Users",       href: "/super-admin/users"          },
    { icon: CreditCard, label: "Billing",     href: "/super-admin/billing"        },
    { icon: Brain,      label: "AI Config",   href: "/super-admin/ai-config"      },
    { icon: Settings,   label: "Settings",    href: "/super-admin/system-settings"},
  ]

  if (!session) return <DashboardLoading />

  return (
    <ProfessionalDashboardLayout
      userRole="SUPER_ADMIN"
      userName={session.user?.name || 'Super Admin'}
      userEmail={session.user?.email || ''}
      schoolName="ElimuNova AI Platform"
      sidebarItems={sidebarItems}
    >
      {children}
    </ProfessionalDashboardLayout>
  )
}
