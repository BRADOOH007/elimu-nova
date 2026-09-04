import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { Loader2 } from 'lucide-react'

const ROLE_PATH: Record<string, string> = {
  SUPER_ADMIN: '/super-admin/dashboard',
  SCHOOL_ADMIN: '/school-admin/dashboard',
  TEACHER: '/teacher/dashboard',
  STUDENT: '/student/dashboard',
  PARENT: '/parent/dashboard',
  SENIOR_STUDENT: '/senior-student/dashboard',
  SENIOR_TEACHER: '/senior-teacher/dashboard',
}

export const dynamic = 'force-dynamic'

export default async function DashboardRedirect() {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect('/auth/signin')
  }

  const role = session.user.role as string
  const target = ROLE_PATH[role] || '/auth/signin'

  // Server-side redirect — happens before any client render, so there's no
  // "Redirecting..." flash. The user lands directly on their role dashboard.
  redirect(target)

  // This is unreachable; present only so the function signature returns a value.
  return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
    </div>
  )
}
