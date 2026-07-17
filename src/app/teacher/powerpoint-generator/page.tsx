'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function PowerPointGeneratorPage() {
  const router = useRouter()
  useEffect(() => { router.replace('/teacher/powerpoint') }, [router])
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
    </div>
  )
}
