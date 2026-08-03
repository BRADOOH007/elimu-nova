"use client"

import { useState, useEffect } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CreateBillingModal } from "@/components/modals/create-billing-modal"
import { BillingDetailsModal } from "@/components/modals/billing-details-modal"
import { CreatePaymentMethodModal } from "@/components/modals/create-payment-method-modal"
import { CreateInvoiceModal } from "@/components/modals/create-invoice-modal"
import { useToast } from "@/hooks/use-toast"
import { confirmToast } from '@/lib/confirm-toast'
import {
  Search, Plus, CreditCard, School, Package, DollarSign, Calendar,
  MoreHorizontal, Eye, Edit, Trash2, Loader2, ChevronLeft, ChevronRight,
  RefreshCw, TrendingUp, TrendingDown, Clock, CheckCircle, XCircle,
  AlertCircle, Receipt, FileText, Settings, Key, ShieldCheck, Zap,
  ExternalLink, Building2, Users, Activity, Ban, Wallet, ArrowUpRight,
  Globe, Smartphone, Check, Copy
} from "lucide-react"

interface Billing {
  id: string
  startDate: string
  endDate: string
  amount: number
  status: string
  type: string
  paymentMethod: string
  transactionId?: string
  isFreemium?: boolean
  notes?: string
  createdAt: string
  updatedAt: string
  user?: { firstName: string; lastName: string; email: string }
  school: { id: string; name: string; address: string; phone?: string; email?: string; schoolAdmin?: { user: { firstName: string; lastName: string; email: string } } }
  package: { id: string; name: string; description?: string; price: number; duration: number; features?: string[] }
}

interface PaymentMethod {
  id: string; name: string; type: string; isActive: boolean
  description?: string; createdAt: string; updatedAt: string
  _count: { subscriptions: number; invoices: number }
}

interface Invoice {
  id: string; invoiceNumber: string; subscriptionId: string
  amount: number; taxAmount: number; totalAmount: number
  status: string; dueDate: string; paidDate?: string; notes?: string
  createdAt: string; updatedAt: string
  subscription: { school: { id: string; name: string; email: string }; package: { id: string; name: string; price: number } }
  paymentMethod?: { id: string; name: string; type: string }
}

interface BillingResponse { subscriptions: Billing[]; pagination: { page: number; limit: number; total: number; pages: number } }
interface PaymentMethodResponse { paymentMethods: PaymentMethod[]; pagination: { page: number; limit: number; total: number; totalPages: number; hasNext: boolean; hasPrev: boolean } }
interface InvoiceResponse { invoices: Invoice[]; pagination: { page: number; limit: number; total: number; totalPages: number; hasNext: boolean; hasPrev: boolean } }

