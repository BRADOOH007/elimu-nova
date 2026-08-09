"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Siren, Activity, CheckCircle2, AlertTriangle, ShieldAlert, RefreshCw } from "lucide-react"

interface Incident {
  id: string
  severity: string
  category: string
  status: string
  title: string
  description: string
  source?: string
  count: number
  firstSeen: string
  lastSeen: string
  resolvedAt?: string
  resolvedBy?: string
  metadata?: Record<string, unknown>
}

const sevBadge = (s: string) => {
  switch (s) {
    case 'CRITICAL': return 'bg-red-100 text-red-800'
    case 'HIGH': return 'bg-orange-100 text-orange-800'
    case 'MEDIUM': return 'bg-amber-100 text-amber-800'
    default: return 'bg-blue-100 text-blue-800'
  }
}

const statusBadge = (s: string) => {
  switch (s) {
    case 'OPEN': return 'bg-red-100 text-red-800'
    case 'ACKNOWLEDGED': return 'bg-amber-100 text-amber-800'
    default: return 'bg-emerald-100 text-emerald-800'
  }
}

const sevIcon = (s: string) => {
  switch (s) {
    case 'CRITICAL': return <ShieldAlert className="w-4 h-4 text-red-600" />
    case 'HIGH': return <AlertTriangle className="w-4 h-4 text-orange-500" />
    case 'MEDIUM': return <AlertTriangle className="w-4 h-4 text-amber-500" />
    default: return <Activity className="w-4 h-4 text-blue-500" />
  }
}

