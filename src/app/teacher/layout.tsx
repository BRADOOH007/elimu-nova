'use client'

import { useSession } from 'next-auth/react'
import { ProfessionalDashboardLayout } from '@/components/layout/professional-dashboard-layout'
import { useSchoolInfo } from '@/hooks/use-school-info'
import { useUnreadMessages } from '@/hooks/use-unread-messages'
import {
  BookOpen, Users, FileText, BarChart3, Calendar, Brain,
  ClipboardList, Mail, Activity, CheckCircle, Presentation,
  PenTool, Wand2, LineChart, CreditCard, Clock, MessageSquare,
  Radio, Database, CalendarDays
} from 'lucide-react'
import { DashboardLoading } from '@/components/ui/dashboard-loading'

export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession()
  const { schoolInfo, loading } = useSchoolInfo()
  const { unreadCount } = useUnreadMessages()

  const sidebarItems = [
    { icon: BarChart3,     label: "Dashboard",        href: "/teacher/dashboard"        },
    { icon: Users,         label: "My Students",      href: "/teacher/students"         },
    { icon: Activity,      label: "Progress Monitor", href: "/teacher/progress-monitor" },
    { icon: LineChart,     label: "Analytics",        href: "/teacher/analytics"        },
    { icon: BookOpen,      label: "Lesson Plans",     href: "/teacher/lesson-plans"     },
    { icon: FileText,      label: "Schemes of Work",  href: "/teacher/schemes-of-work"  },
    { icon: ClipboardList, label: "Assessments",      href: "/teacher/assignments"      },
    { icon: Database,      label: "Exam Bank",        href: "/teacher/exam-bank"        },
    { icon: PenTool,       label: "Marks Entry",      href: "/teacher/marks"            },
    { icon: CheckCircle,   label: "Attendance",       href: "/teacher/attendance"       },
    { icon: CalendarDays,  label: "Calendar",         href: "/teacher/calendar"         },
    { icon: Wand2,         label: "AI Tools",         href: "/teacher/ai-tools"         },
    { icon: Presentation,  label: "PowerPoint AI",    href: "/teacher/powerpoint"       },
    { icon: Radio,         label: "Live Class",       href: "/teacher/live-class"       },
    { icon: Calendar,      label: "Meetings",         href: "/teacher/meetings"         },
    { icon: MessageSquare, label: "Discussions",      href: "/teacher/discussions"      },
    { icon: Clock,         label: "Schedule",         href: "/teacher/schedule"         },
    { icon: Brain,         label: "Hope AI",          href: "/teacher/alexa"            },
    {
      icon: Mail,
      label: "Messages",
      href: "/teacher/messages",
      badge: unreadCount > 0 ? unreadCount : undefined,
    },
    { icon: CreditCard,    label: "Billing",          href: "/teacher/billing"          },
  ]

  if (!session || loading) return <DashboardLoading />

  return (
    <ProfessionalDashboardLayout
      userRole="TEACHER"
      userName={session.user?.name || 'Teacher'}
      userEmail={session.user?.email || ''}
      schoolName={schoolInfo?.school?.name || 'Loading...'}
      sidebarItems={sidebarItems}
    >
      {children}
    </ProfessionalDashboardLayout>
  )
}
