'use client'

import { useSession } from 'next-auth/react'
import { ProfessionalDashboardLayout } from '@/components/layout/professional-dashboard-layout'
import { useSchoolInfo } from '@/hooks/use-school-info'
import { useUnreadMessages } from '@/hooks/use-unread-messages'
import {
  BarChart3, BookOpen, ClipboardList, Calendar, Brain,
  Trophy, MessageSquare, Code2, Compass, Users, Radio
} from 'lucide-react'
import { DashboardLoading } from '@/components/ui/dashboard-loading'

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession()
  const { schoolInfo, loading } = useSchoolInfo()
  const { unreadCount } = useUnreadMessages()

  const sidebarItems = [
    { icon: BarChart3,     label: "Dashboard",       href: "/student/dashboard"    },
    { icon: BookOpen,      label: "My Lessons",      href: "/student/lesson-plans" },
    { icon: ClipboardList, label: "Assignments",     href: "/student/assignments"  },
    { icon: Calendar,      label: "Schedule",        href: "/student/schedule"     },
    { icon: Radio,         label: "Live Class",      href: "/student/live-class"   },
    { icon: Users,         label: "Discussions",     href: "/student/discussions"  },
    { icon: Trophy,        label: "Progress",        href: "/student/progress"     },
    { icon: Brain,         label: "AI Tutor",        href: "/student/ai-tutor"     },
    { icon: Code2,         label: "Coding Studio",   href: "/student/coding"       },
    { icon: Compass,       label: "Career Pathways", href: "/student/career"       },
    {
      icon: MessageSquare,
      label: "Messages",
      href: "/student/messages",
      badge: unreadCount > 0 ? unreadCount : undefined,
    },
  ]

  if (!session || loading) return <DashboardLoading />

  return (
    <ProfessionalDashboardLayout
      userRole="STUDENT"
      userName={session.user?.name || 'Student'}
      userEmail={session.user?.email || ''}
      schoolName={schoolInfo?.school?.name || 'Loading...'}
      sidebarItems={sidebarItems}
    >
      {children}
    </ProfessionalDashboardLayout>
  )
}
