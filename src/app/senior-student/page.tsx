'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function SeniorStudentPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/senior-student/dashboard')
  }, [router])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mx-auto"></div>
        <p className="mt-2 text-gray-600">Redirecting to your dashboard...</p>
      </div>
    </div>
  )
}
