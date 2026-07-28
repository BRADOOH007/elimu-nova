'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, AlertCircle, Info, CheckCircle, Loader2, Bell, X } from 'lucide-react'
import Link from 'next/link'

interface AlertAction { label: string; href: string }

interface Alert {
  id: string
  type: 'warning' | 'danger' | 'info' | 'success'
  title: string
  description: string
  action?: AlertAction
}

const typeConfig = {
  danger: { icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50 border-red-200', badge: 'bg-red-100 text-red-700' },
  warning: { icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200', badge: 'bg-amber-100 text-amber-700' },
  info: { icon: Info, color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200', badge: 'bg-blue-100 text-blue-700' },
  success: { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50 border-green-200', badge: 'bg-green-100 text-green-700' },
}

export default function AlertCenter() {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/teacher/alerts')
        if (res.ok) {
          const data = await res.json()
          setAlerts(data.alerts || [])
        }
      } catch (e) { console.warn('[AlertCenter] Failed to fetch alerts:', e) }
      finally { setLoading(false) }
    })()
  }, [])

  const visibleAlerts = alerts.filter(a => !dismissed.has(a.id))

  if (loading) {
    return (
      <Card className="border-0 shadow-lg">
        <CardContent className="p-6 flex items-center justify-center h-32">
          <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
        </CardContent>
      </Card>
    )
  }

  if (visibleAlerts.length === 0 && !loading) return null

  return (
    <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-amber-50/50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Bell className="w-5 h-5 text-amber-500" />
          Alerts & Reminders
          <Badge className="ml-auto bg-amber-100 text-amber-700 border-0">
            {visibleAlerts.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {visibleAlerts.map(alert => {
          const config = typeConfig[alert.type]
          const Icon = config.icon
          return (
            <div key={alert.id} className={`flex items-start gap-3 p-3 rounded-xl border ${config.bg}`}>
              <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${config.color}`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="font-semibold text-sm text-gray-900">{alert.title}</p>
                  <Badge className={`${config.badge} border-0 text-[10px]`}>{alert.type}</Badge>
                </div>
                <p className="text-xs text-gray-600">{alert.description}</p>
                {alert.action && (
                  <Link href={alert.action.href}>
                    <Button variant="link" className="h-auto p-0 text-xs text-blue-600 mt-1">
                      {alert.action.label} →
                    </Button>
                  </Link>
                )}
              </div>
              <button
                onClick={() => setDismissed(prev => new Set(prev).add(alert.id))}
                className="shrink-0 text-gray-300 hover:text-gray-500 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
