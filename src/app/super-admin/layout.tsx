'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { ProfessionalDashboardLayout } from '@/components/layout/professional-dashboard-layout'
import { BarChart3, School, Users, Settings, CreditCard, Brain, FlaskConical, FileText, Shield, ShieldAlert, Globe, MessageSquare, Inbox, Activity, ScrollText, Package, UploadCloud, Database, Siren, Award, Plug } from 'lucide-react'
import { DashboardSessionGate } from '@/components/ui/dashboard-session-gate'

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession()
  const [unread, setUnread] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    fetch('/api/contact-messages?limit=1&read=false', { signal: controller.signal })
      .then(r => r.json())
      .then(d => setUnread(d.unread || 0))
      .catch(() => {})
    return () => controller.abort()
  }, [])

  const sidebarItems = [
    { icon: BarChart3,  label: "Overview",    href: "/super-admin/dashboard"      },
    { icon: School,     label: "Schools",     href: "/super-admin/schools"        },
    { icon: Users,      label: "Users",       href: "/super-admin/users"          },
    { icon: Award,      label: "Senior Students", href: "/super-admin/senior-students" },
    { icon: CreditCard, label: "Billing",     href: "/super-admin/billing"        },
    { icon: Brain,        label: "AI Config",   href: "/super-admin/ai-config"      },
    { icon: FlaskConical, label: "AI Test Lab",  href: "/super-admin/ai-test"        },
    { icon: Inbox,        label: "Messages",    href: "/super-admin/messages",      badge: unread },
    { icon: Settings,     label: "Settings",     href: "/super-admin/system-settings"},
    { icon: FileText,     label: "Reports",     href: "/super-admin/reports"        },
    { icon: Shield,       label: "Security",    href: "/super-admin/security"       },
    { icon: ShieldAlert,  label: "AI Safety",   href: "/super-admin/ai-safety"      },
{ icon: Globe,        label: "Platform Settings", href: "/super-admin/global"         },
{ icon: Plug,         label: "Integrations",     href: "/super-admin/integrations"    },
{ icon: MessageSquare, label: "Broadcast",   href: "/super-admin/broadcast"      },
{ icon: Package,       label: "Packages",   href: "/super-admin/packages"        },
    { icon: UploadCloud,   label: "Bulk Import", href: "/super-admin/bulk-import"     },
    { icon: Activity,      label: "API Usage",  href: "/super-admin/api-usage"       },
    { icon: ScrollText,    label: "Audit Log",   href: "/super-admin/audit-log"       },
    { icon: Siren,         label: "Incidents",   href: "/super-admin/incidents"       },
    { icon: Database,      label: "System Health", href: "/super-admin/system-health" },
  ]

  if (!session) return null

  return (
    <DashboardSessionGate>
      <ProfessionalDashboardLayout
        userRole="SUPER_ADMIN"
        userName={session.user?.name || 'Super Admin'}
        userEmail={session.user?.email || ''}
        schoolName="ElimuNova AI Platform"
        sidebarItems={sidebarItems}
      >
        {children}
      </ProfessionalDashboardLayout>
    </DashboardSessionGate>
  )
}