/* ── Stripe Configuration Panel ── */
function StripeConfigPanel() {
  const { toast } = useToast()
  const [config, setConfig]       = useState({ stripe_secret_key: '', stripe_publishable_key: '', stripe_webhook_secret: '', stripe_mode: 'test' })
  const [isConfigured, setIsConfigured] = useState(false)
  const [mode, setMode]           = useState('test')
  const [loading, setLoading]     = useState(true)
  const [saving, setSaving]       = useState(false)
  const [testing, setTesting]     = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; message?: string; error?: string } | null>(null)
  const [showSecrets, setShowSecrets] = useState(false)

  useEffect(() => {
    fetch('/api/super-admin/stripe-config')
      .then(r => r.json())
      .then(d => {
        if (d.config) setConfig(prev => ({ ...prev, ...d.config }))
        setIsConfigured(d.isConfigured)
        setMode(d.mode || 'test')
      }).catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const save = async () => {
    setSaving(true)
    try {
      const res  = await fetch('/api/super-admin/stripe-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(config),
      })
      const data = await res.json()
      if (data.success) {
        toast({ title: 'Stripe configuration saved!', description: `Updated: ${data.updated?.join(', ')}` })
        setIsConfigured(true)
      } else {
        toast({ variant: 'destructive', title: 'Save failed', description: data.error })
      }
    } finally { setSaving(false) }
  }

  const testConnection = async () => {
    setTesting(true)
    setTestResult(null)
    try {
      const res  = await fetch('/api/super-admin/stripe-config', { method: 'PUT' })
      const data = await res.json()
      setTestResult(data)
      toast({
        title:       data.success ? 'Stripe Connected!' : 'Connection Failed',
        description: data.message || data.error,
        variant:     data.success ? 'default' : 'destructive',
      })
    } finally { setTesting(false) }
  }

  if (loading) return <div className="flex items-center justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-indigo-500" /></div>

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Status banner */}
      <div className={`flex items-center gap-4 p-5 rounded-2xl border shadow-sm ${isConfigured ? 'bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200' : 'bg-gradient-to-r from-amber-50 to-yellow-50 border-amber-200'}`}>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isConfigured ? 'bg-emerald-100' : 'bg-amber-100'}`}>
          {isConfigured ? <ShieldCheck className="h-5 w-5 text-emerald-600" /> : <AlertCircle className="h-5 w-5 text-amber-600" />}
        </div>
        <div className="flex-1">
          <p className={`font-semibold text-sm ${isConfigured ? 'text-emerald-800' : 'text-amber-800'}`}>
            {isConfigured ? `Stripe Configured — ${mode.toUpperCase()} Mode` : 'Stripe Not Configured'}
          </p>
          <p className={`text-xs mt-0.5 ${isConfigured ? 'text-emerald-600' : 'text-amber-600'}`}>
            {isConfigured ? 'Payments, subscriptions and webhooks are active.' : 'Add your Stripe keys below to enable payments.'}
          </p>
        </div>
        {isConfigured && (
          <button onClick={testConnection} disabled={testing}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl transition-all disabled:opacity-60 shadow-sm">
            {testing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Zap className="h-3.5 w-3.5" />}
            {testing ? 'Testing...' : 'Test'}
          </button>
        )}
      </div>

      {testResult && (
        <div className={`flex items-center gap-3 p-4 rounded-xl border text-sm ${testResult.success ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
          {testResult.success ? <CheckCircle className="h-4 w-4 shrink-0" /> : <XCircle className="h-4 w-4 shrink-0" />}
          {testResult.message || testResult.error}
        </div>
      )}

      {/* API Keys Card */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Key className="h-4 w-4 text-indigo-600" />
            <h3 className="font-semibold text-slate-800 text-sm">Stripe API Keys</h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Get your keys from{' '}
            <a href="https://dashboard.stripe.com/apikeys" target="_blank" rel="noopener noreferrer"
              className="text-indigo-600 hover:underline inline-flex items-center gap-1">
              dashboard.stripe.com <ExternalLink className="h-3 w-3" />
            </a>
          </p>
        </div>
        <div className="px-6 py-5 space-y-5">
          {/* Mode */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2 uppercase tracking-wider">Mode</label>
            <div className="flex gap-3">
              {(['test', 'live'] as const).map(m => (
                <button key={m} type="button"
                  onClick={() => setConfig(p => ({ ...p, stripe_mode: m }))}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-all ${
                    config.stripe_mode === m
                      ? m === 'live'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                        : 'bg-slate-800 text-white border-slate-800 shadow-sm'
                      : 'border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}>
                  {m === 'live' ? 'Live (Production)' : 'Test (Development)'}
                </button>
              ))}
            </div>
            {config.stripe_mode === 'live' && (
              <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mt-2 flex items-center gap-1.5">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" /> Live mode charges real cards. Test thoroughly first.
              </p>
            )}
          </div>

          {([
            { key: 'stripe_secret_key', label: 'Secret Key', placeholder: 'sk_test_...', hint: 'sk_test_... or sk_live_...', secret: true },
            { key: 'stripe_publishable_key', label: 'Publishable Key', placeholder: 'pk_test_...', hint: 'pk_test_... or pk_live_...', secret: false },
            { key: 'stripe_webhook_secret', label: 'Webhook Secret', placeholder: 'whsec_...', hint: 'whsec_...', secret: true },
          ] as const).map(field => (
            <div key={field.key}>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
                {field.label} <span className="text-slate-400 font-normal normal-case">{field.hint}</span>
              </label>
              <input
                type={field.secret && !showSecrets ? 'password' : 'text'}
                value={(config as any)[field.key]}
                onChange={e => setConfig(p => ({ ...p, [field.key]: e.target.value }))}
                placeholder={field.placeholder}
                className="w-full h-10 px-4 border border-slate-200 rounded-xl text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono placeholder:text-slate-300"
              />
              {field.key === 'stripe_webhook_secret' && (
                <p className="text-xs text-slate-400 mt-1.5">
                  Stripe Dashboard → Developers → Webhooks. Endpoint:{' '}
                  <code className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 font-mono text-[11px]">
                    {typeof window !== 'undefined' ? window.location.origin : 'https://your-domain.vercel.app'}/api/webhooks/stripe
                  </code>
                </p>
              )}
            </div>
          ))}

          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
            <label className="flex items-center gap-2 text-sm text-slate-500 cursor-pointer hover:text-slate-700">
              <input type="checkbox" checked={showSecrets} onChange={e => setShowSecrets(e.target.checked)} className="rounded border-slate-300" />
              Show secret keys
            </label>
            <button onClick={save} disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-sm font-semibold rounded-xl disabled:opacity-60 transition-all shadow-sm">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
              {saving ? 'Saving...' : 'Save Configuration'}
            </button>
          </div>
        </div>
      </div>

      {/* Webhook events */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h3 className="font-semibold text-slate-800 text-sm">Webhook Events</h3>
          <p className="text-xs text-slate-400 mt-0.5">ElimuNova listens for these Stripe events automatically</p>
        </div>
        <div className="px-6 py-4 grid sm:grid-cols-2 gap-3">
          {[
            { event: 'invoice.payment_succeeded',    desc: 'Activates subscription after payment' },
            { event: 'invoice.payment_failed',       desc: 'Marks subscription as inactive'       },
            { event: 'customer.subscription.deleted',desc: 'Cancels school subscription'          },
            { event: 'customer.subscription.updated',desc: 'Syncs subscription status changes'   },
          ].map(w => (
            <div key={w.event} className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl">
              <div className="w-6 h-6 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0 mt-0.5">
                <CheckCircle className="h-3.5 w-3.5 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs font-mono text-slate-700 font-medium">{w.event}</p>
                <p className="text-xs text-slate-400 mt-0.5">{w.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ── M-Pesa Configuration Panel ── */
function MpesaConfigPanel() {
  const { toast } = useToast()
  const [config, setConfig] = useState({
    mpesa_consumer_key: '', mpesa_consumer_secret: '', mpesa_passkey: '',
    mpesa_shortcode: '', mpesa_environment: 'sandbox',
  })
  const [isConfigured, setIsConfigured] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; message?: string; error?: string } | null>(null)
  const [showSecrets, setShowSecrets] = useState(false)
  const [stkForm, setStkForm] = useState({ phone: '', amount: '', schoolId: '', accountRef: '' })
  const [stkResult, setStkResult] = useState<{ success: boolean; message: string; checkoutRequestId?: string } | null>(null)
  const [stkLoading, setStkLoading] = useState(false)

  useEffect(() => {
    fetch('/api/super-admin/mpesa-config')
      .then(r => r.json())
      .then(d => {
        if (d.config) setConfig(prev => ({ ...prev, ...d.config }))
        setIsConfigured(d.isConfigured)
      }).catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const save = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/super-admin/mpesa-config', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      })
      const data = await res.json()
      if (res.ok) {
        toast({ title: 'M-Pesa config saved', description: `Updated: ${data.updated?.join(', ') || 'all'}` })
      } else {
        toast({ variant: 'destructive', title: 'Error', description: data.error || 'Failed to save' })
      }
    } catch { toast({ variant: 'destructive', title: 'Error', description: 'Failed to save config' }) }
    finally { setSaving(false) }
  }

  const test = async () => {
    setTesting(true); setTestResult(null)
    try {
      const res = await fetch('/api/super-admin/mpesa-config', { method: 'PUT' })
      const data = await res.json()
      setTestResult(data)
    } catch { setTestResult({ success: false, error: 'Connection failed' }) }
    finally { setTesting(false) }
  }

  const sendStk = async () => {
    setStkResult(null); setStkLoading(true)
    try {
      const res = await fetch('/api/billing/mpesa/stkpush', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: stkForm.phone, amount: parseFloat(stkForm.amount),
          schoolId: stkForm.schoolId || undefined, accountRef: stkForm.accountRef || undefined,
        }),
      })
      const data = await res.json()
      setStkResult(data)
      if (data.success) toast({ title: 'STK Push Sent', description: data.message })
      else toast({ variant: 'destructive', title: 'STK Push Failed', description: data.error })
    } catch {
      setStkResult({ success: false, message: 'Failed to send STK push' })
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to send STK push' })
    } finally { setStkLoading(false) }
  }

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-indigo-400" /></div>

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Status banner */}
      <div className={`flex items-center gap-4 p-5 rounded-2xl border shadow-sm ${isConfigured ? 'bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200' : 'bg-gradient-to-r from-amber-50 to-yellow-50 border-amber-200'}`}>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isConfigured ? 'bg-emerald-100' : 'bg-amber-100'}`}>
          {isConfigured ? <Smartphone className="h-5 w-5 text-emerald-600" /> : <AlertCircle className="h-5 w-5 text-amber-600" />}
        </div>
        <div className="flex-1">
          <p className={`font-semibold text-sm ${isConfigured ? 'text-emerald-800' : 'text-amber-800'}`}>
            {isConfigured ? 'M-Pesa Configured' : 'M-Pesa Not Configured'}
          </p>
          <p className={`text-xs mt-0.5 ${isConfigured ? 'text-emerald-600' : 'text-amber-600'}`}>
            {isConfigured ? `Environment: ${config.mpesa_environment}` : 'Add your Daraja API credentials below'}
          </p>
        </div>
        <button onClick={test} disabled={testing}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl transition-all disabled:opacity-60 shadow-sm">
          {testing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Zap className="h-3.5 w-3.5" />}
          {testing ? 'Testing...' : 'Test'}
        </button>
      </div>

      {testResult && (
        <div className={`flex items-center gap-3 p-4 rounded-xl border text-sm ${testResult.success ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
          {testResult.success ? <CheckCircle className="h-4 w-4 shrink-0" /> : <XCircle className="h-4 w-4 shrink-0" />}
          {testResult.message || testResult.error}
        </div>
      )}

      {/* Credentials */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Smartphone className="h-4 w-4 text-emerald-600" />
            <h3 className="font-semibold text-slate-800 text-sm">Daraja API Credentials</h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">Enter your Safaricom Daraja API credentials from the developer portal</p>
        </div>
        <div className="px-6 py-5 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { key: 'mpesa_consumer_key', label: 'Consumer Key', placeholder: 'Enter consumer key', secret: false },
              { key: 'mpesa_consumer_secret', label: 'Consumer Secret', placeholder: 'Enter consumer secret', secret: true },
              { key: 'mpesa_passkey', label: 'Passkey', placeholder: 'Enter passkey', secret: true },
              { key: 'mpesa_shortcode', label: 'Shortcode (Paybill/Till)', placeholder: 'e.g. 174379', secret: false },
            ].map(f => (
              <div key={f.key} className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">{f.label}</label>
                <input
                  type={f.secret && !showSecrets ? 'password' : 'text'}
                  value={(config as any)[f.key]}
                  onChange={e => setConfig(p => ({ ...p, [f.key]: e.target.value }))}
                  placeholder={f.placeholder}
                  className="w-full h-10 px-4 border border-slate-200 rounded-xl text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono placeholder:text-slate-300"
                />
              </div>
            ))}
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2 block">Environment</label>
            <div className="flex gap-3">
              {(['sandbox', 'production'] as const).map(env => (
                <button key={env} type="button"
                  onClick={() => setConfig(p => ({ ...p, mpesa_environment: env }))}
                  className={`px-5 py-2 rounded-xl text-sm font-semibold border transition-all ${
                    config.mpesa_environment === env
                      ? env === 'production'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                        : 'bg-slate-800 text-white border-slate-800 shadow-sm'
                      : 'border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}>
                  {env === 'production' ? 'Production' : 'Sandbox'}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
            <label className="flex items-center gap-2 text-sm text-slate-500 cursor-pointer hover:text-slate-700">
              <input type="checkbox" checked={showSecrets} onChange={e => setShowSecrets(e.target.checked)} className="rounded border-slate-300" />
              Show secrets
            </label>
            <button onClick={save} disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-sm font-semibold rounded-xl disabled:opacity-60 transition-all shadow-sm">
              {saving && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
              {saving ? 'Saving...' : 'Save Configuration'}
            </button>
          </div>
        </div>
      </div>

      {/* Callback URL */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-5">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
            <ExternalLink className="h-4 w-4 text-blue-600" />
          </div>
          <div>
            <p className="font-medium text-sm text-blue-900">Callback URL for Daraja API</p>
            <p className="text-xs text-blue-700 mt-0.5">Set this as your STK Push CallBackURL in the Safaricom API</p>
            <div className="mt-2 flex items-center gap-2">
              <code className="text-xs bg-white/80 px-3 py-2 rounded-lg border border-blue-200 font-mono text-blue-800 flex-1">
                {typeof window !== 'undefined' ? `${window.location.origin}/api/billing/mpesa/callback` : 'https://yourdomain.com/api/billing/mpesa/callback'}
              </code>
              <button onClick={() => { navigator.clipboard.writeText(typeof window !== 'undefined' ? `${window.location.origin}/api/billing/mpesa/callback` : 'https://yourdomain.com/api/billing/mpesa/callback'); toast({ title: 'Copied!' }) }}
                className="p-2 rounded-lg bg-white border border-blue-200 hover:bg-blue-50 transition-colors">
                <Copy className="h-4 w-4 text-blue-600" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* STK Push */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-emerald-600" />
            <h3 className="font-semibold text-slate-800 text-sm">Send M-Pesa STK Push</h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">Initiate a Lipia Na M-Pesa payment to a customer's phone</p>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Phone Number</label>
              <input value={stkForm.phone} onChange={e => setStkForm(p => ({ ...p, phone: e.target.value }))}
                placeholder="e.g. 0712345678 or 254712345678"
                className="w-full h-10 px-4 border border-slate-200 rounded-xl text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder:text-slate-300" />
              <p className="text-xs text-slate-400">Customer's M-Pesa registered phone number</p>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Amount (KES)</label>
              <input type="number" value={stkForm.amount} onChange={e => setStkForm(p => ({ ...p, amount: e.target.value }))}
                placeholder="e.g. 1000" min="1"
                className="w-full h-10 px-4 border border-slate-200 rounded-xl text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder:text-slate-300" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Account Reference</label>
              <input value={stkForm.accountRef} onChange={e => setStkForm(p => ({ ...p, accountRef: e.target.value }))}
                placeholder="e.g. School Name (max 12 chars)" maxLength={12}
                className="w-full h-10 px-4 border border-slate-200 rounded-xl text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder:text-slate-300" />
              <p className="text-xs text-slate-400">Shown on customer's M-Pesa screen — max 12 chars</p>
            </div>
          </div>

          <button onClick={sendStk} disabled={stkLoading || !stkForm.phone || !stkForm.amount}
            className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-sm font-semibold rounded-xl disabled:opacity-60 transition-all shadow-sm">
            {stkLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Smartphone className="w-4 h-4" />}
            {stkLoading ? 'Sending...' : 'Send STK Push to Phone'}
          </button>

          {stkResult && (
            <div className={`flex items-start gap-3 p-4 rounded-xl border ${stkResult.success ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${stkResult.success ? 'bg-emerald-100' : 'bg-red-100'}`}>
                {stkResult.success ? <CheckCircle className="w-4 h-4 text-emerald-600" /> : <XCircle className="w-4 h-4 text-red-600" />}
              </div>
              <div>
                <p className={`font-medium text-sm ${stkResult.success ? 'text-emerald-800' : 'text-red-800'}`}>
                  {stkResult.success ? 'Payment request sent' : 'Payment request failed'}
                </p>
                <p className="text-xs text-slate-600 mt-0.5">{stkResult.message}</p>
                {stkResult.checkoutRequestId && (
                  <p className="text-xs text-slate-400 mt-0.5 font-mono">ID: {stkResult.checkoutRequestId}</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/* ── Utility ── */
function getStatusColor(status: string) {
  switch (status) {
    case 'ACTIVE': case 'PAID': return 'bg-emerald-100 text-emerald-700 border-emerald-200'
    case 'PENDING': return 'bg-amber-100 text-amber-700 border-amber-200'
    case 'CANCELLED': case 'OVERDUE': return 'bg-red-100 text-red-700 border-red-200'
    case 'INACTIVE': case 'EXPIRED': return 'bg-slate-100 text-slate-600 border-slate-200'
    default: return 'bg-slate-100 text-slate-600 border-slate-200'
  }
}

function getStatusDot(status: string) {
  switch (status) {
    case 'ACTIVE': case 'PAID': return 'bg-emerald-500'
    case 'PENDING': return 'bg-amber-500'
    case 'CANCELLED': case 'OVERDUE': return 'bg-red-500'
    case 'INACTIVE': case 'EXPIRED': return 'bg-slate-400'
    default: return 'bg-slate-400'
  }
}

function getStatusIcon(status: string) {
  switch (status) {
    case 'ACTIVE': case 'PAID': return <CheckCircle className="w-4 h-4" />
    case 'PENDING': return <Clock className="w-4 h-4" />
    case 'CANCELLED': case 'OVERDUE': return <XCircle className="w-4 h-4" />
    case 'INACTIVE': return <AlertCircle className="w-4 h-4" />
    default: return <AlertCircle className="w-4 h-4" />
  }
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

/* ── Main Page ── */
export default function BillingPage() {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState('subscriptions')

  // Subscriptions state
  const [billing, setBilling] = useState<Billing[]>([])
  const [billingLoading, setBillingLoading] = useState(true)
  const [billingPagination, setBillingPagination] = useState({ page: 1, limit: 10, total: 0, pages: 0 })

  // Payment Methods state
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [paymentMethodsLoading, setPaymentMethodsLoading] = useState(true)
  const [paymentMethodsPagination, setPaymentMethodsPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0, hasNext: false, hasPrev: false })

  // Invoices state
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [invoicesLoading, setInvoicesLoading] = useState(true)
  const [invoicesPagination, setInvoicesPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0, hasNext: false, hasPrev: false })

  // Common filters
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortBy, setSortBy] = useState('createdAt')
  const [sortOrder, setSortOrder] = useState('desc')

  // Modals
  const [createBillingOpen, setCreateBillingOpen] = useState(false)
  const [billingDetailsOpen, setBillingDetailsOpen] = useState(false)
  const [selectedBillingId, setSelectedBillingId] = useState<string | null>(null)
  const [createPaymentMethodOpen, setCreatePaymentMethodOpen] = useState(false)
  const [editingPaymentMethod, setEditingPaymentMethod] = useState<any | null>(null)
  const [createInvoiceOpen, setCreateInvoiceOpen] = useState(false)

  // Fetch billing data
  const fetchBilling = async (page = 1) => {
    try {
      setBillingLoading(true)
      const params = new URLSearchParams({
        page: page.toString(), limit: billingPagination.limit.toString(),
        ...(searchQuery && { search: searchQuery }),
        ...(statusFilter !== 'all' && { status: statusFilter }),
        sortBy, sortOrder
      })
      const response = await fetch(`/api/billing?${params}`)
      if (response.ok) {
        const data: BillingResponse = await response.json()
        setBilling(data.subscriptions)
        setBillingPagination(data.pagination)
      } else {
        toast({ variant: "destructive", title: "Error", description: "Failed to fetch billing data" })
      }
    } catch (error) {
      console.error('Error fetching billing:', error)
      toast({ variant: "destructive", title: "Error", description: "Failed to fetch billing data" })
    } finally { setBillingLoading(false) }
  }

  // Fetch payment methods
  const fetchPaymentMethods = async (page = 1) => {
    try {
      setPaymentMethodsLoading(true)
      const params = new URLSearchParams({
        page: page.toString(), limit: paymentMethodsPagination.limit.toString(),
        ...(searchQuery && { search: searchQuery }),
        ...(statusFilter !== 'all' && { type: statusFilter }),
        sortBy, sortOrder
      })
      const response = await fetch(`/api/payment-methods?${params}`)
      if (response.ok) {
        const data: PaymentMethodResponse = await response.json()
        setPaymentMethods(data.paymentMethods)
        setPaymentMethodsPagination(data.pagination)
      } else {
        toast({ variant: "destructive", title: "Error", description: "Failed to fetch payment methods" })
      }
    } catch (error) {
      console.error('Error fetching payment methods:', error)
      toast({ variant: "destructive", title: "Error", description: "Failed to fetch payment methods" })
    } finally { setPaymentMethodsLoading(false) }
  }

  // Fetch invoices
  const fetchInvoices = async (page = 1) => {
    try {
      setInvoicesLoading(true)
      const params = new URLSearchParams({
        page: page.toString(), limit: invoicesPagination.limit.toString(),
        ...(searchQuery && { search: searchQuery }),
        ...(statusFilter !== 'all' && { status: statusFilter }),
        sortBy, sortOrder
      })
      const response = await fetch(`/api/invoices?${params}`)
      if (response.ok) {
        const data: InvoiceResponse = await response.json()
        setInvoices(data.invoices)
        setInvoicesPagination(data.pagination)
      } else {
        toast({ variant: "destructive", title: "Error", description: "Failed to fetch invoices" })
      }
    } catch (error) {
      console.error('Error fetching invoices:', error)
      toast({ variant: "destructive", title: "Error", description: "Failed to fetch invoices" })
    } finally { setInvoicesLoading(false) }
  }

  // Load data based on active tab
  useEffect(() => {
    if (activeTab === 'subscriptions') fetchBilling()
    else if (activeTab === 'payment-methods') fetchPaymentMethods()
    else if (activeTab === 'invoices') fetchInvoices()
  }, [activeTab, searchQuery, statusFilter, sortBy, sortOrder])

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    setBillingPagination(prev => ({ ...prev, page: 1 }))
    setPaymentMethodsPagination(prev => ({ ...prev, page: 1 }))
    setInvoicesPagination(prev => ({ ...prev, page: 1 }))
  }

  const handleFilterChange = (filter: string) => {
    setStatusFilter(filter)
    setBillingPagination(prev => ({ ...prev, page: 1 }))
    setPaymentMethodsPagination(prev => ({ ...prev, page: 1 }))
    setInvoicesPagination(prev => ({ ...prev, page: 1 }))
  }

  const handleDeletePaymentMethod = async (id: string) => {
    if (!(await confirmToast({ title: 'Delete this payment method? It cannot be undone.' }))) return
    try {
      const res = await fetch(`/api/payment-methods/${id}`, { method: 'DELETE' })
      if (res.ok) {
        toast({ title: 'Payment method deleted' })
        fetchPaymentMethods(paymentMethodsPagination.page)
      } else { const err = await res.json(); toast({ title: 'Error', description: err.error }) }
    } catch { toast({ title: 'Error', description: 'Failed to delete' }) }
  }

  const handleSortChange = (field: string) => setSortBy(field)
  const handleSortOrderChange = (order: string) => setSortOrder(order)

  const handlePageChange = (page: number) => {
    if (activeTab === 'subscriptions') { setBillingPagination(prev => ({ ...prev, page })); fetchBilling(page) }
    else if (activeTab === 'payment-methods') { setPaymentMethodsPagination(prev => ({ ...prev, page })); fetchPaymentMethods(page) }
    else if (activeTab === 'invoices') { setInvoicesPagination(prev => ({ ...prev, page })); fetchInvoices(page) }
  }

  const handleRefresh = () => {
    if (activeTab === 'subscriptions') fetchBilling(billingPagination.page)
    else if (activeTab === 'payment-methods') fetchPaymentMethods(paymentMethodsPagination.page)
    else if (activeTab === 'invoices') fetchInvoices(invoicesPagination.page)
  }

  // Derived stats from loaded subscriptions
  const totalRevenue = billing.filter(s => !s.isFreemium).reduce((sum, s) => sum + s.amount, 0)
  const activeCount = billing.filter(s => s.status === 'ACTIVE').length
  const pendingCount = billing.filter(s => s.status === 'PENDING').length
  const expiredCount = billing.filter(s => s.status === 'EXPIRED' || s.status === 'CANCELLED').length

  const STATS = [
    { label: 'Total Revenue', value: formatCurrency(totalRevenue), icon: DollarSign, gradient: 'from-indigo-500 to-purple-600', light: 'bg-indigo-50', text: 'text-indigo-700' },
    { label: 'Active', value: activeCount.toString(), icon: CheckCircle, gradient: 'from-emerald-500 to-teal-600', light: 'bg-emerald-50', text: 'text-emerald-700' },
    { label: 'Pending', value: pendingCount.toString(), icon: Clock, gradient: 'from-amber-500 to-orange-600', light: 'bg-amber-50', text: 'text-amber-700' },
    { label: 'Expired / Cancelled', value: expiredCount.toString(), icon: Ban, gradient: 'from-red-500 to-rose-600', light: 'bg-red-50', text: 'text-red-700' },
  ]

  return (
    <div className="space-y-8">
      {/* ── Hero Header ── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 sm:p-8">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-indigo-500/10 to-purple-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-72 h-72 bg-gradient-to-br from-emerald-500/5 to-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-2 text-indigo-300 text-xs font-semibold uppercase tracking-widest mb-1">
                <Activity className="w-3.5 h-3.5" /> ADMIN
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Billing</h1>
              <p className="text-slate-400 text-sm mt-1">Manage subscriptions, payment methods, invoices, and payment gateways</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={handleRefresh}
                disabled={billingLoading || paymentMethodsLoading || invoicesLoading}
                className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-sm font-medium rounded-xl transition-all backdrop-blur-sm disabled:opacity-60">
                <RefreshCw className={`w-4 h-4 ${(billingLoading || paymentMethodsLoading || invoicesLoading) ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              {activeTab === 'subscriptions' && (
                <button onClick={() => setCreateBillingOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white text-sm font-semibold rounded-xl transition-all shadow-lg shadow-indigo-500/20">
                  <Plus className="w-4 h-4" /> Create
                </button>
              )}
              {activeTab === 'payment-methods' && (
                <button onClick={() => setCreatePaymentMethodOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white text-sm font-semibold rounded-xl transition-all shadow-lg shadow-indigo-500/20">
                  <Plus className="w-4 h-4" /> Create
                </button>
              )}
              {activeTab === 'invoices' && (
                <button onClick={() => setCreateInvoiceOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white text-sm font-semibold rounded-xl transition-all shadow-lg shadow-indigo-500/20">
                  <Plus className="w-4 h-4" /> Create
                </button>
              )}
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
            {STATS.map(s => (
              <div key={s.label} className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-colors">
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-lg ${s.light} bg-opacity-20 flex items-center justify-center`}>
                    <s.icon className={`w-4 h-4 ${s.text}`} />
                  </div>
                  <span className="text-xs text-slate-400 font-medium">{s.label}</span>
                </div>
                <p className="text-lg font-bold text-white mt-2">{s.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full inline-flex gap-1 p-1 bg-slate-100 rounded-2xl">
          {[
            { id: 'subscriptions', label: 'Subscriptions', icon: CreditCard },
            { id: 'payment-methods', label: 'Payment Methods', icon: Wallet },
            { id: 'invoices', label: 'Invoices', icon: Receipt },
            { id: 'stripe-config', label: 'Stripe', icon: Globe },
            { id: 'mpesa-config', label: 'M-Pesa', icon: Smartphone },
          ].map(tab => (
            <TabsTrigger key={tab.id} value={tab.id}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 text-sm font-medium rounded-xl data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm text-slate-500 transition-all">
              <tab.icon className="w-4 h-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {/* ── Subscriptions Tab ── */}
        <TabsContent value="subscriptions" className="space-y-5 mt-6">
          {/* Compact filter bar */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input value={searchQuery} onChange={e => handleSearch(e.target.value)}
                placeholder="Search by school or package..."
                className="w-full h-10 pl-10 pr-4 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder:text-slate-300" />
            </div>
            <Select value={statusFilter} onValueChange={handleFilterChange}>
              <SelectTrigger className="w-full sm:w-[160px] h-10 border-slate-200 rounded-xl">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
                <SelectItem value="EXPIRED">Expired</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={handleSortChange}>
              <SelectTrigger className="w-full sm:w-[150px] h-10 border-slate-200 rounded-xl">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="createdAt">Created</SelectItem>
                <SelectItem value="amount">Amount</SelectItem>
                <SelectItem value="startDate">Start Date</SelectItem>
                <SelectItem value="endDate">End Date</SelectItem>
              </SelectContent>
            </Select>
            <button onClick={() => handleSortOrderChange(sortOrder === 'desc' ? 'asc' : 'desc')}
              className="flex items-center gap-1.5 px-3.5 py-2 border border-slate-200 rounded-xl text-sm text-slate-600 hover:bg-slate-50 transition-colors shrink-0">
              {sortOrder === 'desc' ? <TrendingDown className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}
              {sortOrder === 'desc' ? 'Newest' : 'Oldest'}
            </button>
          </div>

          {/* Subscription cards */}
          {billingLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                <p className="text-sm text-slate-400">Loading subscriptions...</p>
              </div>
            </div>
          ) : billing.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
                <CreditCard className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-700 mb-1">No subscriptions found</h3>
              <p className="text-sm text-slate-400 mb-6">
                {searchQuery ? 'Try adjusting your search or filters' : 'Create your first subscription to get started'}
              </p>
              {!searchQuery && (
                <button onClick={() => setCreateBillingOpen(true)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white text-sm font-semibold rounded-xl transition-all shadow-sm">
                  <Plus className="w-4 h-4" /> Create Subscription
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {billing.map((sub, i) => {
                const schoolInitials = sub.school?.name?.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase() || '??'
                return (
                  <div key={sub.id}
                    className="group bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-md hover:border-indigo-200 transition-all duration-200 overflow-hidden"
                    style={{ animationDelay: `${i * 50}ms` }}>
                    {/* Thin status bar on top */}
                    <div className={`h-1 w-full ${sub.status === 'ACTIVE' ? 'bg-emerald-500' : sub.status === 'PENDING' ? 'bg-amber-500' : sub.status === 'CANCELLED' || sub.status === 'OVERDUE' ? 'bg-red-500' : 'bg-slate-300'}`} />
                    <div className="p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-4 min-w-0 flex-1">
                          {/* School icon */}
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white text-sm font-bold shrink-0 shadow-sm ${
                            sub.status === 'ACTIVE' ? 'bg-gradient-to-br from-emerald-500 to-teal-600' :
                            sub.status === 'PENDING' ? 'bg-gradient-to-br from-amber-500 to-orange-600' :
                            sub.status === 'CANCELLED' || sub.status === 'OVERDUE' ? 'bg-gradient-to-br from-red-500 to-rose-600' :
                            'bg-gradient-to-br from-slate-400 to-slate-500'
                          }`}>
                            {schoolInitials}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="text-sm font-semibold text-slate-900 truncate">
                                {sub.school?.name || (sub.user ? `${sub.user.firstName} ${sub.user.lastName}` : 'Independent User')}
                              </h3>
                              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(sub.status)}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${getStatusDot(sub.status)}`} />
                                {sub.status}
                              </span>
                            </div>
                            <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                              <span className="text-xs text-slate-500 flex items-center gap-1">
                                <Package className="w-3.5 h-3.5 text-slate-400" />
                                {sub.package?.name || 'Unknown'}
                                {sub.type === 'FREEMIUM' && (
                                  <span className="ml-1 px-1.5 py-0.5 text-[10px] font-semibold bg-emerald-100 text-emerald-700 rounded-full">Freemium</span>
                                )}
                              </span>
                              <span className="text-xs text-slate-600 font-semibold flex items-center gap-1">
                                <DollarSign className="w-3.5 h-3.5 text-slate-400" />
                                {formatCurrency(sub.amount)}
                              </span>
                              <span className="text-xs text-slate-400 flex items-center gap-1">
                                <Calendar className="w-3.5 h-3.5" />
                                {formatDate(sub.startDate)} — {formatDate(sub.endDate)}
                              </span>
                              <span className="text-xs text-slate-400">
                                {sub.paymentMethod} · {sub.type === 'FREEMIUM' ? 'Freemium' : sub.type.replace('_', ' ')}
                              </span>
                            </div>
                            {sub.school?.schoolAdmin?.user && (
                              <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                                <Users className="w-3 h-3" />
                                Admin: {sub.school.schoolAdmin.user.firstName} {sub.school.schoolAdmin.user.lastName} ({sub.school.schoolAdmin.user.email})
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button onClick={() => { setSelectedBillingId(sub.id); setBillingDetailsOpen(true) }}
                            className="p-2 rounded-lg hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 transition-colors" title="View details">
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Pagination */}
          {billingPagination.pages > 1 && (
            <div className="flex items-center justify-between bg-white border border-slate-200 rounded-xl shadow-sm px-5 py-3">
              <p className="text-sm text-slate-500">
                Showing <span className="font-medium text-slate-700">{((billingPagination.page - 1) * billingPagination.limit) + 1}</span> to{' '}
                <span className="font-medium text-slate-700">{Math.min(billingPagination.page * billingPagination.limit, billingPagination.total)}</span> of{' '}
                <span className="font-medium text-slate-700">{billingPagination.total}</span> results
              </p>
              <div className="flex items-center gap-2">
                <button onClick={() => handlePageChange(billingPagination.page - 1)} disabled={billingPagination.page === 1}
                  className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-sm font-medium text-slate-600 min-w-[80px] text-center">
                  Page {billingPagination.page} of {billingPagination.pages}
                </span>
                <button onClick={() => handlePageChange(billingPagination.page + 1)} disabled={billingPagination.page === billingPagination.pages}
                  className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </TabsContent>

        {/* ── Payment Methods Tab ── */}
        <TabsContent value="payment-methods" className="space-y-5 mt-6">
          {paymentMethodsLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                <p className="text-sm text-slate-400">Loading payment methods...</p>
              </div>
            </div>
          ) : paymentMethods.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
                <Wallet className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-700 mb-1">No payment methods found</h3>
              <p className="text-sm text-slate-400 mb-6">
                {searchQuery ? 'Try adjusting your search' : 'Create your first payment method'}
              </p>
              {!searchQuery && (
                <button onClick={() => setCreatePaymentMethodOpen(true)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white text-sm font-semibold rounded-xl transition-all shadow-sm">
                  <Plus className="w-4 h-4" /> Create Payment Method
                </button>
              )}
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {paymentMethods.map(method => (
                <div key={method.id}
                  className="bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-md hover:border-indigo-200 transition-all duration-200 overflow-hidden">
                  <div className="p-5">
                    <div className="flex items-start justify-between mb-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${method.isActive ? 'bg-emerald-100' : 'bg-slate-100'}`}>
                        <CreditCard className={`w-5 h-5 ${method.isActive ? 'text-emerald-600' : 'text-slate-400'}`} />
                      </div>
                      <div className="flex items-center gap-1">
                        <button onClick={() => { setEditingPaymentMethod(method); setCreatePaymentMethodOpen(true) }}
                          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleDeletePaymentMethod(method.id)}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <h3 className="text-sm font-semibold text-slate-900 mb-0.5">{method.name}</h3>
                    <p className="text-xs text-slate-400 mb-3">{method.type}{method.description ? ` · ${method.description}` : ''}</p>
                    <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                      <div className="flex items-center gap-3 text-xs text-slate-500">
                        <span className="flex items-center gap-1"><Receipt className="w-3 h-3" /> {method._count.subscriptions}</span>
                        <span className="flex items-center gap-1"><FileText className="w-3 h-3" /> {method._count.invoices}</span>
                      </div>
                      <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${method.isActive ? 'text-emerald-600' : 'text-slate-400'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${method.isActive ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                        {method.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ── Invoices Tab ── */}
        <TabsContent value="invoices" className="space-y-5 mt-6">
          {invoicesLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                <p className="text-sm text-slate-400">Loading invoices...</p>
              </div>
            </div>
          ) : invoices.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
                <Receipt className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-700 mb-1">No invoices found</h3>
              <p className="text-sm text-slate-400 mb-6">
                {searchQuery ? 'Try adjusting your search' : 'Invoices will appear here once subscriptions are active'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {invoices.map((inv, i) => (
                <div key={inv.id}
                  className="bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-md hover:border-indigo-200 transition-all duration-200"
                  style={{ animationDelay: `${i * 50}ms` }}>
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4 min-w-0 flex-1">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${
                          inv.status === 'PAID' ? 'bg-emerald-100' : inv.status === 'OVERDUE' || inv.status === 'CANCELLED' ? 'bg-red-100' : 'bg-amber-100'
                        }`}>
                          {inv.status === 'PAID' ? <CheckCircle className={`w-5 h-5 text-emerald-600`} /> :
                           inv.status === 'OVERDUE' || inv.status === 'CANCELLED' ? <XCircle className="w-5 h-5 text-red-600" /> :
                           <Clock className="w-5 h-5 text-amber-600" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-sm font-semibold text-slate-900 font-mono">{inv.invoiceNumber}</h3>
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(inv.status)}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${getStatusDot(inv.status)}`} />
                              {inv.status}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                            <span className="text-xs text-slate-600 font-semibold">{formatCurrency(inv.totalAmount)}</span>
                            <span className="text-xs text-slate-400">{inv.subscription.school?.name || 'Unknown School'}</span>
                            <span className="text-xs text-slate-400">{inv.subscription.package.name}</span>
                            <span className="text-xs text-slate-400 flex items-center gap-1">
                              <Calendar className="w-3 h-3" /> Due: {formatDate(inv.dueDate)}
                            </span>
                            {inv.paidDate && (
                              <span className="text-xs text-emerald-600 flex items-center gap-1">
                                <Check className="w-3 h-3" /> Paid: {formatDate(inv.paidDate)}
                              </span>
                            )}
                          </div>
                          {inv.paymentMethod && (
                            <p className="text-xs text-slate-400 mt-0.5">via {inv.paymentMethod.name} ({inv.paymentMethod.type})</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button className="p-2 rounded-lg hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 transition-colors" title="View">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors" title="Edit">
                          <Edit className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ── Config Tabs ── */}
        <TabsContent value="stripe-config" className="mt-6"><StripeConfigPanel /></TabsContent>
        <TabsContent value="mpesa-config" className="mt-6"><MpesaConfigPanel /></TabsContent>
      </Tabs>

      {/* Modals */}
      <CreateBillingModal isOpen={createBillingOpen} onClose={() => setCreateBillingOpen(false)}
        onBillingCreated={() => { setCreateBillingOpen(false); fetchBilling() }} />
      <BillingDetailsModal isOpen={billingDetailsOpen} onClose={() => setBillingDetailsOpen(false)}
        billingId={selectedBillingId} onBillingUpdated={() => { setBillingDetailsOpen(false); fetchBilling() }}
        onBillingDeleted={() => { setBillingDetailsOpen(false); fetchBilling() }} />
      <CreatePaymentMethodModal open={createPaymentMethodOpen} onOpenChange={(open) => { setCreatePaymentMethodOpen(open); if (!open) setEditingPaymentMethod(null) }}
        editing={editingPaymentMethod}
        onSuccess={() => { setCreatePaymentMethodOpen(false); setEditingPaymentMethod(null); fetchPaymentMethods() }} />
      <CreateInvoiceModal open={createInvoiceOpen} onOpenChange={setCreateInvoiceOpen}
        onSuccess={() => { setCreateInvoiceOpen(false); fetchInvoices() }} />
    </div>
  )
}
