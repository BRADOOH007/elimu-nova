'use client'

import { useState, useEffect } from 'react'
import { useToast } from "@/hooks/use-toast"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

import { 
  CreditCard, 
  Calendar, 
  Crown, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  Download,
  RefreshCw,
  DollarSign,
  Users,
  BookOpen,
  Loader2,
  School,
  GraduationCap,
  TrendingUp,
  FileText,
  Building,
  ArrowRight,
  Mail
} from 'lucide-react'

export default function SchoolAdminBilling() {
  const [billingData, setBillingData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  const fetchBilling = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch('/api/school-admin/billing-data')
      if (response.ok) {
        const data = await response.json()
        setBillingData(data)
      } else if (response.status === 403) {
        setError('You do not have permission to view billing information.')
      } else {
        setError('Failed to load billing information.')
      }
    } catch (err) {
      setError('Failed to load billing information.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchBilling() }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-800'
      case 'TRIAL': return 'bg-blue-100 text-blue-800'
      case 'TRIAL_EXPIRED': return 'bg-red-100 text-red-800'
      case 'EXPIRED': return 'bg-red-100 text-red-800'
      case 'CANCELLED': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ACTIVE': return <CheckCircle className="w-4 h-4" />
      case 'TRIAL': return <Crown className="w-4 h-4" />
      case 'TRIAL_EXPIRED': return <AlertTriangle className="w-4 h-4" />
      case 'EXPIRED': return <AlertTriangle className="w-4 h-4" />
      case 'CANCELLED': return <AlertTriangle className="w-4 h-4" />
      default: return <Clock className="w-4 h-4" />
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Billing</h1>
          <p className="text-gray-600 mt-1">View your school's subscription and billing information.</p>
        </div>
        <Card className="bg-white shadow-lg border-0">
          <CardContent className="text-center py-12">
            <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Unable to Load Billing</h3>
            <p className="text-gray-500 mb-4">{error}</p>
            <Button onClick={fetchBilling} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const subscription = billingData?.currentSubscription || billingData?.subscription
  const usage = billingData?.usage || {}
  const invoices = billingData?.invoices || []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Billing</h1>
          <p className="text-gray-600 mt-1">
            View your school's subscription and usage details.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={fetchBilling} className="bg-white">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Current Subscription Status (read-only) */}
      <Card className="bg-gradient-to-br from-white via-blue-50 to-purple-50 shadow-lg border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="w-5 h-5 text-purple-600" />
            School Subscription
          </CardTitle>
          <CardDescription>
            Your school's current subscription status — contact the platform administrator for changes.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {subscription ? (
            <>
              <div className="flex items-center justify-between p-4 bg-white/70 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                    {getStatusIcon(subscription.status)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {subscription.packageName || subscription.package?.name || 'School Plan'}
                    </h3>
                    <p className="text-sm text-gray-600 flex items-center gap-1">
                      <School className="w-3 h-3" />
                      School-wide Subscription
                    </p>
                  </div>
                </div>
                <Badge className={getStatusColor(subscription.status)}>
                  {getStatusIcon(subscription.status)}
                  <span className="ml-1">{subscription.status?.replace('_', ' ') || 'ACTIVE'}</span>
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="p-4 bg-white/70 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-gray-700">
                      {subscription.isTrial ? 'Trial Ends' : 'Renewal Date'}
                    </span>
                  </div>
                  <p className="text-lg font-semibold text-gray-900">
                    {subscription.endDate
                      ? new Date(subscription.endDate).toLocaleDateString()
                      : subscription.trialEndsAt
                      ? new Date(subscription.trialEndsAt).toLocaleDateString()
                      : 'N/A'}
                  </p>
                </div>
                <div className="p-4 bg-white/70 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-4 h-4 text-orange-600" />
                    <span className="text-sm font-medium text-gray-700">Days Remaining</span>
                  </div>
                  <p className={`text-lg font-semibold ${
                    subscription.daysRemaining <= 3 ? 'text-red-600' :
                    subscription.daysRemaining <= 7 ? 'text-orange-600' :
                    'text-green-600'
                  }`}>
                    {subscription.daysRemaining ?? 'N/A'} days
                  </p>
                </div>
                <div className="p-4 bg-white/70 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium text-gray-700">Plan Type</span>
                  </div>
                  <p className="text-lg font-semibold text-gray-900">
                    {subscription.isTrial ? 'Free Trial' : subscription.packageName || subscription.package?.name || 'Premium'}
                  </p>
                </div>
                <div className="p-4 bg-white/70 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="w-4 h-4 text-purple-600" />
                    <span className="text-sm font-medium text-gray-700">Status</span>
                  </div>
                  <p className={`text-lg font-semibold ${
                    subscription.isActive ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {subscription.isActive ? 'Active' : 'Inactive'}
                  </p>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gradient-to-br from-gray-400 to-gray-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Building className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No Active Subscription
              </h3>
              <p className="text-gray-600 mb-4">
                Your school does not have an active subscription. Please contact the platform administrator to set one up.
              </p>
              <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                <Mail className="w-4 h-4" />
                <span>Contact your administrator for assistance</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* School Usage Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-white shadow-lg border-0 hover:shadow-xl transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-blue-600" />
              Teachers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Active Teachers</span>
                <span className="font-semibold text-2xl text-blue-600">
                  {usage.teachers?.active || 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Plan Limit</span>
                <span className="font-semibold">
                  {usage.teachers?.limit || 'Unlimited'}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full" 
                  style={{ width: `${Math.min(usage.teachers?.percentage || 0, 100)}%` }}
                ></div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-lg border-0 hover:shadow-xl transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="w-5 h-5 text-green-600" />
              Students
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Active Students</span>
                <span className="font-semibold text-2xl text-green-600">
                  {usage.students?.active || 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Plan Limit</span>
                <span className="font-semibold">
                  {usage.students?.limit || 'Unlimited'}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-600 h-2 rounded-full" 
                  style={{ width: `${Math.min(usage.students?.percentage || 0, 100)}%` }}
                ></div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-lg border-0 hover:shadow-xl transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-purple-600" />
              Usage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Lesson Plans</span>
                <span className="font-semibold">
                  {usage.lessonPlans?.toLocaleString() || 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">AI Generations</span>
                <span className="font-semibold">
                  {usage.aiGenerations?.toLocaleString() || 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">This Month</span>
                <span className={`font-semibold ${
                  usage.growthRate?.startsWith('+') ? 'text-green-600' : 
                  usage.growthRate?.startsWith('-') ? 'text-red-600' : 'text-purple-600'
                }`}>
                  {usage.growthRate || '0%'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-lg border-0 hover:shadow-xl transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-orange-600" />
              Analytics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Engagement</span>
                <span className="font-semibold text-orange-600">
                  {usage.analytics?.engagement || '0%'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Satisfaction</span>
                <span className="font-semibold text-orange-600">
                  {usage.analytics?.satisfaction || 'N/A'}
                </span>
              </div>
              <div className="text-xs text-gray-400 mt-2">
                Data refreshes daily
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Invoices (read-only) */}
      <Card className="bg-white shadow-lg border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-purple-600" />
            Recent Invoices
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {invoices.length > 0 ? (
            <>
              <div className="space-y-3">
                {invoices.slice(0, 5).map((invoice: any) => (
                  <div key={invoice.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{invoice.period || invoice.invoiceNumber || `Invoice #${invoice.id.slice(0, 8)}`}</p>
                      <p className="text-sm text-gray-600">
                        {invoice.date ? new Date(invoice.date).toLocaleDateString() : new Date(invoice.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">
                        ${(invoice.totalAmount ?? invoice.amount ?? 0).toFixed(2)}
                      </p>
                      <Badge className={
                        (invoice.status === 'paid' || invoice.status === 'PAID')
                          ? 'bg-green-100 text-green-800'
                          : (invoice.status === 'pending' || invoice.status === 'PENDING')
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }>
                        {(invoice.status || 'N/A').charAt(0).toUpperCase() + (invoice.status || 'N/A').slice(1).toLowerCase()}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-6">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">No invoices available</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
