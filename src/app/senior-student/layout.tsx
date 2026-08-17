'use client'

import { useSession } from 'next-auth/react'
import { ProfessionalDashboardLayout } from '@/components/layout/professional-dashboard-layout'
import { SeniorAccessGate } from '@/components/senior-student/senior-access-gate'
import {
  BarChart3, GraduationCap, Laptop, Award, Radio,
} from 'lucide-react'
import { DashboardSessionGate } from '@/components/ui/dashboard-session-gate'

export default function SeniorStudentLayout({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession()

  const sidebarItems = [
    { icon: BarChart3,     label: 'Dashboard',   href: '/senior-student/dashboard',   tourId: 'senior-dashboard' },
    { icon: GraduationCap, label: 'GED Subjects', href: '/senior-student/learn',      tourId: 'senior-ged-subjects' },
    { icon: Laptop,        label: 'Courses',      href: '/senior-student/learn?tab=courses', tourId: 'senior-courses' },
    { icon: Radio,         label: 'Live Lessons', href: '/senior-student/live-class', tourId: 'senior-live-lessons' },
    { icon: Award,         label: 'Certificate',  href: '/senior-student/certificate', tourId: 'senior-certificate' },
  ]

  if (!session) return null

  return (
    <DashboardSessionGate>
      <ProfessionalDashboardLayout
        userRole="SENIOR_STUDENT"
        userName={session.user?.name || 'Senior Student'}
        userEmail={session.user?.email || ''}
        schoolName="General Education Diploma"
        sidebarItems={sidebarItems}
      >
        <SeniorAccessGate>{children}</SeniorAccessGate>
      </ProfessionalDashboardLayout>
    </DashboardSessionGate>
  )
}
