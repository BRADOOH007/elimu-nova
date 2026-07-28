'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Loader2,
  CreditCard,
  CheckCircle,
  AlertCircle,
  Download,
  FileText,
  Calendar,
  DollarSign,
  Receipt,
} from 'lucide-react'

interface Invoice {
  id: string
  invoiceNumber: string
  amount: number
  status: string
  description: string
  dueDate: string
  paidAt: string
  createdAt: string
  planName?: string
}

export default function ParentBillingPage() {
  const [billing, setBilling] = useState<any>(null)
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/parent/billing')
        if (res.ok) {
          const data = await res.json()
          setBilling(data.billing)
          setInvoices(data.invoices || [])
        }
      } catch (e) { console.warn('[ParentBilling] fetch billing error:', e) } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) return (
    <div className="space-y-6 animate-pulse">
      <div className="space-y-2">
        <div className="h-7 w-48 bg-slate-200 rounded" />
        <div className="h-4 w-64 bg-slate-200 rounded" />
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4">
        <div className="h-5 w-24 bg-slate-200 rounded" />
        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
          <div className="space-y-2">
            <div className="h-5 w-32 bg-slate-200 rounded" />
            <div className="h-4 w-20 bg-slate-200 rounded" />
          </div>
          <div className="h-7 w-20 bg-slate-200 rounded-full" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 bg-slate-50 rounded-lg space-y-1">
            <div className="h-3 w-16 bg-slate-200 rounded" />
            <div className="h-6 w-12 bg-slate-200 rounded" />
          </div>
          <div className="p-3 bg-slate-50 rounded-lg space-y-1">
            <div className="h-3 w-16 bg-slate-200 rounded" />
            <div className="h-6 w-12 bg-slate-200 rounded" />
          </div>
        </div>
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4">
        <div className="h-5 w-28 bg-slate-200 rounded" />
        <div className="space-y-3">
          <div className="flex gap-4 pb-2 border-b border-slate-200">
            <div className="h-4 w-1/5 bg-slate-200 rounded" />
            <div className="h-4 w-1/5 bg-slate-200 rounded" />
            <div className="h-4 w-1/5 bg-slate-200 rounded" />
            <div className="h-4 w-1/5 bg-slate-200 rounded" />
          </div>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex gap-4 py-2">
              <div className="h-4 w-1/5 bg-slate-200 rounded" />
              <div className="h-4 w-1/5 bg-slate-200 rounded" />
              <div className="h-4 w-1/5 bg-slate-200 rounded" />
              <div className="h-4 w-1/5 bg-slate-200 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  const fmtCurr = (n: number) => new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', minimumFractionDigits: 0 }).format(n)
  const fmtDate = (iso: string) => iso ? new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'

  const statusBadge = (s: string) => {
    const map: Record<string, string> = { PAID: 'bg-green-100 text-green-700', PENDING: 'bg-yellow-100 text-yellow-700', OVERDUE: 'bg-red-100 text-red-700', CANCELLED: 'bg-slate-100 text-slate-700' }
    return <Badge className={map[s] || 'bg-slate-100 text-slate-700'}>{s}</Badge>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">
          <span className="edugenius-text-gradient">Billing & Subscription</span>
        </h1>
        <p className="text-gray-600">Manage your subscription and view invoice history.</p>
      </div>

      {/* Current Plan */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" /> Current Plan
          </CardTitle>
          <CardDescription>Your subscription details and usage.</CardDescription>
        </CardHeader>
        <CardContent>
          {billing ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-semibold text-lg">{billing.planName || 'Free Plan'}</p>
                  <p className="text-sm text-gray-500">
                    {billing.status === 'ACTIVE' ? 'Active' : billing.status}
                  </p>
                </div>
                <Badge className={billing.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'}>
                  {billing.status === 'ACTIVE' ? <CheckCircle className="w-3 h-3 mr-1" /> : <AlertCircle className="w-3 h-3 mr-1" />}
                  {billing.status || 'Unknown'}
                </Badge>
              </div>
              {billing.usage && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-gray-600">Students</p>
                    <p className="text-xl font-bold">{billing.usage.students || 0}</p>
                  </div>
                  <div className="p-3 bg-purple-50 rounded-lg">
                    <p className="text-sm text-gray-600">Storage</p>
                    <p className="text-xl font-bold">{billing.usage.storage || '0 GB'}</p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <CreditCard className="mx-auto mb-3 h-8 w-8 text-gray-300" />
              <p>No subscription data available.</p>
              <p className="text-sm mt-1">You are currently on the free plan.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Invoice History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="w-5 h-5" /> Invoice History
          </CardTitle>
          <CardDescription>View and download your past invoices.</CardDescription>
        </CardHeader>
        <CardContent>
          {invoices.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FileText className="mx-auto mb-3 h-8 w-8 text-gray-300" />
              <p>No invoices yet</p>
              <p className="text-sm mt-1">Invoices will appear here once you subscribe to a paid plan.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map(inv => (
                    <TableRow key={inv.id}>
                      <TableCell className="font-medium">{inv.invoiceNumber}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <Calendar className="h-3 w-3 text-slate-400" />
                          {fmtDate(inv.createdAt)}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-slate-600">{inv.description || inv.planName || '-'}</TableCell>
                      <TableCell className="font-semibold">{fmtCurr(inv.amount)}</TableCell>
                      <TableCell>{statusBadge(inv.status)}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => window.open(`/api/billing/invoices/${inv.id}/pdf`, '_blank')}>
                          <Download className="h-4 w-4" />
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

      {/* Payment Method */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" /> Payment Method
          </CardTitle>
          <CardDescription>Manage your default payment method.</CardDescription>
        </CardHeader>
        <CardContent>
          {billing?.paymentMethod ? (
            <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg">
              <CreditCard className="h-6 w-6 text-slate-400" />
              <div>
                <p className="font-medium">{billing.paymentMethod.type} ending in {billing.paymentMethod.last4}</p>
                <p className="text-sm text-slate-500">Expires {billing.paymentMethod.expiry}</p>
              </div>
              <Button variant="outline" size="sm" className="ml-auto">Update</Button>
            </div>
          ) : (
            <div className="text-center py-6 text-gray-500">
              <CreditCard className="mx-auto mb-2 h-6 w-6 text-gray-300" />
              <p className="text-sm">No payment method on file.</p>
              <Button variant="outline" size="sm" className="mt-2">Add Payment Method</Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
