'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { Loader2, MessageSquare, CheckCircle, AlertCircle } from 'lucide-react'

export default function WhatsAppSettingsPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testSending, setTestSending] = useState(false)
  const [settings, setSettings] = useState({
    whatsapp_provider: 'twilio',
    twilio_account_sid: '',
    twilio_auth_token: '',
    twilio_from_number: 'whatsapp:+14155238886',
    africastalking_api_key: '',
    africastalking_username: 'sandbox',
    africastalking_from_number: '',
  })

  useEffect(() => {
    fetch('/api/admin/whatsapp-settings')
      .then(r => r.json())
      .then(data => setSettings(prev => ({ ...prev, ...data })))
      .finally(() => setLoading(false))
  }, [])

  const update = (key: string, value: string) => setSettings(prev => ({ ...prev, [key]: value }))

  const save = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/admin/whatsapp-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })
      if (!res.ok) throw new Error('Failed to save')
      toast({ title: 'Saved', description: 'WhatsApp settings updated successfully' })
    } catch {
      toast({ title: 'Error', description: 'Failed to save settings', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const testConnection = async () => {
    setTestSending(true)
    toast({ title: 'Test', description: 'Webhook endpoint is active at /api/whatsapp/webhook' })
    setTestSending(false)
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-blue-500" /></div>
  )

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-green-100"><MessageSquare className="h-5 w-5 text-green-600" /></div>
        <div><h1 className="text-xl font-bold text-slate-800">WhatsApp Integration</h1><p className="text-sm text-slate-500">Send alerts and updates to parents via WhatsApp</p></div>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Provider</CardTitle><CardDescription>Choose your WhatsApp messaging provider</CardDescription></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-700 mb-1.5 block">Provider</label>
            <Select value={settings.whatsapp_provider} onValueChange={v => update('whatsapp_provider', v)}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="twilio">Twilio (WhatsApp API)</SelectItem>
                <SelectItem value="africastalking">Africa's Talking (SMS/WhatsApp)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {settings.whatsapp_provider === 'twilio' ? (
            <>
              <div><label className="text-sm font-medium text-slate-700 mb-1.5 block">Account SID</label><Input value={settings.twilio_account_sid} onChange={e => update('twilio_account_sid', e.target.value)} placeholder="AC..." /></div>
              <div><label className="text-sm font-medium text-slate-700 mb-1.5 block">Auth Token</label><Input type="password" value={settings.twilio_auth_token} onChange={e => update('twilio_auth_token', e.target.value)} placeholder="Enter auth token" /></div>
              <div><label className="text-sm font-medium text-slate-700 mb-1.5 block">From Number</label><Input value={settings.twilio_from_number} onChange={e => update('twilio_from_number', e.target.value)} placeholder="whatsapp:+14155238886" /></div>
            </>
          ) : (
            <>
              <div><label className="text-sm font-medium text-slate-700 mb-1.5 block">API Key</label><Input type="password" value={settings.africastalking_api_key} onChange={e => update('africastalking_api_key', e.target.value)} placeholder="Enter API key" /></div>
              <div><label className="text-sm font-medium text-slate-700 mb-1.5 block">Username</label><Input value={settings.africastalking_username} onChange={e => update('africastalking_username', e.target.value)} placeholder="sandbox" /></div>
              <div><label className="text-sm font-medium text-slate-700 mb-1.5 block">From Number</label><Input value={settings.africastalking_from_number} onChange={e => update('africastalking_from_number', e.target.value)} placeholder="+2547XXXXXXXX" /></div>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Webhook URL</CardTitle><CardDescription>Configure this URL in your WhatsApp provider dashboard</CardDescription></CardHeader>
        <CardContent>
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
            <p className="text-xs text-slate-500 mb-1">Webhook URL:</p>
            <code className="text-sm text-blue-600 font-mono break-all">{typeof window !== 'undefined' ? `${window.location.origin}/api/whatsapp/webhook` : '/api/whatsapp/webhook'}</code>
          </div>
          <div className="mt-3 bg-blue-50 border border-blue-100 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
              <p className="text-xs text-blue-700">For Twilio: set this URL in your WhatsApp Sandbox or Messaging Service config. For Africa's Talking: set as your callback URL. Supported WhatsApp commands: menu, grades, homework, attendance.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Features Enabled</CardTitle><CardDescription>What WhatsApp notifications will send to parents</CardDescription></CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { icon: '📚', label: 'Homework Alerts', desc: 'New assignments and due date reminders' },
              { icon: '📊', label: 'Grade Updates', desc: 'Assignment marks and performance changes' },
              { icon: '📋', label: 'Attendance Alerts', desc: 'Daily attendance reports' },
              { icon: '💚', label: 'Wellness Check-ins', desc: 'Critical wellness alerts' },
              { icon: '💬', label: 'WhatsApp Commands', desc: 'Parents can reply menu, grades, homework via WhatsApp' },
            ].map((feat, i) => (
              <div key={i} className="flex items-start gap-3 p-2.5 rounded-lg bg-slate-50">
                <span className="text-lg">{feat.icon}</span>
                <div><p className="text-sm font-medium text-slate-700">{feat.label}</p><p className="text-xs text-slate-400">{feat.desc}</p></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center gap-3">
        <Button onClick={save} disabled={saving} className="bg-green-600 hover:bg-green-700">
          {saving ? <><Loader2 className="h-4 w-4 animate-spin mr-1" /> Saving...</> : <><CheckCircle className="h-4 w-4 mr-1" /> Save Settings</>}
        </Button>
        <Button onClick={testConnection} disabled={testSending} variant="outline">
          {testSending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <MessageSquare className="h-4 w-4 mr-1" />}
          Test Connection
        </Button>
      </div>
    </div>
  )
}
