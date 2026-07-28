"use client"

import { useState, useEffect } from 'react'
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { 
  Loader2, CreditCard, Calendar, DollarSign,
  Edit, Trash2, Save, X, Clock, User, Phone, Mail, MapPin, RefreshCw, Package,
  Building2, Tag, Hash, Receipt, CheckCircle, AlertCircle, Ban
} from "lucide-react"
import { confirmToast } from '@/lib/confirm-toast'

interface School {
  id: string; name: string
}

interface Package {
  id: string; name: string; price: number; duration: number; isActive: boolean
}

interface Billing {
  id: string; startDate: string; endDate: string; amount: number
  status: string; type: string; paymentMethod: string
  transactionId?: string; notes?: string; createdAt: string; updatedAt: string
  school: { id: string; name: string; address: string; phone?: string; email?: string; schoolAdmin?: { user: { firstName: string; lastName: string; email: string } } } | null
  user?: { id: string; firstName: string; lastName: string; email: string } | null
  package: { id: string; name: string; description?: string; price: number; duration: number; features?: string[] }
}

interface BillingDetailsModalProps {
  isOpen: boolean; onClose: () => void; billingId: string | null
  onBillingUpdated: (billing: Billing) => void; onBillingDeleted: (billingId: string) => void
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { bg: string; text: string; dot: string; icon: any }> = {
    ACTIVE:    { bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-700', dot: 'bg-emerald-500', icon: CheckCircle },
    PENDING:   { bg: 'bg-amber-50 border-amber-200', text: 'text-amber-700', dot: 'bg-amber-500', icon: Clock },
    CANCELLED: { bg: 'bg-red-50 border-red-200', text: 'text-red-700', dot: 'bg-red-500', icon: Ban },
    EXPIRED:   { bg: 'bg-slate-50 border-slate-200', text: 'text-slate-600', dot: 'bg-slate-400', icon: AlertCircle },
  }
  const c = config[status] || config.EXPIRED
  const Icon = c.icon
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${c.bg} ${c.text}`}>
      <Icon className="w-3.5 h-3.5" />
      {status}
    </span>
  )
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

function formatCurrency(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)
}

export function BillingDetailsModal({ isOpen, onClose, billingId, onBillingUpdated, onBillingDeleted }: BillingDetailsModalProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [editing, setEditing] = useState(false)
  const [billing, setBilling] = useState<Billing | null>(null)
  const [schools, setSchools] = useState<School[]>([])
  const [packages, setPackages] = useState<Package[]>([])
  const [renewing, setRenewing] = useState(false)
  const [renewPackageId, setRenewPackageId] = useState('')
  const [renewLoading, setRenewLoading] = useState(false)
  const [formData, setFormData] = useState({
    schoolId: '', packageId: '', startDate: '', endDate: '', amount: '',
    status: '', type: '', paymentMethod: '', transactionId: '', notes: ''
  })

  const fetchBilling = async () => {
    if (!billingId) return
    setLoading(true)
    try {
      const res = await fetch(`/api/billing/${billingId}`)
      if (res.ok) {
        const d = await res.json()
        setBilling(d)
        setFormData({
          schoolId: d.school?.id || '', packageId: d.package.id,
          startDate: d.startDate.split('T')[0], endDate: d.endDate.split('T')[0],
          amount: d.amount.toString(), status: d.status, type: d.type,
          paymentMethod: d.paymentMethod, transactionId: d.transactionId || '', notes: d.notes || ''
        })
      } else { toast({ variant: "destructive", title: "Error", description: "Failed to fetch billing details" }) }
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Failed to fetch billing details" })
    } finally { setLoading(false) }
  }

  const fetchData = async () => {
    try {
      const [sr, pr] = await Promise.all([
        fetch('/api/schools?limit=100'), fetch('/api/packages')
      ])
      if (sr.ok) { const d = await sr.json(); setSchools(d.schools || []) }
      if (pr.ok) { const d = await pr.json(); setPackages(d.packages || []) }
    } catch { /* ignore */ }
  }

  useEffect(() => {
    if (isOpen && billingId) { fetchBilling(); fetchData() }
  }, [isOpen, billingId])

  const handleSave = async () => {
    if (!billingId) return
    setSaving(true)
    try {
      const res = await fetch(`/api/billing/${billingId}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, amount: parseFloat(formData.amount) }),
      })
      if (res.ok) {
        const updated = await res.json()
        setBilling(updated); onBillingUpdated(updated); setEditing(false)
        toast({ title: "Billing Updated", description: "Billing information has been updated successfully!" })
      } else {
        const err = await res.json()
        toast({ variant: "destructive", title: "Error", description: err.error || "Failed to update billing" })
      }
    } catch { toast({ variant: "destructive", title: "Error", description: "Failed to update billing" }) }
    finally { setSaving(false) }
  }

  const handleDelete = async () => {
    if (!billingId) return
    if (!(await confirmToast({ title: 'Delete this billing record? This cannot be undone.', variant: 'destructive' }))) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/billing/${billingId}`, { method: 'DELETE' })
      if (res.ok) { onBillingDeleted(billingId); onClose(); toast({ title: "Deleted", description: "Billing record deleted successfully!" }) }
      else { const err = await res.json(); toast({ variant: "destructive", title: "Error", description: err.error || "Failed to delete" }) }
    } catch { toast({ variant: "destructive", title: "Error", description: "Failed to delete" }) }
    finally { setDeleting(false) }
  }

  const handleRenew = async () => {
    if (!billingId || !renewPackageId) return
    setRenewLoading(true)
    try {
      const res = await fetch('/api/billing/renew', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscriptionId: billingId, packageId: renewPackageId })
      })
      if (res.ok) {
        const data = await res.json()
        onBillingUpdated(data.subscription); setRenewing(false); setRenewPackageId('')
        toast({ title: 'Renewed', description: 'Subscription renewed successfully!' })
        fetchBilling()
      } else { const err = await res.json(); toast({ variant: 'destructive', title: 'Error', description: err.error || 'Failed to renew' }) }
    } catch { toast({ variant: 'destructive', title: 'Error', description: 'Failed to renew' }) }
    finally { setRenewLoading(false) }
  }

  const handleInputChange = (field: string, value: string) => setFormData(prev => ({ ...prev, [field]: value }))

  if (loading) return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto bg-white">
        <DialogHeader><DialogTitle className="text-slate-800 flex items-center gap-2"><Loader2 className="w-5 h-5 animate-spin text-indigo-500" /> Loading</DialogTitle></DialogHeader>
        <div className="flex items-center justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-slate-300" /></div>
      </DialogContent>
    </Dialog>
  )

  if (!billing) return null

  const isExpired = new Date(billing.endDate) < new Date()
  const isCancelled = billing.status === 'CANCELLED'
  const canRenew = isExpired || isCancelled
  const daysRemaining = Math.ceil((new Date(billing.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))

  const InfoRow = ({ icon: Icon, label, value }: { icon: any; label: string; value: string }) => (
    <div className="flex items-center gap-2.5 text-sm">
      <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
        <Icon className="w-3.5 h-3.5 text-slate-500" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-slate-400">{label}</p>
        <p className="text-sm font-medium text-slate-800 truncate">{value}</p>
      </div>
    </div>
  )

  const schoolInitials = billing.school?.name?.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase() || '??'

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto bg-white p-0 gap-0">
        {/* ── Header ── */}
        <div className="sticky top-0 z-10 bg-white border-b border-slate-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-sm">
                <CreditCard className="w-4 h-4" />
              </div>
              <div>
                <DialogTitle className="text-base font-semibold text-slate-800 m-0">Billing Details</DialogTitle>
                <DialogDescription className="text-xs text-slate-400 m-0">View and manage subscription billing information</DialogDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {editing ? (
                <>
                  <button onClick={() => setEditing(false)} disabled={saving}
                    className="flex items-center gap-1.5 px-3.5 py-2 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition-all disabled:opacity-60">
                    <X className="w-4 h-4" /> Cancel
                  </button>
                  <button onClick={handleSave} disabled={saving}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-sm font-semibold rounded-xl transition-all disabled:opacity-60 shadow-sm">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save
                  </button>
                </>
              ) : (
                <>
                  <button onClick={() => setEditing(true)}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-sm font-semibold rounded-xl transition-all shadow-sm">
                    <Edit className="w-4 h-4" /> Edit
                  </button>
                  <button onClick={handleDelete} disabled={deleting}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-xl transition-all disabled:opacity-60 shadow-sm">
                    {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />} Delete
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* ── Summary Bar ── */}
          <div className="flex flex-wrap items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold shrink-0 shadow-sm ${
                billing.status === 'ACTIVE' ? 'bg-gradient-to-br from-emerald-500 to-teal-600' :
                billing.status === 'PENDING' ? 'bg-gradient-to-br from-amber-500 to-orange-600' :
                billing.status === 'CANCELLED' ? 'bg-gradient-to-br from-red-500 to-rose-600' :
                'bg-gradient-to-br from-slate-400 to-slate-500'
              }`}>
                {schoolInitials}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-800 truncate">
                  {billing.school?.name || (billing.user ? `${billing.user.firstName} ${billing.user.lastName}` : 'Independent')}
                </p>
                <p className="text-xs text-slate-400">{billing.package.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <div className="text-right">
                <p className="text-xs text-slate-400">Amount</p>
                <p className="text-sm font-bold text-slate-800">{formatCurrency(billing.amount)}</p>
              </div>
              <div className="w-px h-8 bg-slate-200" />
              <div className="text-right">
                <p className="text-xs text-slate-400">{isExpired ? 'Ended' : 'Remaining'}</p>
                <p className={`text-sm font-bold ${isExpired ? 'text-red-600' : daysRemaining < 30 ? 'text-amber-600' : 'text-emerald-600'}`}>
                  {isExpired ? 'Expired' : `${daysRemaining}d`}
                </p>
              </div>
              <div className="w-px h-8 bg-slate-200" />
              <StatusBadge status={billing.status} />
            </div>
          </div>

          {/* ── Two-column layout ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left column */}
            <div className="space-y-6">
              {/* Billing Information */}
              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
                <div className="px-5 py-3.5 border-b border-slate-100">
                  <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                    <Receipt className="w-4 h-4 text-indigo-500" /> Billing Information
                  </h3>
                </div>
                <div className="px-5 py-4 space-y-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-slate-400 font-medium">School</Label>
                    {editing ? (
                      <Select value={formData.schoolId} onValueChange={v => handleInputChange('schoolId', v)}>
                        <SelectTrigger className="h-10 border-slate-200 rounded-xl bg-slate-50">
                          <SelectValue placeholder="Select school" />
                        </SelectTrigger>
                        <SelectContent>
                          {schools.length ? schools.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>) : <SelectItem value="-" disabled>No schools</SelectItem>}
                        </SelectContent>
                      </Select>
                    ) : (
                      <InfoRow icon={Building2} label="School" value={billing.school?.name || (billing.user ? `${billing.user.firstName} ${billing.user.lastName}` : 'N/A')} />
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-slate-400 font-medium">Package</Label>
                    {editing ? (
                      <Select value={formData.packageId} onValueChange={v => handleInputChange('packageId', v)}>
                        <SelectTrigger className="h-10 border-slate-200 rounded-xl bg-slate-50">
                          <SelectValue placeholder="Select package" />
                        </SelectTrigger>
                        <SelectContent>
                          {packages.filter(p => p.isActive).map(p => <SelectItem key={p.id} value={p.id}>{p.name} — {formatCurrency(p.price)}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    ) : (
                      <InfoRow icon={Package} label="Package" value={billing.package.name} />
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs text-slate-400 font-medium">Start Date</Label>
                      {editing ? (
                        <Input type="date" value={formData.startDate} onChange={e => handleInputChange('startDate', e.target.value)} className="h-10 border-slate-200 rounded-xl bg-slate-50" />
                      ) : (
                        <InfoRow icon={Calendar} label="Start" value={formatDate(billing.startDate)} />
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-slate-400 font-medium">End Date</Label>
                      {editing ? (
                        <Input type="date" value={formData.endDate} onChange={e => handleInputChange('endDate', e.target.value)} className="h-10 border-slate-200 rounded-xl bg-slate-50" />
                      ) : (
                        <InfoRow icon={Calendar} label="End" value={formatDate(billing.endDate)} />
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs text-slate-400 font-medium">Amount</Label>
                      {editing ? (
                        <Input type="number" step="0.01" value={formData.amount} onChange={e => handleInputChange('amount', e.target.value)} className="h-10 border-slate-200 rounded-xl bg-slate-50" />
                      ) : (
                        <InfoRow icon={DollarSign} label="Amount" value={formatCurrency(billing.amount)} />
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-slate-400 font-medium">Status</Label>
                      {editing ? (
                        <Select value={formData.status} onValueChange={v => handleInputChange('status', v)}>
                          <SelectTrigger className="h-10 border-slate-200 rounded-xl bg-slate-50">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {['ACTIVE', 'PENDING', 'EXPIRED', 'CANCELLED'].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      ) : (
                        <StatusBadge status={billing.status} />
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs text-slate-400 font-medium">Type</Label>
                      {editing ? (
                        <Select value={formData.type} onValueChange={v => handleInputChange('type', v)}>
                          <SelectTrigger className="h-10 border-slate-200 rounded-xl bg-slate-50">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {['SUBSCRIPTION', 'ONE_TIME', 'RENEWAL', 'UPGRADE'].map(t => <SelectItem key={t} value={t}>{t.replace('_', ' ')}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      ) : (
                        <InfoRow icon={Tag} label="Type" value={billing.type.replace('_', ' ')} />
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-slate-400 font-medium">Payment Method</Label>
                      {editing ? (
                        <Select value={formData.paymentMethod} onValueChange={v => handleInputChange('paymentMethod', v)}>
                          <SelectTrigger className="h-10 border-slate-200 rounded-xl bg-slate-50">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {['MANUAL', 'MPESA', 'BANK_TRANSFER', 'CREDIT_CARD', 'CASH'].map(p => <SelectItem key={p} value={p}>{p.replace('_', ' ')}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      ) : (
                        <InfoRow icon={CreditCard} label="Payment" value={billing.paymentMethod.replace('_', ' ')} />
                      )}
                    </div>
                  </div>
                  {billing.transactionId && (
                    <div className="space-y-1.5">
                      <Label className="text-xs text-slate-400 font-medium">Transaction ID</Label>
                      {editing ? (
                        <Input value={formData.transactionId} onChange={e => handleInputChange('transactionId', e.target.value)} className="h-10 border-slate-200 rounded-xl bg-slate-50 font-mono text-xs" />
                      ) : (
                        <InfoRow icon={Hash} label="Transaction" value={billing.transactionId} />
                      )}
                    </div>
                  )}
                  {billing.notes && (
                    <div className="space-y-1.5">
                      <Label className="text-xs text-slate-400 font-medium">Notes</Label>
                      {editing ? (
                        <Textarea value={formData.notes} onChange={e => handleInputChange('notes', e.target.value)} className="border-slate-200 rounded-xl bg-slate-50" rows={3} />
                      ) : (
                        <p className="text-sm text-slate-700 bg-slate-50 rounded-xl px-3 py-2">{billing.notes}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right column */}
            <div className="space-y-6">
              {/* School / User Info */}
              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
                <div className="px-5 py-3.5 border-b border-slate-100">
                  <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-indigo-500" /> {billing.school ? 'School Information' : 'User Information'}
                  </h3>
                </div>
                <div className="px-5 py-4 space-y-3">
                  {billing.school ? (
                    <>
                      <InfoRow icon={Building2} label="School" value={billing.school.name} />
                      <InfoRow icon={MapPin} label="Address" value={billing.school.address} />
                      {billing.school.phone && <InfoRow icon={Phone} label="Phone" value={billing.school.phone} />}
                      {billing.school.email && <InfoRow icon={Mail} label="Email" value={billing.school.email} />}
                      {billing.school.schoolAdmin && (
                        <InfoRow icon={User} label="Admin" value={`${billing.school.schoolAdmin.user.firstName} ${billing.school.schoolAdmin.user.lastName} (${billing.school.schoolAdmin.user.email})`} />
                      )}
                    </>
                  ) : billing.user ? (
                    <>
                      <InfoRow icon={User} label="Name" value={`${billing.user.firstName} ${billing.user.lastName}`} />
                      <InfoRow icon={Mail} label="Email" value={billing.user.email} />
                    </>
                  ) : null}
                </div>
              </div>

              {/* Package Info */}
              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
                <div className="px-5 py-3.5 border-b border-slate-100">
                  <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                    <Package className="w-4 h-4 text-indigo-500" /> Package Details
                  </h3>
                </div>
                <div className="px-5 py-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-slate-800">{billing.package.name}</span>
                    <span className="text-sm font-bold text-indigo-600">{formatCurrency(billing.package.price)}</span>
                  </div>
                  {billing.package.description && <p className="text-xs text-slate-500">{billing.package.description}</p>}
                  <InfoRow icon={Clock} label="Duration" value={`${billing.package.duration} months`} />
                  {billing.package.features && billing.package.features.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-slate-500 mb-2">Features</p>
                      <div className="space-y-1.5">
                        {billing.package.features.map((f, i) => (
                          <div key={i} className="flex items-center gap-2 text-xs text-slate-600">
                            <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />
                            {f}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Subscription Status */}
              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
                <div className="px-5 py-3.5 border-b border-slate-100">
                  <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-indigo-500" /> Subscription Status
                  </h3>
                </div>
                <div className="px-5 py-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">Status</span>
                    <StatusBadge status={billing.status} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">Days Remaining</span>
                    <span className={`text-sm font-semibold ${isExpired ? 'text-red-600' : daysRemaining < 30 ? 'text-amber-600' : 'text-emerald-600'}`}>
                      {isExpired ? 'Expired' : `${daysRemaining} days`}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">Created</span>
                    <span className="text-sm text-slate-700">{formatDate(billing.createdAt)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">Last Updated</span>
                    <span className="text-sm text-slate-700">{formatDate(billing.updatedAt)}</span>
                  </div>

                  {canRenew && !renewing && (
                    <div className="pt-3 border-t border-slate-100">
                      <button onClick={() => setRenewing(true)}
                        className="w-full flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-sm font-semibold rounded-xl transition-all shadow-sm">
                        <RefreshCw className="w-4 h-4" /> Renew Subscription
                      </button>
                    </div>
                  )}

                  {renewing && (
                    <div className="pt-3 border-t border-slate-100 space-y-3">
                      <p className="text-xs font-medium text-slate-600">Select a plan to renew:</p>
                      <select value={renewPackageId} onChange={e => setRenewPackageId(e.target.value)}
                        className="w-full h-10 px-3 border border-slate-200 rounded-xl text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500">
                        <option value="">Choose a package...</option>
                        {packages.filter(p => p.isActive).map(p => <option key={p.id} value={p.id}>{p.name} — {formatCurrency(p.price)}/mo</option>)}
                      </select>
                      <div className="flex gap-2">
                        <button onClick={handleRenew} disabled={!renewPackageId || renewLoading}
                          className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-sm font-semibold rounded-xl transition-all disabled:opacity-60 shadow-sm">
                          {renewLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />} Confirm Renewal
                        </button>
                        <button onClick={() => { setRenewing(false); setRenewPackageId('') }} disabled={renewLoading}
                          className="px-5 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition-all disabled:opacity-60">
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
