'use client'

import { useSession } from 'next-auth/react'
import { ProfessionalDashboardLayout } from '@/components/layout/professional-dashboard-layout'
import {
  BarChart3, Radio, GraduationCap,
} from 'lucide-react'
import { DashboardSessionGate } from '@/components/ui/dashboard-session-gate'

export default function SeniorTeacherLayout({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession()

  const sidebarItems = [
    { icon: BarChart3,     label: 'Dashboard',   href: '/senior-teacher/dashboard',   tourId: 'senior-teacher-dashboard' },
    { icon: Radio,         label: 'Live Lessons', href: '/senior-teacher/live-class', tourId: 'senior-teacher-live' },
    { icon: GraduationCap, label: 'GED Subjects', href: '/senior-teacher/dashboard#subjects', tourId: 'senior-teacher-subjects' },
  ]

  if (!session) return null

  return (
    <DashboardSessionGate>
      <ProfessionalDashboardLayout
        userRole="SENIOR_TEACHER"
        userName={session.user?.name || 'Senior Teacher'}
        userEmail={session.user?.email || ''}
        schoolName="Adult Education"
        sidebarItems={sidebarItems}
      >
        {children}
      </ProfessionalDashboardLayout>
    </DashboardSessionGate>
  )
}