export default function IncidentsPage() {
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState("OPEN")
  const [severityFilter, setSeverityFilter] = useState("ALL")
  const [categoryFilter, setCategoryFilter] = useState("ALL")
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [runningCheck, setRunningCheck] = useState(false)
  const [actionBusy, setActionBusy] = useState<string | null>(null)

  const fetchIncidents = async (run = false) => {
    if (run) setRunningCheck(true)
    setLoading(true)
    try {
      if (run) await fetch('/api/cron/health-agent')
      const params = new URLSearchParams({ page: String(page), limit: '50' })
      if (statusFilter !== 'ALL') params.set('status', statusFilter)
      if (severityFilter !== 'ALL') params.set('severity', severityFilter)
      if (categoryFilter !== 'ALL') params.set('category', categoryFilter)
      const res = await fetch(`/api/super-admin/incidents?${params}`)
      if (res.ok) {
        const d = await res.json()
        setIncidents(d.incidents || [])
        setStatusCounts(d.statusCounts || {})
        setPages(d.pages || 1)
      }
    } catch (e) { console.warn('[SuperAdminIncidents] fetch error:', e) } finally {
      setLoading(false)
      if (run) setRunningCheck(false)
    }
  }

  useEffect(() => {
    const controller = new AbortController()
    const load = async () => {
      try {
        const params = new URLSearchParams({ page: String(page), limit: '50' })
        if (statusFilter !== 'ALL') params.set('status', statusFilter)
        if (severityFilter !== 'ALL') params.set('severity', severityFilter)
        if (categoryFilter !== 'ALL') params.set('category', categoryFilter)
        const res = await fetch(`/api/super-admin/incidents?${params}`, { signal: controller.signal })
        if (res.ok) {
          const d = await res.json()
          setIncidents(d.incidents || [])
          setStatusCounts(d.statusCounts || {})
          setPages(d.pages || 1)
        }
      } catch (e) {
        if ((e as Error)?.name !== 'AbortError') console.warn('[SuperAdminIncidents] fetch error:', e)
      } finally {
        setLoading(false)
      }
    }
    load()
    return () => controller.abort()
  }, [page, statusFilter, severityFilter, categoryFilter])

  const updateIncident = async (id: string, action: string) => {
    setActionBusy(id)
    try {
      await fetch('/api/super-admin/incidents', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action }),
      })
      await fetchIncidents()
    } catch (e) { console.warn('[SuperAdminIncidents] update error:', e) } finally { setActionBusy(null) }
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Siren className="w-6 h-6 text-red-600" /> Incidents & Alerts
          </h1>
          <p className="text-sm text-gray-600">System issues, security events, and anomalies detected by the health agent</p>
        </div>
        <Button onClick={() => fetchIncidents(true)} disabled={runningCheck}>
          <RefreshCw className={`w-4 h-4 mr-2 ${runningCheck ? 'animate-spin' : ''}`} />
          Run Health Check
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card><CardContent className="p-5"><div className="text-3xl font-bold text-red-600">{statusCounts.OPEN || 0}</div><div className="text-sm text-gray-600">Open Incidents</div></CardContent></Card>
        <Card><CardContent className="p-5"><div className="text-3xl font-bold text-amber-600">{statusCounts.ACKNOWLEDGED || 0}</div><div className="text-sm text-gray-600">Acknowledged</div></CardContent></Card>
        <Card><CardContent className="p-5"><div className="text-3xl font-bold text-emerald-600">{statusCounts.RESOLVED || 0}</div><div className="text-sm text-gray-600">Resolved</div></CardContent></Card>
      </div>

      <div className="flex items-center gap-3">
        <Select value={statusFilter} onValueChange={v => { setStatusFilter(v); setPage(1) }}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Statuses</SelectItem>
            <SelectItem value="OPEN">Open</SelectItem>
            <SelectItem value="ACKNOWLEDGED">Acknowledged</SelectItem>
            <SelectItem value="RESOLVED">Resolved</SelectItem>
          </SelectContent>
        </Select>
        <Select value={severityFilter} onValueChange={v => { setSeverityFilter(v); setPage(1) }}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Severities</SelectItem>
            <SelectItem value="CRITICAL">Critical</SelectItem>
            <SelectItem value="HIGH">High</SelectItem>
            <SelectItem value="MEDIUM">Medium</SelectItem>
            <SelectItem value="LOW">Low</SelectItem>
          </SelectContent>
        </Select>
        <Select value={categoryFilter} onValueChange={v => { setCategoryFilter(v); setPage(1) }}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Categories</SelectItem>
            <SelectItem value="API_ERROR">API Errors</SelectItem>
            <SelectItem value="ROUTE_404">404s</SelectItem>
            <SelectItem value="RATE_LIMIT">Rate Limit</SelectItem>
            <SelectItem value="SECURITY">Security</SelectItem>
            <SelectItem value="DATABASE">Database</SelectItem>
            <SelectItem value="AI_SERVICE">AI Service</SelectItem>
            <SelectItem value="PAYMENT">Payment</SelectItem>
            <SelectItem value="PERFORMANCE">Performance</SelectItem>
            <SelectItem value="OTHER">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin" /></div>
      ) : incidents.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-gray-500">
          <CheckCircle2 className="w-10 h-10 mx-auto mb-2 text-emerald-500" />
          No incidents found. All systems appear healthy.
        </CardContent></Card>
      ) : (
        <Card className="border-0 shadow">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Severity</TableHead>
                  <TableHead>Incident</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Occurrences</TableHead>
                  <TableHead>Last Seen</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {incidents.map(inc => (
                  <TableRow key={inc.id}>
                    <TableCell>
                      <Badge className={sevBadge(inc.severity)}>{inc.severity}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-start gap-2">
                        {sevIcon(inc.severity)}
                        <div>
                          <div className="font-medium text-sm">{inc.title}</div>
                          <div className="text-xs text-gray-500 max-w-[320px]">{inc.description}</div>
                          {inc.source && <div className="text-xs text-gray-400 font-mono">{inc.source}</div>}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell><Badge variant="secondary" className="text-xs">{inc.category.replace(/_/g, ' ')}</Badge></TableCell>
                    <TableCell className="text-sm">{inc.count}</TableCell>
                    <TableCell className="text-sm whitespace-nowrap">{new Date(inc.lastSeen).toLocaleString()}</TableCell>
                    <TableCell><Badge className={statusBadge(inc.status)}>{inc.status}</Badge></TableCell>
                    <TableCell>
                      {inc.status !== 'RESOLVED' && (
                        <div className="flex gap-2">
                          {inc.status === 'OPEN' && (
                            <Button variant="outline" size="sm" disabled={actionBusy === inc.id} onClick={() => updateIncident(inc.id, 'ACKNOWLEDGE')}>
                              Acknowledge
                            </Button>
                          )}
                          <Button variant="default" size="sm" disabled={actionBusy === inc.id} onClick={() => updateIncident(inc.id, 'RESOLVE')}>
                            Resolve
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-center gap-2">
        <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
        <span className="text-sm text-gray-500 py-2">Page {page} of {pages}</span>
        <Button variant="outline" size="sm" disabled={page >= pages} onClick={() => setPage(p => p + 1)}>Next</Button>
      </div>
    </div>
  )
}
