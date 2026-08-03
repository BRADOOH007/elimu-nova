'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Zap } from 'lucide-react'

interface UsageStats {
  daily: number
  dailyLimit: number
  monthly: number
  monthlyLimit: number
  tokensThisMonth: number
}

export function AIUsageCard() {
  const [stats, setStats] = useState<UsageStats | null>(null)

  useEffect(() => {
    fetch('/api/ai/usage')
      .then((r) => r.json())
      .then(setStats)
      .catch(() => {})
  }, [])

  if (!stats) return null

  const dailyPct = stats.dailyLimit > 0 ? Math.min((stats.daily / stats.dailyLimit) * 100, 100) : 0
  const monthlyPct = stats.monthlyLimit > 0 ? Math.min((stats.monthly / stats.monthlyLimit) * 100, 100) : 0

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Zap className="h-4 w-4 text-yellow-500" />
          AI Usage
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span>Today</span>
            <span className="text-muted-foreground">
              {stats.daily} / {stats.dailyLimit === 999999 ? '∞' : stats.dailyLimit}
            </span>
          </div>
          <Progress value={dailyPct} className="h-1.5" />
        </div>
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span>This Month</span>
            <span className="text-muted-foreground">
              {stats.monthly} / {stats.monthlyLimit === 999999 ? '∞' : stats.monthlyLimit}
            </span>
          </div>
          <Progress value={monthlyPct} className="h-1.5" />
        </div>
        {stats.tokensThisMonth > 0 && (
          <p className="text-xs text-muted-foreground">
            {stats.tokensThisMonth.toLocaleString()} tokens used this month
          </p>
        )}
      </CardContent>
    </Card>
  )
}
