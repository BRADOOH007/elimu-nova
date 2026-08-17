'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Loader2 } from 'lucide-react'

export default function DashboardRedirect() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'loading') return

    if (!session) {
      router.push('/auth/signin')
      return
    }

    switch (session.user.role) {
      case 'SUPER_ADMIN':
        router.push('/super-admin/dashboard')
        break
      case 'SCHOOL_ADMIN':
        router.push('/school-admin/dashboard')
        break
      case 'TEACHER':
        router.push('/teacher/dashboard')
        break
      case 'STUDENT':
        router.push('/student/dashboard')
        break
      case 'PARENT':
        router.push('/parent/dashboard')
        break
      case 'SENIOR_STUDENT':
        router.push('/senior-student/dashboard')
        break
      case 'SENIOR_TEACHER':
        router.push('/senior-teacher/dashboard')
        break
      default:
        router.push('/auth/signin')
    }
  }, [session, status, router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <div className="text-center">
        <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
        <p className="text-gray-600 text-lg">Redirecting to your dashboard...</p>
      </div>
    </div>
  )
}
