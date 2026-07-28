"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Loader2, Mail, MessageSquare, Plus, Edit, Trash2, CheckCircle, XCircle, Globe } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { confirmToast } from '@/lib/confirm-toast'

export default function CommunicationServicesPage() {
  const [services, setServices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showDialog, setShowDialog] = useState(false)
  const { toast } = useToast()

  const [name, setName] = useState(""); const [type, setType] = useState("EMAIL"); const [provider, setProvider] = useState("SENDGRID")
  const [fromEmail, setFromEmail] = useState(""); const [apiKey, setApiKey] = useState(""); const [apiSecret, setApiSecret] = useState("")
  const [saving, setSaving] = useState(false)

  useEffect(() => { fetchServices() }, [])

  const fetchServices = async () => {
    try {
      const res = await fetch('/api/system-settings?category=communication')
      if (res.ok) setServices((await res.json()).settings || [])
    } catch (e) { console.warn('[SuperAdminComms] fetchServices error:', e) } finally { setLoading(false) }
  }

  const handleCreate = async () => {
    if (!name || !provider) return
    setSaving(true)
    try {
      const res = await fetch('/api/system-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: `communication_${name.toLowerCase().replace(/\s+/g, '_')}`,
          value: JSON.stringify({ name, type, provider, fromEmail, apiKey, apiSecret }),
          category: 'communication',
          type: 'json'
        })
      })
      if (res.ok) { toast({ title: 'Service added' }); setShowDialog(false); fetchServices() }
      else toast({ title: 'Error' })
    } catch (e) { console.warn('[SuperAdminComms] handleCreate error:', e) } finally { setSaving(false) }
  }

  const handleDelete = async (key: string) => {
    if (!(await confirmToast({ title: 'Remove this service?' }))) return
    try {
      await fetch(`/api/system-settings?key=${key}`, { method: 'DELETE' })
      toast({ title: 'Removed' }); fetchServices()
    } catch (e) { console.warn('[SuperAdminComms] handleDelete error:', e) }
  }

  const providers = type === 'EMAIL'
    ? ['SENDGRID', 'MAILGUN', 'POSTMARK']
    : ['TWILIO', 'AFRICASTALKING', 'NEXMO']

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Globe className="w-6 h-6 text-blue-600" /> Communication Services</h1>
          <p className="text-sm text-gray-600">Configure email and SMS providers</p>
        </div>
        <Button onClick={() => setShowDialog(true)} className="bg-gradient-to-r from-blue-600 to-purple-600"><Plus className="w-4 h-4 mr-2" /> Add Service</Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin" /></div>
      ) : services.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-gray-500">No communication services configured. Add an email or SMS provider.</CardContent></Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {services.map((s: any) => {
            const config = typeof s.value === 'string' ? JSON.parse(s.value) : s.value
            return (
              <Card key={s.id || s.key} className="border-0 shadow">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {config.type === 'EMAIL' ? <Mail className="w-8 h-8 text-purple-500" /> : <MessageSquare className="w-8 h-8 text-green-500" />}
                      <div>
                        <h3 className="font-semibold">{config.name}</h3>
                        <p className="text-sm text-gray-500">{config.provider} · {config.fromEmail || 'No from address'}</p>
                      </div>
                    </div>
                    <Button size="sm" variant="ghost" className="text-red-600" onClick={() => handleDelete(s.key)}><Trash2 className="w-4 h-4" /></Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="bg-white max-w-md">
          <DialogHeader><DialogTitle>Add Communication Service</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><label className="text-sm text-gray-600">Service Name</label><Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Primary Email" /></div>
            <div><label className="text-sm text-gray-600">Type</label><Select value={type} onValueChange={setType}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="EMAIL">Email</SelectItem><SelectItem value="SMS">SMS</SelectItem></SelectContent></Select></div>
            <div><label className="text-sm text-gray-600">Provider</label><Select value={provider} onValueChange={setProvider}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{providers.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent></Select></div>
            {type === 'EMAIL' && <div><label className="text-sm text-gray-600">From Email</label><Input type="email" value={fromEmail} onChange={e => setFromEmail(e.target.value)} placeholder="noreply@school.com" /></div>}
            <div><label className="text-sm text-gray-600">API Key</label><Input type="password" value={apiKey} onChange={e => setApiKey(e.target.value)} /></div>
            <div><label className="text-sm text-gray-600">API Secret</label><Input type="password" value={apiSecret} onChange={e => setApiSecret(e.target.value)} /></div>
            <Button onClick={handleCreate} disabled={saving} className="w-full bg-gradient-to-r from-blue-600 to-purple-600">Add Service</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
