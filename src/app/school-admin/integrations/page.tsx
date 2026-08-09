"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogBody } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Database, Mail, MessageSquare, Server, Plus, Trash2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function SchoolAdminIntegrationsPage() {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("databases")

  const [databases, setDatabases] = useState<any[]>([])
  const [showDbDialog, setShowDbDialog] = useState(false)
  const [dbForm, setDbForm] = useState({ name: "", type: "POSTGRESQL", host: "", port: "5432", database: "", username: "", password: "" })

  const [services, setServices] = useState<any[]>([])
  const [showServiceDialog, setShowServiceDialog] = useState(false)
  const [svcForm, setSvcForm] = useState({ name: "", type: "EMAIL", provider: "SENDGRID", apiKey: "", apiSecret: "", fromEmail: "" })

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => { fetchAll() }, [])

  const fetchAll = async () => {
    try {
      const [dbRes, svcRes] = await Promise.all([
        fetch('/api/school-admin/settings?category=databases'),
        fetch('/api/school-admin/settings?category=communication')
      ])
      if (dbRes.ok) {
        const data = await dbRes.json()
        setDatabases(data.settings?.map((s: any) => { try { return { id: s.id, ...JSON.parse(s.value) } } catch { return { id: s.id, name: s.key } } }) || [])
      }
      if (svcRes.ok) {
        const data = await svcRes.json()
        setServices(data.settings?.map((s: any) => { try { return { id: s.id, ...JSON.parse(s.value) } } catch { return { id: s.id, name: s.key } } }) || [])
      }
    } catch (e) { console.warn('[SchoolAdminIntegrations] fetchAll error:', e) } finally { setLoading(false) }
  }

  const handleAddDatabase = async () => {
    if (!dbForm.name || !dbForm.host) { toast({ title: 'Validation', description: 'Name and host are required', variant: 'destructive' }); return }
    setSaving(true)
    try {
      const res = await fetch('/api/school-admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: `db_${dbForm.name}`, value: JSON.stringify(dbForm), type: 'json', category: 'databases', description: `External database: ${dbForm.name}` })
      })
      if (res.ok) { toast({ title: 'Database added' }); setShowDbDialog(false); setDbForm({ name: "", type: "POSTGRESQL", host: "", port: "5432", database: "", username: "", password: "" }); fetchAll() }
      else { const e = await res.json(); toast({ title: 'Error', description: e.error, variant: 'destructive' }) }
    } catch { toast({ title: 'Error', variant: 'destructive' }) }
    finally { setSaving(false) }
  }

  const handleAddService = async () => {
    if (!svcForm.name || !svcForm.apiKey) { toast({ title: 'Validation', description: 'Name and API key are required', variant: 'destructive' }); return }
    setSaving(true)
    try {
      const res = await fetch('/api/school-admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: `svc_${svcForm.name}`, value: JSON.stringify(svcForm), type: 'json', category: 'communication', description: `Communication service: ${svcForm.name}` })
      })
      if (res.ok) { toast({ title: 'Service added' }); setShowServiceDialog(false); setSvcForm({ name: "", type: "EMAIL", provider: "SENDGRID", apiKey: "", apiSecret: "", fromEmail: "" }); fetchAll() }
      else { const e = await res.json(); toast({ title: 'Error', description: e.error, variant: 'destructive' }) }
    } catch { toast({ title: 'Error', variant: 'destructive' }) }
    finally { setSaving(false) }
  }

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/school-admin/settings/${id}`, { method: 'DELETE' })
      if (res.ok) { toast({ title: 'Deleted' }); fetchAll() }
    } catch (e) { console.warn('[SchoolAdminIntegrations] handleDelete error:', e) }
  }

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin" /></div>

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><Server className="w-6 h-6 text-blue-600" /> Integrations</h1>
        <p className="text-sm text-gray-600">Manage external services and connections</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="databases"><Database className="w-4 h-4 mr-2" />External Databases</TabsTrigger>
          <TabsTrigger value="communication"><Mail className="w-4 h-4 mr-2" />Communication</TabsTrigger>
          <TabsTrigger value="redis"><Server className="w-4 h-4 mr-2" />Redis</TabsTrigger>
        </TabsList>

        <TabsContent value="databases">
          <div className="flex justify-end mb-4">
            <Button onClick={() => setShowDbDialog(true)} className="bg-gradient-to-r from-blue-600 to-purple-600"><Plus className="w-4 h-4 mr-2" /> Add Database</Button>
          </div>
          {databases.length === 0 ? (
            <Card><CardContent className="p-8 text-center text-gray-500">No external databases configured</CardContent></Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {databases.map((db: any) => (
                <Card key={db.id} className="border-0 shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Database className="w-8 h-8 text-blue-500" />
                        <div>
                          <h3 className="font-semibold">{db.name}</h3>
                          <p className="text-sm text-gray-500">{db.type} · {db.host}:{db.port}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={db.isActive ? 'default' : 'secondary'}>{db.isActive ? 'Connected' : 'Disconnected'}</Badge>
                        <Button variant="ghost" size="sm" className="text-red-600 h-8 w-8 p-0" onClick={() => handleDelete(db.id)}><Trash2 className="w-4 h-4" /></Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="communication">
          <div className="flex justify-end mb-4">
            <Button onClick={() => setShowServiceDialog(true)} className="bg-gradient-to-r from-blue-600 to-purple-600"><Plus className="w-4 h-4 mr-2" /> Add Service</Button>
          </div>
          {services.length === 0 ? (
            <Card><CardContent className="p-8 text-center text-gray-500">No communication services configured</CardContent></Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {services.map((svc: any) => (
                <Card key={svc.id} className="border-0 shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {svc.type === 'EMAIL' ? <Mail className="w-8 h-8 text-purple-500" /> : <MessageSquare className="w-8 h-8 text-green-500" />}
                        <div>
                          <h3 className="font-semibold">{svc.name}</h3>
                          <p className="text-sm text-gray-500">{svc.provider} · {svc.fromEmail || 'No from email'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={svc.isActive ? 'default' : 'secondary'}>{svc.isActive ? 'Active' : 'Inactive'}</Badge>
                        <Button variant="ghost" size="sm" className="text-red-600 h-8 w-8 p-0" onClick={() => handleDelete(svc.id)}><Trash2 className="w-4 h-4" /></Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="redis">
          <Card className="border-0 shadow bg-gradient-to-br from-amber-50 to-yellow-50">
            <CardContent className="p-6">
              <p className="text-sm text-amber-700">Redis configuration is managed in environment variables. Currently using in-memory cache fallback.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Database Dialog */}
      <Dialog open={showDbDialog} onOpenChange={setShowDbDialog}>
        <DialogContent className="bg-white max-w-md">
          <DialogHeader><DialogTitle>Add External Database</DialogTitle></DialogHeader>
          <DialogBody className="space-y-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={dbForm.name} onChange={e => setDbForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Analytics DB" />
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={dbForm.type} onValueChange={v => setDbForm(p => ({ ...p, type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['POSTGRESQL', 'MYSQL', 'MONGODB', 'SQLITE', 'MSSQL'].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2 space-y-2">
                <Label>Host</Label>
                <Input value={dbForm.host} onChange={e => setDbForm(p => ({ ...p, host: e.target.value }))} placeholder="host.example.com" />
              </div>
              <div className="space-y-2">
                <Label>Port</Label>
                <Input value={dbForm.port} onChange={e => setDbForm(p => ({ ...p, port: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Database</Label>
              <Input value={dbForm.database} onChange={e => setDbForm(p => ({ ...p, database: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Username</Label>
                <Input value={dbForm.username} onChange={e => setDbForm(p => ({ ...p, username: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Password</Label>
                <Input type="password" value={dbForm.password} onChange={e => setDbForm(p => ({ ...p, password: e.target.value }))} />
              </div>
            </div>
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDbDialog(false)} className="px-5 py-2.5 text-sm font-medium">Cancel</Button>
            <Button onClick={handleAddDatabase} disabled={saving} className="bg-gradient-to-r from-blue-600 to-purple-600 px-5 py-2.5 text-sm font-medium">
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null} Add Database
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Service Dialog */}
      <Dialog open={showServiceDialog} onOpenChange={setShowServiceDialog}>
        <DialogContent className="bg-white max-w-md">
          <DialogHeader><DialogTitle>Add Communication Service</DialogTitle></DialogHeader>
          <DialogBody className="space-y-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={svcForm.name} onChange={e => setSvcForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. School Email" />
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={svcForm.type} onValueChange={v => setSvcForm(p => ({ ...p, type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['EMAIL', 'SMS', 'CHAT'].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Provider</Label>
              <Select value={svcForm.provider} onValueChange={v => setSvcForm(p => ({ ...p, provider: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['SENDGRID', 'TWILIO', 'MAILGUN', 'SLACK', 'CUSTOM'].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>API Key</Label>
              <Input value={svcForm.apiKey} onChange={e => setSvcForm(p => ({ ...p, apiKey: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>API Secret</Label>
              <Input type="password" value={svcForm.apiSecret} onChange={e => setSvcForm(p => ({ ...p, apiSecret: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>From Email</Label>
              <Input value={svcForm.fromEmail} onChange={e => setSvcForm(p => ({ ...p, fromEmail: e.target.value }))} placeholder="noreply@school.edu" />
            </div>
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowServiceDialog(false)} className="px-5 py-2.5 text-sm font-medium">Cancel</Button>
            <Button onClick={handleAddService} disabled={saving} className="bg-gradient-to-r from-blue-600 to-purple-600 px-5 py-2.5 text-sm font-medium">
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null} Add Service
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
