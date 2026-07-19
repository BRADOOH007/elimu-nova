'use client'

import { useState } from 'react'
import { useSubscription } from '@/hooks/use-subscription'
import { useToast } from "@/hooks/use-toast"
import { useSchoolBillingData } from '@/hooks/use-school-billing-data'
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
  Zap,
  Download,
  RefreshCw,
  Settings,
  ArrowRight,
  DollarSign,
  Users,
  BookOpen,
  Loader2,
  School,
  GraduationCap,
  TrendingUp,
  FileText,
  Building
} from 'lucide-react'
import Link from 'next/link'

export default function SchoolAdminBilling() {
  const { subscription, context, hasAccess, isTrialEligible, startTrial, createCheckout, refetch } = useSubscription()
  const { billingData, loading: billingLoading, error: billingError, refetch: refetchBilling } = useSchoolBillingData()
  const [loading, setLoading] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [paymentLoading, setPaymentLoading] = useState<string | null>(null)
  const { toast } = useToast()

  const handleStartTrial = async () => {
    setLoading('trial')
    try {
      const success = await startTrial()
      if (success) {
        await refetch()
      }
    } catch (error) {
      console.error('Failed to start trial:', error)
    } finally {
      setLoading(null)
    }
  }

  const handleUpgrade = async (packageId: string) => {
    setLoading(packageId)
    try {
      await createCheckout(packageId)
    } catch (error) {
      console.error('Failed to create checkout:', error)
    } finally {
      setLoading(null)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      await Promise.all([refetch(), refetchBilling()])
    } finally {
      setRefreshing(false)
    }
  }

  const handlePaymentMethod = async (action: string, paymentMethodId?: string) => {
    setPaymentLoading(action)
    try {
      const response = await fetch('/api/school-admin/payment-methods', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action, paymentMethodId })
      })

      if (!response.ok) {
        throw new Error('Failed to manage payment method')
      }

      const result = await response.json()
      
      if (action === 'add' && result.setupUrl) {
        // Redirect to Stripe setup page
        window.location.href = result.setupUrl
      } else {
        // Refresh billing data to show updates
        await refetchBilling()
        toast({ title: result.message || 'Payment method updated successfully' })
      }
    } catch (error) {
      console.error('Payment method error:', error)
      toast({ title: 'Failed to update payment method', variant: 'destructive' })
    } finally {
      setPaymentLoading(null)
    }
  }

  const handleDownloadInvoices = async () => {
    setPaymentLoading('invoices')
    try {
      const response = await fetch('/api/school-admin/invoices')
      
      if (!response.ok) {
        throw new Error('Failed to fetch invoices')
      }

      const result = await response.json()
      
      toast({ title: `Found ${result.invoices.length} invoice(s) ready for download` })
    } catch (error) {
      console.error('Invoice fetch error:', error)
      toast({ title: 'Failed to fetch invoices', variant: 'destructive' })
    } finally {
      setPaymentLoading(null)
    }
  }

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
      case 'TRIAL': return <Zap className="w-4 h-4" />
      case 'TRIAL_EXPIRED': return <AlertTriangle className="w-4 h-4" />
      case 'EXPIRED': return <AlertTriangle className="w-4 h-4" />
      case 'CANCELLED': return <AlertTriangle className="w-4 h-4" />
      default: return <Clock className="w-4 h-4" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">School Billing & Subscription</h1>
          <p className="text-gray-600 mt-1">
            Manage your school's subscription, billing, and user access.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={refreshing}
            className="bg-white"
          >
            {refreshing ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4 mr-2" />
            )}
            Refresh
          </Button>
          <Link href="/pricing">
            <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
              <Crown className="w-4 h-4 mr-2" />
              View Plans
            </Button>
          </Link>
        </div>
      </div>

      {/* Current Subscription Status */}
      <Card className="bg-gradient-to-br from-white via-blue-50 to-purple-50 shadow-lg border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="w-5 h-5 text-purple-600" />
            School Subscription
          </CardTitle>
          <CardDescription>
            Your school's current subscription and access details
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {subscription ? (
            <>
              {/* Status Overview */}
              <div className="flex items-center justify-between p-4 bg-white/70 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                    {getStatusIcon(subscription.status)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {subscription.packageName || 'School Plan'}
                    </h3>
                    <p className="text-sm text-gray-600 flex items-center gap-1">
                      <School className="w-3 h-3" />
                      School-wide Subscription
                    </p>
                  </div>
                </div>
                <Badge className={getStatusColor(subscription.status)}>
                  {getStatusIcon(subscription.status)}
                  <span className="ml-1">{subscription.status.replace('_', ' ')}</span>
                </Badge>
              </div>

              {/* Subscription Details */}
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
                      : 'N/A'
                    }
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
                    {subscription.daysRemaining} days
                  </p>
                </div>

                <div className="p-4 bg-white/70 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium text-gray-700">Plan Type</span>
                  </div>
                  <p className="text-lg font-semibold text-gray-900">
                    {subscription.isTrial ? 'Free Trial' : subscription.packageName || 'Premium'}
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

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                {subscription.isTrial ? (
                  <Button 
                    onClick={() => handleUpgrade(billingData?.upgradePackage?.id || 'cmi35uxwd0001q69c8ton56qx')}
                    disabled={loading === (billingData?.upgradePackage?.id || 'cmi35uxwd0001q69c8ton56qx')}
                    className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                  >
                    {loading === (billingData?.upgradePackage?.id || 'cmi35uxwd0001q69c8ton56qx') ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Crown className="w-4 h-4 mr-2" />
                    )}
                    Upgrade to {billingData?.upgradePackage?.name || 'Premium'}
                  </Button>
                ) : (
                  <Button 
                    onClick={() => handleUpgrade(billingData?.currentSubscription?.packageId || billingData?.upgradePackage?.id || 'cmi35uxwd0001q69c8ton56qx')}
                    disabled={loading === (billingData?.currentSubscription?.packageId || billingData?.upgradePackage?.id || 'cmi35uxwd0001q69c8ton56qx')}
                    className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                  >
                    {loading === (billingData?.currentSubscription?.packageId || billingData?.upgradePackage?.id || 'cmi35uxwd0001q69c8ton56qx') ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <RefreshCw className="w-4 h-4 mr-2" />
                    )}
                    Renew Subscription
                  </Button>
                )}
                
                <Button variant="outline" className="bg-white/80">
                  <Download className="w-4 h-4 mr-2" />
                  Download Invoice
                </Button>
                
                <Button variant="outline" className="bg-white/80">
                  <Settings className="w-4 h-4 mr-2" />
                  Manage Payment
                </Button>
              </div>
            </>
          ) : isTrialEligible ? (
            /* No Subscription - Trial Eligible */
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Start School Free Trial
              </h3>
              <p className="text-gray-600 mb-6">
                Get 7 days of full access to all premium features for your entire school. No credit card required!
              </p>
              <Button 
                onClick={handleStartTrial}
                disabled={loading === 'trial'}
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
              >
                {loading === 'trial' ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Zap className="w-4 h-4 mr-2" />
                )}
                Start School Trial
              </Button>
            </div>
          ) : (
            /* No Subscription - Not Eligible */
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No Active School Subscription
              </h3>
              <p className="text-gray-600 mb-6">
                Subscribe to a school plan to provide access to all teachers and students in your school.
              </p>
              <Link href="/pricing">
                <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                  <Crown className="w-4 h-4 mr-2" />
                  View School Plans
                </Button>
              </Link>
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
            {billingLoading ? (
              <div className="space-y-3">
                <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-2 bg-gray-200 rounded animate-pulse"></div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Active Teachers</span>
                  <span className="font-semibold text-2xl text-blue-600">
                    {billingData?.usage.teachers.active || 0}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Plan Limit</span>
                  <span className="font-semibold">
                    {billingData?.usage.teachers.limit || 'Unlimited'}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full" 
                    style={{ width: `${Math.min(billingData?.usage.teachers.percentage || 0, 100)}%` }}
                  ></div>
                </div>
              </div>
            )}
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
            {billingLoading ? (
              <div className="space-y-3">
                <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-2 bg-gray-200 rounded animate-pulse"></div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Active Students</span>
                  <span className="font-semibold text-2xl text-green-600">
                    {billingData?.usage.students.active || 0}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Plan Limit</span>
                  <span className="font-semibold">
                    {billingData?.usage.students.limit || 'Unlimited'}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-600 h-2 rounded-full" 
                    style={{ width: `${Math.min(billingData?.usage.students.percentage || 0, 100)}%` }}
                  ></div>
                </div>
              </div>
            )}
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
            {billingLoading ? (
              <div className="space-y-3">
                <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Lesson Plans</span>
                  <span className="font-semibold">
                    {billingData?.usage.lessonPlans?.toLocaleString() || 0}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">AI Generations</span>
                  <span className="font-semibold">
                    {billingData?.usage.aiGenerations?.toLocaleString() || 0}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">This Month</span>
                  <span className={`font-semibold ${
                    billingData?.usage.growthRate?.startsWith('+') ? 'text-green-600' : 
                    billingData?.usage.growthRate?.startsWith('-') ? 'text-red-600' : 'text-purple-600'
                  }`}>
                    {billingData?.usage.growthRate || '0%'}
                  </span>
                </div>
              </div>
            )}
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
            {billingLoading ? (
              <div className="space-y-3">
                <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Engagement</span>
                  <span className="font-semibold text-orange-600">
                    {billingData?.analytics.engagement || '0%'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Satisfaction</span>
                  <span className="font-semibold text-orange-600">
                    {billingData?.analytics.satisfaction || 'N/A'}
                  </span>
                </div>
                <Button variant="outline" size="sm" className="w-full">
                  <FileText className="w-4 h-4 mr-2" />
                  View Report
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Payment & Billing */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-white shadow-lg border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-green-600" />
              Payment Method
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {billingLoading ? (
              <div className="space-y-3">
                <div className="h-16 bg-gray-200 rounded-lg animate-pulse"></div>
                <div className="flex gap-2">
                  <div className="h-10 bg-gray-200 rounded flex-1 animate-pulse"></div>
                  <div className="h-10 bg-gray-200 rounded flex-1 animate-pulse"></div>
                </div>
              </div>
            ) : billingData?.paymentMethod ? (
              <>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-10 h-10 bg-blue-100 rounded flex items-center justify-center">
                    <CreditCard className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">
                      •••• •••• •••• {billingData.paymentMethod.last4}
                    </p>
                    <p className="text-sm text-gray-600">
                      Expires {billingData.paymentMethod.expiryMonth}/{billingData.paymentMethod.expiryYear} • {billingData.paymentMethod.brand.charAt(0).toUpperCase() + billingData.paymentMethod.brand.slice(1)}
                    </p>
                  </div>
                  {billingData.paymentMethod.isPrimary && (
                    <Badge className="bg-green-100 text-green-800">Primary</Badge>
                  )}
                </div>
                
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => handlePaymentMethod('update', billingData.paymentMethod.id)}
                    disabled={paymentLoading === 'update'}
                  >
                    {paymentLoading === 'update' ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Settings className="w-4 h-4 mr-2" />
                    )}
                    Update
                  </Button>
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => handlePaymentMethod('add')}
                    disabled={paymentLoading === 'add'}
                  >
                    {paymentLoading === 'add' ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Settings className="w-4 h-4 mr-2" />
                    )}
                    Add New
                  </Button>
                </div>
              </>
            ) : (
              <div className="text-center py-6">
                <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600 mb-4">No payment method on file</p>
                <Button 
                  variant="outline"
                  onClick={() => handlePaymentMethod('add')}
                  disabled={paymentLoading === 'add'}
                >
                  {paymentLoading === 'add' ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Settings className="w-4 h-4 mr-2" />
                  )}
                  Add Payment Method
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-white shadow-lg border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-purple-600" />
              Recent Invoices
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {billingLoading ? (
              <div className="space-y-3">
                <div className="h-16 bg-gray-200 rounded-lg animate-pulse"></div>
                <div className="h-16 bg-gray-200 rounded-lg animate-pulse"></div>
                <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
              </div>
            ) : billingData?.invoices && billingData.invoices.length > 0 ? (
              <>
                <div className="space-y-3">
                  {billingData.invoices.slice(0, 2).map((invoice) => (
                    <div key={invoice.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">{invoice.period}</p>
                        <p className="text-sm text-gray-600">
                          Paid on {new Date(invoice.date).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">
                          ${invoice.amount.toFixed(2)}
                        </p>
                        <Badge className={
                          invoice.status === 'paid' 
                            ? 'bg-green-100 text-green-800'
                            : invoice.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }>
                          {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>

                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={handleDownloadInvoices}
                  disabled={paymentLoading === 'invoices'}
                >
                  {paymentLoading === 'invoices' ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4 mr-2" />
                  )}
                  View All Invoices
                </Button>
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

      {/* Upgrade Prompt */}
      {subscription?.isTrial && (
        <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-purple-900 mb-2">
                  Upgrade Your School Plan
                </h3>
                <p className="text-purple-700 mb-4">
                  Get unlimited access for all teachers and students, advanced analytics, and priority support.
                </p>
                <ul className="text-sm text-purple-600 space-y-1">
                  <li>• Unlimited teachers and students</li>
                  <li>• Advanced school analytics and reporting</li>
                  <li>• Priority support and training</li>
                  <li>• Custom integrations and API access</li>
                </ul>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-900 mb-2">
                  ${billingData?.upgradePackage?.price?.toFixed(2) || '299.99'}
                </div>
                <div className="text-sm text-purple-600 mb-4">/month</div>
                <Button 
                  onClick={() => handleUpgrade(billingData?.upgradePackage?.id || 'cmi35uxwd0001q69c8ton56qx')}
                  disabled={loading === (billingData?.upgradePackage?.id || 'cmi35uxwd0001q69c8ton56qx')}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                >
                  {loading === (billingData?.upgradePackage?.id || 'cmi35uxwd0001q69c8ton56qx') ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <ArrowRight className="w-4 h-4 mr-2" />
                  )}
                  Upgrade to {billingData?.upgradePackage?.name || 'Premium'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}