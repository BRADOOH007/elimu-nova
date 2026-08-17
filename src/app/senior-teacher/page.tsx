'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function SeniorTeacherPage() {
  const router = useRouter()
  useEffect(() => { router.replace('/senior-teacher/dashboard') }, [router])
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto"></div>
        <p className="mt-2 text-gray-600">Redirecting to your dashboard...</p>
      </div>
    </div>
  )
}
