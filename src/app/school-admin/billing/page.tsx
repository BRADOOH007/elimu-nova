'use client'

import { useState, useEffect } from 'react'
import { useToast } from "@/hooks/use-toast"
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  CreditCard, Calendar, Crown, Clock, CheckCircle, AlertTriangle,
  Download, RefreshCw, DollarSign, Users, GraduationCap,
  TrendingUp, FileText, Sparkles,
  Loader2, Shield, ArrowRight
} from 'lucide-react'

function ProgressBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.min(Math.round((value / max) * 100), 100) : 0
  return <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden"><div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${pct}%` }} /></div>
}

export default function SchoolAdminBilling() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  const fetchData = async () => {
    try { setLoading(true); setError(null); const r = await fetch('/api/school-admin/billing-data'); if (r.ok) setData(await r.json()); else setError(r.status === 403 ? 'Permission denied' : 'Failed to load') } catch { setError('Network error') } finally { setLoading(false) }
  }

  useEffect(() => { fetchData() }, [])

  if (loading) return <div className="flex items-center justify-center min-h-[70vh]"><Loader2 className="w-8 h-8 animate-spin text-slate-400" /></div>

  const sub = data?.currentSubscription || data?.subscription || null
  const usage = data?.usage || {}
  const invoices = data?.invoices || []
  const teacherCount = data?.teachers?.length || usage?.teachers || 0
  const studentCount = data?.students?.length || usage?.students || 0
  const aiCredits = usage?.aiGenerations || 0
  const aiCreditLimit = 10000

  const isPremium = sub?.status === 'ACTIVE'
  const isTrial = sub?.status === 'TRIAL' && sub?.endDate
  const planMaxTeachers = sub?.package?.maxTeachers || 15
  const planMaxStudents = sub?.package?.maxStudents || 500
  const planName = sub?.package?.name || sub?.packageName || 'Free Trial'
  const planPrice = sub?.amount || sub?.package?.price || 0
  const renewDate = sub?.endDate ? new Date(sub.endDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : null
  const daysLeft = sub?.endDate ? Math.max(0, Math.ceil((new Date(sub.endDate).getTime() - Date.now()) / 86400000)) : 0

  const formatCurrency = (amt: number) => amt === 0 ? 'KES 0.00' : Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', minimumFractionDigits: 2 }).format(amt)

  const StatusBadge = ({ tier, active }: { tier: string; active?: boolean }) => (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-semibold rounded-full ${active !== false ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
      {active !== false ? <CheckCircle className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
      {tier} Tier · {active !== false ? 'Active' : 'Inactive'}
    </span>
  )

  const getCardGradient = () => {
    if (isPremium) return 'bg-gradient-to-br from-indigo-50 via-violet-50 to-purple-50'
    if (isTrial) return 'bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50'
    return 'bg-gradient-to-br from-slate-50 to-slate-100'
  }

  const getIconGradient = () => {
    if (isPremium) return 'bg-gradient-to-br from-indigo-500 to-violet-500'
    if (isTrial) return 'bg-gradient-to-br from-amber-500 to-orange-500'
    return 'bg-gradient-to-br from-slate-400 to-slate-500'
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Billing & Subscription</h1>
          <p className="text-sm text-slate-500 mt-1">Manage your school's plan, payments, and usage</p>
        </div>
        <Button variant="outline" onClick={fetchData} className="bg-white"><RefreshCw className="w-4 h-4 mr-2" />Refresh</Button>
      </div>

      {error && (
        <Card className="border-red-100 bg-red-50/50"><CardContent className="text-center py-12"><AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-3" /><p className="text-slate-700 font-semibold">{error}</p><Button variant="outline" onClick={fetchData} className="mt-4">Retry</Button></CardContent></Card>
      )}

      {!error && (
        <>
          {/* Subscription Card */}
          <Card className={`overflow-hidden border-0 shadow-lg ${getCardGradient()}`}>
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                <div className="flex items-start gap-4">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${getIconGradient()}`}>
                    <Crown className="w-7 h-7 text-white" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h2 className="text-lg font-bold text-slate-900">{planName}</h2>
                      <StatusBadge tier={isPremium ? 'Premium' : isTrial ? 'Trial' : 'Inactive'} active={isPremium} />
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-600">
                      <span className="flex items-center gap-1"><DollarSign className="w-4 h-4" />{formatCurrency(planPrice)} / Term</span>
                      {renewDate && <span className="flex items-center gap-1"><Calendar className="w-4 h-4" />Renews: {renewDate}</span>}
                      {isTrial && daysLeft > 0 && <span className="flex items-center gap-1 font-semibold text-amber-600"><Clock className="w-4 h-4" />{daysLeft} Days Left</span>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {isTrial ? (
                    <>
                      <Button className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700" onClick={() => toast({ title: 'Upgrade', description: 'Plan comparison & checkout modal coming soon' })}>
                        <Crown className="w-4 h-4 mr-1.5" />Upgrade to Premium
                      </Button>
                      <Button variant="outline" className="bg-white border-slate-200" onClick={() => toast({ title: 'Contact', description: 'Contact sales for custom enterprise plans' })}>
                        <ArrowRight className="w-4 h-4 mr-1.5" />Talk to Sales
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button variant="outline" className="bg-white border-slate-200 hover:bg-slate-50" onClick={() => toast({ title: 'Manage', description: 'Subscription management coming soon' })}>
                        Manage Subscription
                      </Button>
                      <Button className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700" onClick={() => toast({ title: 'Invoice', description: 'Tax invoice download coming soon' })}>
                        <Download className="w-4 h-4 mr-1.5" />Download Tax Invoice
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Usage Meters */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border border-slate-100 shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center"><Users className="w-5 h-5 text-indigo-600" /></div>
                  <div className="min-w-0">
                    <p className="text-xs text-slate-500">Active Teachers</p>
                    <p className="text-lg font-bold text-slate-900">{teacherCount}<span className="text-sm font-normal text-slate-400">/{planMaxTeachers}</span></p>
                  </div>
                </div>
                <ProgressBar value={teacherCount} max={planMaxTeachers} color="bg-indigo-500" />
                <p className="text-[10px] text-slate-400 mt-1.5">{Math.round((teacherCount / planMaxTeachers) * 100)}% of {planMaxTeachers} seats</p>
              </CardContent>
            </Card>
            <Card className="border border-slate-100 shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center"><GraduationCap className="w-5 h-5 text-emerald-600" /></div>
                  <div className="min-w-0">
                    <p className="text-xs text-slate-500">Active Students</p>
                    <p className="text-lg font-bold text-slate-900">{studentCount}<span className="text-sm font-normal text-slate-400">/{planMaxStudents}</span></p>
                  </div>
                </div>
                <ProgressBar value={studentCount} max={planMaxStudents} color="bg-emerald-500" />
                <p className="text-[10px] text-slate-400 mt-1.5">{Math.round((studentCount / planMaxStudents) * 100)}% of {planMaxStudents} capacity</p>
              </CardContent>
            </Card>
            <Card className="border border-slate-100 shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center"><Sparkles className="w-5 h-5 text-amber-600" /></div>
                  <div className="min-w-0"><p className="text-xs text-slate-500">AI Credits Used</p><p className="text-lg font-bold text-slate-900">{aiCredits.toLocaleString()}<span className="text-sm font-normal text-slate-400">/{aiCreditLimit.toLocaleString()}</span></p></div>
                </div>
                <ProgressBar value={aiCredits} max={aiCreditLimit} color="bg-amber-500" />
                <p className="text-[10px] text-slate-400 mt-1.5">{Math.round((aiCredits / aiCreditLimit) * 100)}% of monthly allowance</p>
              </CardContent>
            </Card>
            <Card className="border border-slate-100 shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center"><CreditCard className="w-5 h-5 text-violet-600" /></div>
                  <div>
                    <p className="text-xs text-slate-500">Payment Method</p>
                    <p className="text-sm font-bold text-slate-900">M-Pesa Express</p>
                    <p className="text-[10px] text-slate-400">Paybill 247247</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="w-full text-xs" onClick={() => toast({ title: 'Invoice', description: 'Invoice download coming soon' })}>
                  <Download className="w-3 h-3 mr-1" />Download Invoice
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Invoice History */}
          <Card className="border-slate-100 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2"><FileText className="w-5 h-5 text-indigo-600" />Recent Invoices & Receipts</CardTitle>
            </CardHeader>
            <CardContent>
              {invoices.length === 0 ? (
                <div className="text-center py-10">
                  <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-sm font-semibold text-slate-700">No invoices yet</p>
                  <p className="text-xs text-slate-400 mt-1">Invoices will appear once payments are processed</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="border-b border-slate-100 text-left text-xs font-semibold uppercase text-slate-500"><th className="py-3 px-4">Invoice ID</th><th className="py-3 px-4">Date</th><th className="py-3 px-4">Amount</th><th className="py-3 px-4">Method</th><th className="py-3 px-4">Status</th><th className="py-3 px-4 text-right">Action</th></tr></thead>
                    <tbody>
                      {invoices.map((inv: any, i: number) => (
                        <tr key={inv.id || i} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                          <td className="py-3 px-4 font-mono text-xs text-indigo-600 font-semibold">#{inv.id?.slice(-8) || `INV-${2026}-${String(i + 1).padStart(3, '0')}`}</td>
                          <td className="py-3 px-4 text-slate-500">{inv.date ? new Date(inv.date).toLocaleDateString() : (inv.period || `Term ${i + 1} 2026`)}</td>
                          <td className="py-3 px-4 font-medium text-slate-800">{formatCurrency(inv.amount || inv.totalAmount || planPrice)}</td>
                          <td className="py-3 px-4 text-slate-500">{inv.paymentMethod || 'M-Pesa'}</td>
                          <td className="py-3 px-4">{inv.status === 'PAID' || inv.status === 'paid' ? <span className="inline-flex px-2 py-0.5 text-[10px] font-semibold rounded-full bg-emerald-100 text-emerald-700">Paid</span> : <span className="inline-flex px-2 py-0.5 text-[10px] font-semibold rounded-full bg-amber-100 text-amber-700">Pending</span>}</td>
                          <td className="py-3 px-4 text-right">
                            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => toast({ title: 'Receipt', description: 'PDF receipt download coming soon' })}>
                              <Download className="w-3 h-3 mr-1" />PDF
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
