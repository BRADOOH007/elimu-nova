"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Loader2, Activity, Search, Filter, Calendar, Shield, AlertTriangle, Info, User, Building2 } from "lucide-react"

interface AuditEntry {
  id: string; eventType: string; severity: string; description: string
  ipAddress?: string; userAgent?: string; userId?: string; schoolId?: string
  createdAt: string; resolved: boolean
  user?: { firstName: string; lastName: string; email: string }
  school?: { name: string }
}

export default function AuditLogPage() {
  const [logs, setLogs] = useState<AuditEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [severity, setSeverity] = useState("ALL")
  const [page, setPage] = useState(1)

  useEffect(() => { fetchLogs() }, [page, severity])

  const fetchLogs = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), limit: '50' })
      if (severity !== 'ALL') params.set('severity', severity)
      const res = await fetch(`/api/security/logs?${params}`)
      if (res.ok) setLogs((await res.json()).logs || [])
    } catch {} finally { setLoading(false) }
  }

  const sevBadge = (s: string) => {
    switch (s) {
      case 'CRITICAL': return 'bg-red-100 text-red-800'
      case 'HIGH': return 'bg-orange-100 text-orange-800'
      case 'MEDIUM': return 'bg-amber-100 text-amber-800'
      default: return 'bg-blue-100 text-blue-800'
    }
  }

  const filtered = logs.filter(l =>
    l.description?.toLowerCase().includes(search.toLowerCase()) ||
    l.eventType?.toLowerCase().includes(search.toLowerCase()) ||
    l.user?.firstName?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><Shield className="w-6 h-6 text-blue-600" /> Audit Log</h1>
        <p className="text-sm text-gray-600">Security events and system activity across all schools</p>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search logs..." className="pl-10" />
        </div>
        <Select value={severity} onValueChange={setSeverity}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Severities</SelectItem>
            <SelectItem value="CRITICAL">Critical</SelectItem>
            <SelectItem value="HIGH">High</SelectItem>
            <SelectItem value="MEDIUM">Medium</SelectItem>
            <SelectItem value="LOW">Low</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={fetchLogs}><Loader2 className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /></Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-gray-500">No security events found</CardContent></Card>
      ) : (
        <Card className="border-0 shadow">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Event</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>School</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(log => (
                  <TableRow key={log.id}>
                    <TableCell className="font-medium text-sm">{log.eventType.replace(/_/g, ' ')}</TableCell>
                    <TableCell><Badge className={sevBadge(log.severity)}>{log.severity}</Badge></TableCell>
                    <TableCell className="text-sm">{log.user ? `${log.user.firstName} ${log.user.lastName}` : '-'}</TableCell>
                    <TableCell className="text-sm">{log.school?.name || '-'}</TableCell>
                    <TableCell className="text-sm text-gray-600 max-w-[200px] truncate">{log.description}</TableCell>
                    <TableCell className="text-sm">{new Date(log.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell><Badge variant={log.resolved ? 'default' : 'secondary'}>{log.resolved ? 'Resolved' : 'Open'}</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-center gap-2">
        <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
        <span className="text-sm text-gray-500 py-2">Page {page}</span>
        <Button variant="outline" size="sm" disabled={filtered.length < 50} onClick={() => setPage(p => p + 1)}>Next</Button>
      </div>
    </div>
  )
}
