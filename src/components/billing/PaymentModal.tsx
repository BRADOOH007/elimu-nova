"use client"

import { useState, useEffect } from 'react'
import { AdminModal, AdminModalFooter, AdminFormField, adminInputClass } from "@/components/ui/admin-modal"
import { CreditCard, Smartphone, Building, Wallet, Loader2, CheckCircle } from 'lucide-react'
import { useToast } from "@/hooks/use-toast"

interface PaymentModalProps {
  isOpen: boolean
  onClose: () => void
  country?: string
  currency?: string
  amount?: number
  planName?: string
}

export default function PaymentModal({ isOpen, onClose, country = 'US', currency = 'USD', amount = 0, planName = 'Premium Plan' }: PaymentModalProps) {
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
    ...(!isKenya ? [{ id: 'applepay', icon: Wallet, label: 'Apple Pay / Google Pay', bg: 'bg-slate-50', text: 'text-slate-700' }] : []),
    ...(!isKenya ? [{ id: 'bank', icon: Building, label: 'Bank Transfer / ACH', bg: 'bg-amber-50', text: 'text-amber-700' }] : []),
  ]

  const handlePay = async () => {
    if (!method) { toast({ title: 'Select method', description: 'Please select a payment method', variant: 'destructive' }); return }
    setLoading(true)
    // Simulate payment processing
    await new Promise(r => setTimeout(r, 2000))
    setLoading(false)
    setSuccess(true)
    toast({ title: 'Payment Successful', description: `Charged ${fmt(amount)} via ${method.toUpperCase()}` })
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
