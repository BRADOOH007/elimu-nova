"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Loader2, Activity, Search, Filter, Shield, AlertTriangle, Info, User, Building2, ClipboardList, History } from "lucide-react"

interface SecurityEntry {
  id: string; eventType: string; severity: string; description: string
  ipAddress?: string; userId?: string; schoolId?: string
  createdAt: string; resolved: boolean
  user?: { firstName: string; lastName: string; email: string }
}

interface AdminChangeEntry {
  id: string; action: string; entity: string; entityId?: string
  summary: string; changes?: string; ipAddress?: string; createdAt: string
  actor: { firstName: string; lastName: string; email: string }
}

export default function AuditLogPage() {
  const [tab, setTab] = useState("security")
  const [secLogs, setSecLogs] = useState<SecurityEntry[]>([])
  const [adminLogs, setAdminLogs] = useState<AdminChangeEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [severity, setSeverity] = useState("ALL")
  const [entityFilter, setEntityFilter] = useState("ALL")
  const [page, setPage] = useState(1)

  useEffect(() => {
    if (tab === "security") fetchSecurityLogs()
    else fetchAdminLogs()
  }, [tab, page, severity, entityFilter])

  const fetchSecurityLogs = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), limit: '50' })
      if (severity !== 'ALL') params.set('severity', severity)
      const res = await fetch(`/api/security/logs?${params}`)
      if (res.ok) setSecLogs((await res.json()).logs || [])
    } catch (e) { console.warn('[SuperAdminAuditLog] fetchSecLogs error:', e) } finally { setLoading(false) }
  }

  const fetchAdminLogs = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), limit: '50' })
      if (entityFilter !== 'ALL') params.set('entity', entityFilter)
      const res = await fetch(`/api/super-admin/audit-logs?${params}`)
      if (res.ok) {
        const d = await res.json()
        setAdminLogs(d.logs || [])
      }
    } catch (e) { console.warn('[SuperAdminAuditLog] fetchAdminLogs error:', e) } finally { setLoading(false) }
  }

  const sevBadge = (s: string) => {
    switch (s) {
      case 'CRITICAL': return 'bg-red-100 text-red-800'
      case 'HIGH': return 'bg-orange-100 text-orange-800'
      case 'MEDIUM': return 'bg-amber-100 text-amber-800'
      default: return 'bg-blue-100 text-blue-800'
    }
  }

  const actionBadge = (a: string) => {
    switch (a) {
      case 'CREATE': return 'bg-emerald-100 text-emerald-800'
      case 'UPDATE': return 'bg-amber-100 text-amber-800'
      case 'DELETE': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const filteredSecurity = secLogs.filter(l =>
    !search || l.description?.toLowerCase().includes(search.toLowerCase()) ||
    l.eventType?.toLowerCase().includes(search.toLowerCase()) ||
    l.user?.firstName?.toLowerCase().includes(search.toLowerCase())
  )

  const filteredAdmin = adminLogs.filter(l =>
    !search || l.summary?.toLowerCase().includes(search.toLowerCase()) ||
    l.entity?.toLowerCase().includes(search.toLowerCase()) ||
    l.actor?.firstName?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <ClipboardList className="w-6 h-6 text-blue-600" /> Audit Log
        </h1>
        <p className="text-sm text-gray-600">Security events and super admin change tracking</p>
      </div>

      <Tabs value={tab} onValueChange={v => { setTab(v); setPage(1) }}>
        <TabsList>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="w-4 h-4" /> Security Events
          </TabsTrigger>
          <TabsTrigger value="admin" className="flex items-center gap-2">
            <History className="w-4 h-4" /> Admin Changes
          </TabsTrigger>
        </TabsList>

        <div className="flex items-center gap-4 mt-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." className="pl-10" />
          </div>
          {tab === "security" ? (
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
          ) : (
            <Select value={entityFilter} onValueChange={setEntityFilter}>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Entities</SelectItem>
                <SelectItem value="school">School</SelectItem>
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="package">Package</SelectItem>
                <SelectItem value="billing">Billing</SelectItem>
                <SelectItem value="system_setting">Settings</SelectItem>
              </SelectContent>
            </Select>
          )}
          <Button variant="outline" onClick={tab === "security" ? fetchSecurityLogs : fetchAdminLogs}>
            <Loader2 className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        <TabsContent value="security" className="mt-4">
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin" /></div>
          ) : filteredSecurity.length === 0 ? (
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
                      <TableHead>Description</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSecurity.map(log => (
                      <TableRow key={log.id}>
                        <TableCell className="font-medium text-sm">{log.eventType.replace(/_/g, ' ')}</TableCell>
                        <TableCell><Badge className={sevBadge(log.severity)}>{log.severity}</Badge></TableCell>
                        <TableCell className="text-sm">{log.user ? `${log.user.firstName} ${log.user.lastName}` : '-'}</TableCell>
                        <TableCell className="text-sm text-gray-600 max-w-[250px] truncate">{log.description}</TableCell>
                        <TableCell className="text-sm whitespace-nowrap">{new Date(log.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell><Badge variant={log.resolved ? 'default' : 'secondary'}>{log.resolved ? 'Resolved' : 'Open'}</Badge></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="admin" className="mt-4">
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin" /></div>
          ) : filteredAdmin.length === 0 ? (
            <Card><CardContent className="p-8 text-center text-gray-500">No admin changes recorded yet</CardContent></Card>
          ) : (
            <Card className="border-0 shadow">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Action</TableHead>
                      <TableHead>Entity</TableHead>
                      <TableHead>Actor</TableHead>
                      <TableHead>Summary</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAdmin.map(log => (
                      <TableRow key={log.id}>
                        <TableCell><Badge className={actionBadge(log.action)}>{log.action}</Badge></TableCell>
                        <TableCell className="text-sm font-medium capitalize">{log.entity}</TableCell>
                        <TableCell className="text-sm">{log.actor.firstName} {log.actor.lastName}</TableCell>
                        <TableCell className="text-sm text-gray-600 max-w-[300px] truncate">{log.summary}</TableCell>
                        <TableCell className="text-sm whitespace-nowrap">{new Date(log.createdAt).toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      <div className="flex justify-center gap-2">
        <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
        <span className="text-sm text-gray-500 py-2">Page {page}</span>
        <Button variant="outline" size="sm" disabled={(tab === "security" ? filteredSecurity.length : filteredAdmin.length) < 50} onClick={() => setPage(p => p + 1)}>Next</Button>
      </div>
    </div>
  )
}
