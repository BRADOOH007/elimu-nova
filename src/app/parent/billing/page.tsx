'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  CreditCard, Download, FileText,
  Calendar, Receipt, Smartphone, Building, Wallet,
  ArrowRight, ShieldCheck,
} from 'lucide-react'
import PaymentModal from '@/components/billing/PaymentModal'

interface Invoice {
  id: string; invoiceNumber: string; amount: number; status: string
  description: string; dueDate: string; paidAt: string; createdAt: string; planName?: string
}

interface BillingSummary {
  status: string | null
  planName: string
  amount: number
  startDate: string | null
  endDate: string | null
}

export default function ParentBillingPage() {
  const [billing, setBilling] = useState<BillingSummary | null>(null)
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [showPayment, setShowPayment] = useState(false)
  const [country, setCountry] = useState('US')

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/parent/billing')
        if (res.ok) {
          const data = await res.json()
          setBilling(data.billing)
          setInvoices(data.invoices || [])
          if (data.school?.country) setCountry(data.school.country)
        }
        // Also get user preferences for independent parents
        const ur = await fetch('/api/user-profile')
        if (ur.ok) { const d = await ur.json(); if (d?.country) setCountry(d.country) }
      } catch { } finally { setLoading(false) }
    }
    load()
  }, [])

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="space-y-2"><div className="h-7 w-48 bg-slate-200 rounded" /><div className="h-4 w-64 bg-slate-200 rounded" /></div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4">
          {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-16 bg-slate-100 rounded-lg" />)}
        </div>
      </div>
    )
  }

  const isKenya = country === 'KE'
  const currency = isKenya ? 'KES' : 'USD'
  const fmtCurr = (n: number) => isKenya
    ? new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', minimumFractionDigits: 0 }).format(n)
    : new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(n)
  const fmtDate = (iso: string) => iso ? new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'

  const statusBadge = (s: string) => {
    const map: Record<string, string> = { PAID: 'bg-emerald-100 text-emerald-700', PENDING: 'bg-amber-100 text-amber-700', OVERDUE: 'bg-red-100 text-red-700', CANCELLED: 'bg-slate-100 text-slate-700' }
    return <Badge className={map[s] || 'bg-slate-100 text-slate-700'}>{s}</Badge>
  }

  const totalOutstanding = invoices.filter(i => i.status !== 'PAID').reduce((s, i) => s + i.amount, 0)
  const nextDue = invoices.find(i => i.status !== 'PAID')
  const planName = billing?.planName || 'Free Plan'

  const feeLineItems = [
    { label: 'Tuition Fees', amount: isKenya ? 15000 : 299.99, status: 'PAID' },
    { label: 'Activity & Technology Fee', amount: isKenya ? 2500 : 49.99, status: 'PENDING' },
    { label: 'Learning Resources & AI Pass', amount: isKenya ? 3000 : 79.99, status: 'PENDING' },
  ]

  const paymentMethods = [
    ...(isKenya
      ? [{ icon: Smartphone, label: 'M-Pesa Express', detail: 'Paybill 247247 · Auto STK Push', bg: 'bg-emerald-50', text: 'text-emerald-700' }]
      : []),
    { icon: CreditCard, label: 'Credit / Debit Card', detail: 'Visa, Mastercard, Amex via Stripe', bg: 'bg-indigo-50', text: 'text-indigo-700' },
    ...(isKenya ? [] : [
      { icon: Wallet, label: 'Apple Pay / Google Pay', detail: 'Instant mobile wallet payment', bg: 'bg-slate-50', text: 'text-slate-700' },
      { icon: Building, label: 'ACH Bank Transfer', detail: 'Direct deposit · 1-3 business days', bg: 'bg-amber-50', text: 'text-amber-700' },
    ]),
  ]

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">School Fee & Invoice Management</h1>
          <p className="text-sm text-slate-500 mt-1">Manage payments, view invoices, and update billing preferences</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="bg-white" onClick={() => window.open('#', '_blank')}>
            <Download className="w-4 h-4 mr-1.5" />Download Fee Statement (PDF)
          </Button>
          <Button className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 shadow-sm" onClick={() => setShowPayment(true)}>
            Make Payment
          </Button>
        </div>
      </div>

      {/* Fee Summary Deck */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-slate-100 shadow-sm bg-gradient-to-br from-slate-50 to-white col-span-2">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Total Outstanding Balance</p>
                <p className="text-3xl font-bold text-slate-900">{fmtCurr(totalOutstanding)}</p>
                {nextDue && <p className="text-sm text-slate-500 mt-1">Term 1 Balance Due: {fmtDate(nextDue.dueDate || nextDue.createdAt)}</p>}
              </div>
              <Button className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-sm text-sm px-5 py-2.5" onClick={() => setShowPayment(true)}>
                <ArrowRight className="w-4 h-4 mr-1.5" />Pay Now
              </Button>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-100 shadow-sm">
          <CardContent className="p-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Current Plan</p>
            <p className="text-lg font-bold text-slate-900">{planName}</p>
            <p className="text-xs text-slate-400 mt-0.5">Billing: {currency} · {isKenya ? 'Kenya' : 'International'}</p>
            <Badge className="mt-2 bg-emerald-100 text-emerald-700">{billing?.status || 'ACTIVE'}</Badge>
          </CardContent>
        </Card>
      </div>

      {/* Fee Breakdown Ledger */}
      <Card className="border-slate-100 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2"><FileText className="w-5 h-5 text-indigo-600" />Fee Breakdown & Term Ledger</CardTitle>
          <CardDescription>Itemized charges for the current academic period</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader><TableRow className="border-b border-slate-100"><TableHead className="text-xs font-semibold uppercase text-slate-500">Charge Item</TableHead><TableHead className="text-xs font-semibold uppercase text-slate-500 text-right">Amount</TableHead><TableHead className="text-xs font-semibold uppercase text-slate-500">Status</TableHead></TableRow></TableHeader>
              <TableBody>
                {feeLineItems.map((item, i) => (
                  <TableRow key={i} className="border-b border-slate-50">
                    <TableCell className="py-3 text-sm font-medium text-slate-800">{item.label}</TableCell>
                    <TableCell className="py-3 text-sm text-right font-semibold text-slate-800">{fmtCurr(item.amount)}</TableCell>
                    <TableCell className="py-3">{statusBadge(item.status)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Saved Payment Methods */}
      <Card className="border-slate-100 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2"><ShieldCheck className="w-5 h-5 text-indigo-600" />Saved Payment Methods</CardTitle>
          <CardDescription>Accepted payment modes for your region</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {paymentMethods.map((pm, i) => (
              <div key={i} className={`flex items-center gap-3 p-4 rounded-xl border border-slate-200 ${pm.bg} ${pm.text}`}>
                <pm.icon className="w-5 h-5 shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold">{pm.label}</p>
                  <p className="text-[11px] opacity-70">{pm.detail}</p>
                </div>
              </div>
            ))}
            {(isKenya ? 2 : 3) <= paymentMethods.length ? null : (
              <Button variant="outline" className="h-full min-h-[72px] border-dashed text-slate-400 hover:text-indigo-600" onClick={() => setShowPayment(true)}>
                + Add Payment Method
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Payment History */}
      <Card className="border-slate-100 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2"><Receipt className="w-5 h-5 text-indigo-600" />Payment History & Receipts</CardTitle>
          <CardDescription>Recent transactions and downloadable receipts</CardDescription>
        </CardHeader>
        <CardContent>
          {invoices.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
                <Receipt className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-sm font-semibold text-slate-700">No transactions recorded</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                {totalOutstanding > 0
                  ? `You have an outstanding balance of ${fmtCurr(totalOutstanding)}. Use the Pay Now button above to settle.`
                  : 'No transactions recorded for this academic period.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader><TableRow className="border-b border-slate-100"><TableHead className="text-xs font-semibold uppercase text-slate-500">Date</TableHead><TableHead className="text-xs font-semibold uppercase text-slate-500">Invoice #</TableHead><TableHead className="text-xs font-semibold uppercase text-slate-500">Description</TableHead><TableHead className="text-xs font-semibold uppercase text-slate-500 text-right">Amount</TableHead><TableHead className="text-xs font-semibold uppercase text-slate-500">Status</TableHead><TableHead className="text-xs font-semibold uppercase text-slate-500 text-right">Receipt</TableHead></TableRow></TableHeader>
                <TableBody>
                  {invoices.map(inv => (
                    <TableRow key={inv.id} className="border-b border-slate-50">
                      <TableCell className="py-3"><div className="flex items-center gap-1 text-sm"><Calendar className="h-3 w-3 text-slate-400" />{fmtDate(inv.createdAt)}</div></TableCell>
                      <TableCell className="py-3 text-sm font-mono text-indigo-600 font-semibold">#{inv.invoiceNumber?.slice(-8) || inv.id?.slice(-8)}</TableCell>
                      <TableCell className="py-3 text-sm text-slate-600">{inv.description || inv.planName || 'School Fee'}</TableCell>
                      <TableCell className="py-3 text-sm text-right font-semibold text-slate-800">{fmtCurr(inv.amount)}</TableCell>
                      <TableCell className="py-3">{statusBadge(inv.status)}</TableCell>
                      <TableCell className="py-3 text-right">
                        <Button variant="ghost" size="sm" className="h-7" onClick={() => window.open(`/api/billing/invoices/${inv.id}/pdf`, '_blank')}>
                          <Download className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {showPayment && <PaymentModal isOpen={showPayment} onClose={() => setShowPayment(false)} country={country} currency={currency} amount={totalOutstanding || 49.99} planName={planName} />}
    </div>
  )
}
