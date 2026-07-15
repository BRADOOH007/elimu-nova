"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Loader2, AlertTriangle, Bell, AlertCircle, Info, CheckCircle, User, Calendar, Eye } from "lucide-react"

interface Alert {
  id: string; studentId: string; studentName: string; type: string
  title: string; message: string; severity: 'critical' | 'warning' | 'info'
  subject?: string; detectedAt: string; isRead: boolean
}

export default function ParentAlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'critical' | 'warning' | 'info'>('all')

  useEffect(() => {
    fetch('/api/parent/alerts')
      .then(r => r.ok ? r.json() : { alerts: [] })
      .then(data => { setAlerts(data.alerts || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const sevIcon = (s: string) => {
    switch (s) {
      case 'critical': return <AlertCircle className="w-4 h-4 text-red-500" />
      case 'warning': return <AlertTriangle className="w-4 h-4 text-amber-500" />
      default: return <Info className="w-4 h-4 text-blue-500" />
    }
  }

  const sevBadge = (s: string) => {
    switch (s) {
      case 'critical': return 'bg-red-100 text-red-800'
      case 'warning': return 'bg-amber-100 text-amber-800'
      default: return 'bg-blue-100 text-blue-800'
    }
  }

  const filtered = filter === 'all' ? alerts : alerts.filter(a => a.severity === filter)
  const critical = alerts.filter(a => a.severity === 'critical').length

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Bell className="w-6 h-6 text-blue-600" /> Alerts & Notifications</h1>
          <p className="text-sm text-gray-600">Stay informed about your children's progress</p>
        </div>
        {critical > 0 && <Badge className="bg-red-100 text-red-800 text-sm"><AlertCircle className="w-4 h-4 mr-1" /> {critical} critical</Badge>}
      </div>

      <div className="flex gap-2">
        {(['all', 'critical', 'warning', 'info'] as const).map(f => (
          <Button key={f} size="sm" variant={filter === f ? 'default' : 'outline'} onClick={() => setFilter(f)}>
            {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
            {f === 'critical' && critical > 0 && <Badge className="ml-2 bg-white/30 text-white">{critical}</Badge>}
          </Button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-gray-500">
          <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-2" />
          No alerts — everything looks good!
        </CardContent></Card>
      ) : (
        <div className="space-y-3">
          {filtered.map(alert => (
            <Card key={alert.id} className={`border-0 shadow ${alert.severity === 'critical' ? 'border-l-4 border-l-red-500' : alert.severity === 'warning' ? 'border-l-4 border-l-amber-500' : ''}`}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="mt-1">{sevIcon(alert.severity)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-gray-900">{alert.title}</h3>
                      <Badge className={sevBadge(alert.severity)}>{alert.severity}</Badge>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{alert.message}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                      <span className="flex items-center"><User className="w-3 h-3 mr-1" />{alert.studentName}</span>
                      {alert.subject && <span>{alert.subject}</span>}
                      <span className="flex items-center"><Calendar className="w-3 h-3 mr-1" />{new Date(alert.detectedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
