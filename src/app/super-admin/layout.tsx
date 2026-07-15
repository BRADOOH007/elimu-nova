'use client'

import { useSession } from 'next-auth/react'
import { ProfessionalDashboardLayout } from '@/components/layout/professional-dashboard-layout'
import { BarChart3, School, Users, Settings, CreditCard, Brain, FlaskConical, FileText, Shield, Globe } from 'lucide-react'
import { DashboardLoading } from '@/components/ui/dashboard-loading'

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession()

  const sidebarItems = [
    { icon: BarChart3,  label: "Overview",    href: "/super-admin/dashboard"      },
    { icon: School,     label: "Schools",     href: "/super-admin/schools"        },
    { icon: Users,      label: "Users",       href: "/super-admin/users"          },
    { icon: CreditCard, label: "Billing",     href: "/super-admin/billing"        },
    { icon: Brain,        label: "AI Config",   href: "/super-admin/ai-config"      },
    { icon: FlaskConical, label: "AI Test Lab",  href: "/super-admin/ai-test"        },
    { icon: Settings,     label: "Settings",     href: "/super-admin/system-settings"},
    { icon: FileText,     label: "Reports",     href: "/super-admin/reports"        },
    { icon: Shield,       label: "Security",    href: "/super-admin/security"       },
    { icon: Globe,        label: "Global",      href: "/super-admin/global"         },
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
