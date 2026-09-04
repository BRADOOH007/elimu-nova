'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Video, MessageCircle, Mail, Smartphone, Wallet, Loader2,
  CheckCircle2, XCircle, ExternalLink, Plug, Zap,
} from 'lucide-react'

interface ServiceStatus {
  id: string
  name: string
  description: string
  icon: React.ReactNode
  configured: boolean
  statusText: string
  configHref: string
  accent: string
}

export default function IntegrationsPage() {
  const [services, setServices] = useState<ServiceStatus[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const [zoomRes, waRes, commRes, mpesaRes, paypalRes] = await Promise.all([
          fetch('/api/zoom/config'),
          fetch('/api/admin/whatsapp-settings'),
          fetch('/api/system-settings?category=communication'),
          fetch('/api/super-admin/mpesa-config'),
          fetch('/api/super-admin/paypal-config'),
        ])

        const zoom = zoomRes.ok ? await zoomRes.json() : null
        const wa = waRes.ok ? await waRes.json() : null
        const comm = commRes.ok ? await commRes.json() : null
        const mpesa = mpesaRes.ok ? await mpesaRes.json() : null
        const paypal = paypalRes.ok ? await paypalRes.json() : null

        const commServices = Array.isArray(comm) ? comm : (comm?.settings || [])
        const emailConfigured = commServices.some((s: any) => s.type === 'EMAIL' && (s.value?.includes('fromEmail') || s.value?.includes('sendgrid')))
        const smsConfigured = commServices.some((s: any) => s.type === 'SMS' || s.value?.includes('twilio') || s.value?.includes('africastalking'))

        const set: ServiceStatus[] = [
          { id: 'zoom', name: 'Zoom', description: 'Meeting SDK & Server-to-Server OAuth for live classes', icon: <Video className="h-6 w-6" />, configured: !!(zoom?.isConfigured || zoom?.isOAuthConfigured), statusText: (zoom?.isOAuthConfigured ? 'OAuth connected' : zoom?.isConfigured ? 'SDK connected' : 'Not configured'), configHref: '/super-admin/integrations#zoom', accent: 'from-blue-500 to-cyan-500' },
          { id: 'whatsapp', name: 'WhatsApp', description: 'Parent & teacher notifications via Twilio / Africa\'s Talking', icon: <MessageCircle className="h-6 w-6" />, configured: !!(wa?.configured || wa?.settings?.whatsapp_provider), statusText: wa?.settings?.whatsapp_provider ? `${wa.settings.whatsapp_provider} provider` : 'Not configured', configHref: '/super-admin/whatsapp-settings', accent: 'from-emerald-500 to-green-500' },
          { id: 'email', name: 'Email (SMTP)', description: 'Credential & notification emails', icon: <Mail className="h-6 w-6" />, configured: emailConfigured, statusText: emailConfigured ? 'Configured' : 'Not configured', configHref: '/super-admin/communication', accent: 'from-purple-500 to-violet-500' },
          { id: 'sms', name: 'SMS', description: 'Bulk SMS notifications', icon: <Smartphone className="h-6 w-6" />, configured: smsConfigured, statusText: smsConfigured ? 'Configured' : 'Not configured', configHref: '/super-admin/communication', accent: 'from-rose-500 to-pink-500' },
          { id: 'mpesa', name: 'M-Pesa', description: 'Daraja API for mobile money payments', icon: <Smartphone className="h-6 w-6" />, configured: !!mpesa?.isConfigured, statusText: mpesa?.isConfigured ? 'Configured' : 'Not configured', configHref: '/super-admin/billing', accent: 'from-green-600 to-emerald-500' },
          { id: 'paypal', name: 'PayPal', description: 'Card & PayPal international payments', icon: <Wallet className="h-6 w-6" />, configured: !!(paypal?.configured || paypal?.isConfigured), statusText: (paypal?.configured || paypal?.isConfigured) ? 'Configured' : 'Not configured', configHref: '/super-admin/billing', accent: 'from-sky-500 to-blue-500' },
        ]

        setServices(set)
      } catch (e) {
        console.error('[Integrations] load failed:', e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shadow-md">
          <Plug className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Integrations</h1>
          <p className="text-sm text-slate-500">Connect the third-party services that power your platform</p>
        </div>
      </div>

      <Card className="border-0 bg-gradient-to-r from-blue-50 to-purple-50">
        <CardContent className="p-4 flex items-start gap-3">
          <Zap className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
          <p className="text-sm text-slate-600">
            Each integration works independently. Configure only the services you need — unmatched
            or optional services won&apos;t block the rest of the platform.
          </p>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {services.map(s => (
            <Card key={s.id} className="border-0 shadow-sm hover:shadow-lg transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${s.accent} flex items-center justify-center text-white shadow-md`}>
                    {s.icon}
                  </div>
                  {s.configured ? (
                    <Badge className="bg-green-100 text-green-700 border-0">
                      <CheckCircle2 className="h-3 w-3 mr-1" /> Connected
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-slate-400 border-slate-200 bg-slate-50">
                      <XCircle className="h-3 w-3 mr-1" /> Not set up
                    </Badge>
                  )}
                </div>
                <h3 className="mt-4 font-bold text-slate-900 flex items-center gap-2">
                  {s.name}
                </h3>
                <p className="text-sm text-slate-500 mt-1 leading-relaxed">{s.description}</p>
                <p className="text-xs text-slate-400 mt-3">{s.statusText}</p>
                <div className="mt-4 pt-3 border-t border-slate-100">
                  <Button asChild size="sm" variant="outline" className="w-full bg-white">
                    <Link href={s.configHref}>
                      {s.configured ? 'Configure' : 'Set up'} <ExternalLink className="h-3.5 w-3.5 ml-1" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card className="border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Plug className="h-5 w-5 text-amber-500" /> Missing something?
          </CardTitle>
          <CardDescription>
            Other system-wide keys (Stripe, Cloudinary, image providers) are configured in{' '}
            <Link href="/super-admin/system-settings" className="text-blue-600 hover:underline">System Settings</Link>.
          </CardDescription>
        </CardHeader>
      </Card>

      {/* ── Zoom quick-configure ── */}
      <div id="zoom" className="scroll-mt-24">
        <ZoomQuickConfig />
      </div>
    </div>
  )
}

/* Inline Zoom config — SDK key/secret + Server-to-Server OAuth, fetched from /api/zoom/config */
function ZoomQuickConfig() {
  const [config, setConfig] = useState({ zoom_sdk_key: '', zoom_sdk_secret: '', zoom_account_id: '', zoom_client_id: '', zoom_client_secret: '' })
  const [isConfigured, setIsConfigured] = useState(false)
  const [isOAuthConfigured, setIsOAuthConfigured] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showSecrets, setShowSecrets] = useState(false)

  useEffect(() => {
    fetch('/api/zoom/config')
      .then(r => r.json())
      .then(d => {
        if (d.config) setConfig(prev => ({ ...prev, ...d.config }))
        setIsConfigured(d.isConfigured)
        setIsOAuthConfigured(d.isOAuthConfigured)
      }).catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const save = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/zoom/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      })
      const data = await res.json()
      if (res.ok) {
        setIsConfigured(!!(config.zoom_sdk_key && config.zoom_sdk_secret))
        setIsOAuthConfigured(!!(config.zoom_account_id && config.zoom_client_id && config.zoom_client_secret))
      }
    } catch { /* ignore */ }
    finally { setSaving(false) }
  }

  if (loading) return <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-gray-400" /></div>

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Video className="h-5 w-5 text-blue-600" /> Zoom Credentials
        </CardTitle>
        <CardDescription>
          {isConfigured ? 'Meeting SDK configured' : 'Meeting SDK not configured'} · {isOAuthConfigured ? 'Server-to-Server OAuth configured' : 'Server-to-Server OAuth not configured'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-600">SDK Key (Client ID)</label>
            <input value={config.zoom_sdk_key} onChange={e => setConfig(p => ({ ...p, zoom_sdk_key: e.target.value }))} placeholder="Enter SDK Key" className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm font-mono" />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-600">SDK Secret</label>
            <input type={showSecrets ? 'text' : 'password'} value={config.zoom_sdk_secret} onChange={e => setConfig(p => ({ ...p, zoom_sdk_secret: e.target.value }))} placeholder="Enter SDK Secret" className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm font-mono" />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-600">OAuth Account ID</label>
            <input value={config.zoom_account_id} onChange={e => setConfig(p => ({ ...p, zoom_account_id: e.target.value }))} placeholder="Account ID" className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm font-mono" />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-600">OAuth Client ID</label>
            <input value={config.zoom_client_id} onChange={e => setConfig(p => ({ ...p, zoom_client_id: e.target.value }))} placeholder="Client ID" className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm font-mono" />
          </div>
          <div className="space-y-2 md:col-span-2">
            <label className="text-xs font-medium text-slate-600">OAuth Client Secret</label>
            <input type={showSecrets ? 'text' : 'password'} value={config.zoom_client_secret} onChange={e => setConfig(p => ({ ...p, zoom_client_secret: e.target.value }))} placeholder="Client Secret" className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm font-mono" />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={save} disabled={saving} className="bg-gradient-to-r from-blue-600 to-purple-600">
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Save Zoom Config
          </Button>
          <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
            <input type="checkbox" checked={showSecrets} onChange={e => setShowSecrets(e.target.checked)} className="rounded" /> Show secret
          </label>
        </div>
      </CardContent>
    </Card>
  )
}
