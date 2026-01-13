'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

/**
 * AI Content Hub - Redirects to AI Tools
 * This page was consolidated into the AI Tools page for better user experience
 */
export default function AIContentRedirectPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to AI Tools page
    router.replace('/teacher/ai-tools')
  }, [router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 bg-gradient-to-r from-blue-600 to-purple-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Redirecting to AI Tools...</p>
      </div>
    </div>
  )
}