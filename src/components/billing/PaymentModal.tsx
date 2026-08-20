"use client"

import { useState, useEffect } from 'react'
import { AdminModal, AdminModalFooter, AdminFormField, adminInputClass } from "@/components/ui/admin-modal"
import { CreditCard, Smartphone, Building, Wallet, Loader2, CheckCircle } from 'lucide-react'

function PayPalIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797H8.745c-.692 0-1.278.5-1.386 1.188L6.22 20.19c-.1.528-.557.93-1.093.93H2.47l.94-6.48.94 6.48h-2.274v.217h3.923c.537 0 .994-.402 1.094-.93l.953-4.76c.107-.688.693-1.188 1.386-1.188h3.137c4.298 0 7.664-1.747 8.647-6.797.03-.149.054-.294.077-.437.292-1.868-.002-3.137-1.012-4.287C22.536.543 20.528 0 17.958 0h-11.96C5.474 0 5.026.382 4.944.901L1.837 20.597a.641.641 0 0 0 .633.74h4.606v-.217z" />
    </svg>
  )
}
import { useToast } from "@/hooks/use-toast"

interface PaymentModalProps {
  isOpen: boolean
  onClose: () => void
  country?: string
  currency?: string
  amount?: number
  planName?: string
  packageId?: string
}

export default function PaymentModal({ isOpen, onClose, country = 'US', currency = 'USD', amount = 0, planName = 'Premium Plan', packageId }: PaymentModalProps) {
  const [method, setMethod] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const { toast } = useToast()

  useEffect(() => { if (isOpen) { setMethod(''); setSuccess(false) } }, [isOpen])

  const isKenya = country === 'KE' || currency === 'KES'
  const fmt = (n: number) => isKenya
    ? new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES' }).format(n)
    : new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)

  const cardMethods = [
    { id: 'card', icon: CreditCard, label: 'Credit / Debit Card', bg: 'bg-indigo-50', text: 'text-indigo-700' },
    ...(isKenya ? [{ id: 'mpesa', icon: Smartphone, label: 'M-Pesa Mobile Money', bg: 'bg-emerald-50', text: 'text-emerald-700' }] : []),
    { id: 'paypal', icon: PayPalIcon, label: 'PayPal', bg: 'bg-blue-50', text: 'text-blue-700' },
    ...(!isKenya ? [{ id: 'applepay', icon: Wallet, label: 'Apple Pay / Google Pay', bg: 'bg-slate-50', text: 'text-slate-700' }] : []),
    ...(!isKenya ? [{ id: 'bank', icon: Building, label: 'Bank Transfer / ACH', bg: 'bg-amber-50', text: 'text-amber-700' }] : []),
  ]

  const handlePay = async () => {
    if (!method) { toast({ title: 'Select method', description: 'Please select a payment method', variant: 'destructive' }); return }
    setLoading(true)

    // Manual activation is reserved for platform admins (super admin) — for
    // regular users an unauthenticated grant endpoint was an escalation risk.
    const activateBilling = async (m: string) => {
      const res = await fetch('/api/billing/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ method: m, amount, currency: isKenya ? 'KES' : 'USD' }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || `Activation failed (${res.status})`)
      }
    }

    try {
      if (method === 'paypal') {
        // Create a real PayPal order. The API resolves the package by id (and
        // always charges USD — KES is not PayPal-supported). Without a
        // packageId the order cannot be priced, so fail visibly instead of
        // pretending the payment went through.
        const res = await fetch('/api/subscription/paypal/create-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(packageId ? { packageId, currency: 'USD' } : { amount, currency: 'USD' }),
        })
        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          setLoading(false)
          throw new Error(data.error || 'PayPal order could not be created')
        }
        const data = await res.json()
        // Redirect to PayPal approval URL
        if (data.approvalUrl) {
          window.location.href = data.approvalUrl
          return
        }
        throw new Error('PayPal did not return an approval URL')
      } else if (method === 'mpesa') {
        // M-Pesa STK Push
        const res = await fetch('/api/billing/mpesa/stkpush', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount, currency: 'KES' }),
        })
        if (!res.ok) {
          // Fallback: simulate for demo (admin only)
          await new Promise(r => setTimeout(r, 2000))
          await activateBilling('MPESA')
        }
      } else {
        // Card, Apple Pay, Bank: simulate for demo (admin only)
        await new Promise(r => setTimeout(r, 2000))
        await activateBilling(method.toUpperCase())
      }

      setLoading(false)
      setSuccess(true)
      toast({ title: 'Payment Successful', description: `Charged ${fmt(amount)} via ${method.toUpperCase()}` })
    } catch (e) {
      console.error('Payment error:', e)
      setLoading(false)
      toast({
        title: 'Payment failed',
        description: e instanceof Error ? e.message : 'Online activation is restricted to platform admins. Use the pricing page to pay by card or PayPal.',
        variant: 'destructive',
      })
    }
  }

  const currencyLabel = isKenya ? 'KES' : 'USD'

  return (
    <AdminModal open={isOpen} onClose={onClose} title="Pay Subscription" subtitle={`${planName} — ${fmt(amount)} ${currencyLabel}`} icon={<CreditCard />} size="md"
      footer={success ? (
        <button onClick={onClose} className="rounded-lg bg-indigo-600 hover:bg-indigo-700 px-5 py-2 text-sm font-medium text-white shadow-sm transition">Done</button>
      ) : (
        <AdminModalFooter onCancel={onClose} submitLabel={`Pay ${fmt(amount)}`} loading={loading} onSubmit={handlePay} type="button" />
      )}
    >
      {success ? (
        <div className="text-center py-6 space-y-3">
          <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto" />
          <h3 className="text-lg font-bold text-slate-900">Payment Successful</h3>
          <p className="text-sm text-slate-500">Thank you! Your {planName} subscription is now active.</p>
          <div className="bg-slate-50 rounded-xl p-4 text-sm text-slate-600">
            <p>Amount: {fmt(amount)} {currencyLabel}</p>
            <p>Method: {method.toUpperCase()}</p>
            <p>Date: {new Date().toLocaleDateString()}</p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-slate-600">Select your payment method:</p>
          <div className="space-y-2">
            {cardMethods.map(m => (
              <button key={m.id} type="button" onClick={() => setMethod(m.id)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl border transition ${method === m.id ? 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-500/20' : 'border-slate-200 bg-white hover:bg-slate-50'}`}>
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${m.bg} ${m.text}`}>
                  <m.icon className="w-5 h-5" />
                </div>
                <span className="text-sm font-medium text-slate-800">{m.label}</span>
                {method === m.id && <CheckCircle className="w-5 h-5 text-indigo-600 ml-auto" />}
              </button>
            ))}
          </div>
          {isKenya && (
            <div className="bg-slate-50 rounded-xl p-3 text-xs text-slate-500">
              <p className="font-semibold mb-1">M-Pesa Paybill Details:</p>
              <p>Business Number: <span className="font-mono font-bold text-slate-700">247247</span></p>
              <p>Account Number: <span className="font-mono text-slate-700">ELIMU-{Date.now().toString(36).slice(-4).toUpperCase()}</span></p>
            </div>
          )}
        </div>
      )}
    </AdminModal>
  )
}
