'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { Radio, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function ActiveLiveClassBanner() {
  const { data: session } = useSession()
  const [sessionData, setSessionData] = useState<{ title: string; teacher: string; code: string; subject: string } | null>(null)

  useEffect(() => {
    if (!session?.user) return
    const interval = setInterval(async () => {
      try {
        const res = await fetch('/api/live-session')
        if (!res.ok) return
        const data = await res.json()
        const active = data.sessions?.find((s: any) => s.status === 'IN_PROGRESS' && s.type === 'CLASS')
        if (active) {
          setSessionData({
            title: active.title,
            teacher: active.teacher?.user?.firstName || 'Teacher',
            code: active.metadata?.sessionCode || '',
            subject: active.subject || 'Live Class',
          })
        } else {
          setSessionData(null)
        }
      } catch { setSessionData(null) }
    }, 15000)
    return () => clearInterval(interval)
  }, [session])

  if (!sessionData) return null

  return (
    <div className="bg-gradient-to-r from-red-500 to-rose-600 text-white px-4 py-3 flex items-center justify-between animate-pulse rounded-xl shadow-lg">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
          <Radio className="h-4 w-4" />
        </div>
        <div>
          <p className="text-sm font-bold">🔴 LIVE: {sessionData.subject} — {sessionData.teacher}</p>
          <p className="text-[10px] text-white/80">Class is in session now</p>
        </div>
      </div>
      <a href={`/student/live-class?code=${sessionData.code}`}>
        <Button size="sm" className="bg-white text-red-600 hover:bg-red-50 font-bold text-xs border-0">
          Join Now <ArrowRight className="h-3.5 w-3.5 ml-1" />
        </Button>
      </a>
    </div>
  )
}
