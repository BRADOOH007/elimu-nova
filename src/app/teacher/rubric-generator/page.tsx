'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function RubricGeneratorPage() {
  const router = useRouter()
  useEffect(() => { router.replace('/teacher/rubrics') }, [router])
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
    </div>
  )
}
