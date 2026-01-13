"use client"

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { 
  Loader2, 
  CreditCard, 
  School, 
  Package, 
  Calendar,
  DollarSign,
  Edit,
  Trash2,
  Save,
  X,
  Clock,
  User,
  Phone,
  Mail,
  MapPin
} from "lucide-react"

interface School {
  id: string
  name: string
}

interface Package {
  id: string
  name: string
  price: number
  duration: number
  isActive: boolean
}

interface Billing {
  id: string
  startDate: string
  endDate: string
  amount: number
  status: string
  type: string
  paymentMethod: string
  transactionId?: string
  notes?: string
  createdAt: string
  updatedAt: string
  school: {
    id: string
    name: string
    address: string
    phone?: string
    email?: string
    schoolAdmin?: {
      user: {
        firstName: string
        lastName: string
        email: string
      }
    }
  }
  package: {
    id: string
    name: string
    description?: string
    price: number
    duration: number
    features?: string[]
  }
}

interface BillingDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  billingId: string | null
  onBillingUpdated: (billing: Billing) => void
  onBillingDeleted: (billingId: string) => void
}

export function BillingDetailsModal({ 
  isOpen, 
  onClose, 
  billingId, 
  onBillingUpdated, 
  onBillingDeleted 
}: BillingDetailsModalProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [editing, setEditing] = useState(false)
  const [billing, setBilling] = useState<Billing | null>(null)
  const [schools, setSchools] = useState<School[]>([])
  const [packages, setPackages] = useState<Package[]>([])
  const [formData, setFormData] = useState({
    schoolId: '',
    packageId: '',
    startDate: '',
    endDate: '',
    amount: '',
    status: '',
    type: '',
    paymentMethod: '',
    transactionId: '',
    notes: ''
  })

  // Fetch billing data
  const fetchBilling = async () => {
    if (!billingId) return

    setLoading(true)
    try {
      const response = await fetch(`/api/billing/${billingId}`)
      if (response.ok) {
        const billingData = await response.json()
        setBilling(billingData)
        setFormData({
          schoolId: billingData.school.id,
          packageId: billingData.package.id,
          startDate: billingData.startDate.split('T')[0],
          endDate: billingData.endDate.split('T')[0],
          amount: billingData.amount.toString(),
          status: billingData.status,
          type: billingData.type,
          paymentMethod: billingData.paymentMethod,
          transactionId: billingData.transactionId || '',
          notes: billingData.notes || ''
        })
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to fetch billing details",
        })
      }
    } catch (error) {
      console.error('Error fetching billing:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch billing details",
      })
    } finally {
      setLoading(false)
    }
  }

  // Fetch schools and packages
  const fetchData = async () => {
    try {
      const [schoolsResponse, packagesResponse] = await Promise.all([
        fetch('/api/schools?limit=100'),
        fetch('/api/packages')
      ])

      if (schoolsResponse.ok) {
        const schoolsData = await schoolsResponse.json()
        setSchools(schoolsData.schools || [])
      }

      if (packagesResponse.ok) {
        const packagesData = await packagesResponse.json()
        setPackages(packagesData.packages || [])
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    }
  }

  useEffect(() => {
    if (isOpen && billingId) {
      fetchBilling()
      fetchData()
    }
  }, [isOpen, billingId])

  const handleSave = async () => {
    if (!billingId) return

    setSaving(true)
    try {
      const response = await fetch(`/api/billing/${billingId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          amount: parseFloat(formData.amount)
        }),
      })

      if (response.ok) {
        const updatedBilling = await response.json()
        setBilling(updatedBilling)
        onBillingUpdated(updatedBilling)
        setEditing(false)
        toast({
          variant: "success",
          title: "Billing Updated",
          description: "Billing information has been updated successfully!",
        })
      } else {
        const error = await response.json()
        toast({
          variant: "destructive",
          title: "Error",
          description: error.error || "Failed to update billing",
        })
      }
    } catch (error) {
      console.error('Error updating billing:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update billing",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!billingId) return

    // Confirmation removed - using toast notifications only

    setDeleting(true)
    try {
      const response = await fetch(`/api/billing/${billingId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        onBillingDeleted(billingId)
        onClose()
        toast({
          variant: "success",
          title: "Billing Deleted",
          description: "Billing record has been deleted successfully!",
        })
      } else {
        const error = await response.json()
        toast({
          variant: "destructive",
          title: "Error",
          description: error.error || "Failed to delete billing record",
        })
      }
    } catch (error) {
      console.error('Error deleting billing:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete billing record",
      })
    } finally {
      setDeleting(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800'
      case 'EXPIRED':
        return 'bg-red-100 text-red-800'
      case 'CANCELLED':
        return 'bg-gray-100 text-gray-800'
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'SUBSCRIPTION':
        return 'bg-blue-100 text-blue-800'
      case 'ONE_TIME':
        return 'bg-purple-100 text-purple-800'
      case 'RENEWAL':
        return 'bg-green-100 text-green-800'
      case 'UPGRADE':
        return 'bg-orange-100 text-orange-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const isExpired = billing ? new Date(billing.endDate) < new Date() : false
  const daysRemaining = billing ? Math.ceil((new Date(billing.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : 0

  if (loading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto bg-gradient-to-br from-white via-blue-50 to-purple-50">
          <DialogHeader>
            <DialogTitle className="edugenius-text-gradient-blue">Loading Billing Details</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            <span className="ml-3 text-gray-500">Loading billing details...</span>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  if (!billing) {
    return null
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto bg-gradient-to-br from-white via-blue-50 to-purple-50">
        <DialogHeader className="sticky top-0 bg-gradient-to-br from-white via-blue-50 to-purple-50 z-10 pb-4">
          <DialogTitle className="edugenius-text-gradient-blue flex items-center justify-between">
            <div className="flex items-center">
              <CreditCard className="w-5 h-5 mr-2" />
              Billing Details
            </div>
            <div className="flex items-center space-x-2">
              {editing ? (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditing(false)}
                    disabled={saving}
                    className="edugenius-glass"
                  >
                    <X className="w-4 h-4 mr-1" />
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSave}
                    disabled={saving}
                    className="edugenius-button"
                  >
                    {saving ? (
                      <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4 mr-1" />
                    )}
                    Save
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditing(true)}
                    className="edugenius-glass"
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDelete}
                    disabled={deleting}
                    className="edugenius-glass text-red-600 hover:text-red-700"
                  >
                    {deleting ? (
                      <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4 mr-1" />
                    )}
                    Delete
                  </Button>
                </>
              )}
            </div>
          </DialogTitle>
          <DialogDescription>
            View and manage billing information and subscription details
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 pb-4">
          {/* Billing Information */}
          <Card className="bg-gradient-to-br from-white/70 to-blue-50/70 backdrop-blur-sm border-0">
            <CardHeader>
              <CardTitle className="edugenius-text-gradient-blue">Billing Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="schoolId">School</Label>
                  {editing ? (
                    <Select value={formData.schoolId} onValueChange={(value) => handleInputChange('schoolId', value)}>
                      <SelectTrigger className="edugenius-glass">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {schools && schools.length > 0 ? (
                          schools.map((school) => (
                            <SelectItem key={school.id} value={school.id}>
                              {school.name}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="no-schools" disabled>
                            No schools available
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="flex items-center text-sm text-gray-900">
                      <School className="w-4 h-4 mr-2 text-gray-400" />
                      {billing.school.name}
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="packageId">Package</Label>
                  {editing ? (
                    <Select value={formData.packageId} onValueChange={(value) => handleInputChange('packageId', value)}>
                      <SelectTrigger className="edugenius-glass">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {packages && packages.length > 0 ? (
                          packages.filter(pkg => pkg.isActive).map((pkg) => (
                            <SelectItem key={pkg.id} value={pkg.id}>
                              {pkg.name} - ${pkg.price.toLocaleString()}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="no-packages" disabled>
                            No packages available
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="flex items-center text-sm text-gray-900">
                      <Package className="w-4 h-4 mr-2 text-gray-400" />
                      {billing.package.name}
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  {editing ? (
                    <Input
                      id="startDate"
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => handleInputChange('startDate', e.target.value)}
                      className="edugenius-glass"
                    />
                  ) : (
                    <div className="flex items-center text-sm text-gray-900">
                      <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                      {new Date(billing.startDate).toLocaleDateString()}
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date</Label>
                  {editing ? (
                    <Input
                      id="endDate"
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => handleInputChange('endDate', e.target.value)}
                      className="edugenius-glass"
                    />
                  ) : (
                    <div className="flex items-center text-sm text-gray-900">
                      <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                      {new Date(billing.endDate).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount</Label>
                  {editing ? (
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      value={formData.amount}
                      onChange={(e) => handleInputChange('amount', e.target.value)}
                      className="edugenius-glass"
                    />
                  ) : (
                    <div className="flex items-center text-sm text-gray-900">
                      <DollarSign className="w-4 h-4 mr-2 text-gray-400" />
                      ${billing.amount.toLocaleString()}
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  {editing ? (
                    <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
                      <SelectTrigger className="edugenius-glass">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ACTIVE">Active</SelectItem>
                        <SelectItem value="PENDING">Pending</SelectItem>
                        <SelectItem value="EXPIRED">Expired</SelectItem>
                        <SelectItem value="CANCELLED">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(billing.status)}`}>
                      {billing.status}
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="type">Type</Label>
                  {editing ? (
                    <Select value={formData.type} onValueChange={(value) => handleInputChange('type', value)}>
                      <SelectTrigger className="edugenius-glass">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="SUBSCRIPTION">Subscription</SelectItem>
                        <SelectItem value="ONE_TIME">One-time Payment</SelectItem>
                        <SelectItem value="RENEWAL">Renewal</SelectItem>
                        <SelectItem value="UPGRADE">Upgrade</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${getTypeColor(billing.type)}`}>
                      {billing.type.replace('_', ' ')}
                    </span>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="paymentMethod">Payment Method</Label>
                  {editing ? (
                    <Select value={formData.paymentMethod} onValueChange={(value) => handleInputChange('paymentMethod', value)}>
                      <SelectTrigger className="edugenius-glass">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MANUAL">Manual Entry</SelectItem>
                        <SelectItem value="MPESA">M-Pesa</SelectItem>
                        <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                        <SelectItem value="CREDIT_CARD">Credit Card</SelectItem>
                        <SelectItem value="CASH">Cash</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <span className="text-sm text-gray-900">
                      {billing.paymentMethod.replace('_', ' ')}
                    </span>
                  )}
                </div>
              </div>

              {billing.transactionId && (
                <div className="space-y-2">
                  <Label htmlFor="transactionId">Transaction ID</Label>
                  {editing ? (
                    <Input
                      id="transactionId"
                      value={formData.transactionId}
                      onChange={(e) => handleInputChange('transactionId', e.target.value)}
                      className="edugenius-glass"
                    />
                  ) : (
                    <span className="text-sm text-gray-900 font-mono">
                      {billing.transactionId}
                    </span>
                  )}
                </div>
              )}

              {billing.notes && (
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  {editing ? (
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => handleInputChange('notes', e.target.value)}
                      className="edugenius-glass"
                      rows={3}
                    />
                  ) : (
                    <p className="text-sm text-gray-900">{billing.notes}</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* School Information */}
          <Card className="bg-gradient-to-br from-white/70 to-green-50/70 backdrop-blur-sm border-0">
            <CardHeader>
              <CardTitle className="edugenius-text-gradient-green flex items-center">
                <School className="w-5 h-5 mr-2" />
                School Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center text-sm text-gray-900">
                <School className="w-4 h-4 mr-2 text-gray-400" />
                <span className="font-medium">{billing.school.name}</span>
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                {billing.school.address}
              </div>
              {billing.school.phone && (
                <div className="flex items-center text-sm text-gray-600">
                  <Phone className="w-4 h-4 mr-2 text-gray-400" />
                  {billing.school.phone}
                </div>
              )}
              {billing.school.email && (
                <div className="flex items-center text-sm text-gray-600">
                  <Mail className="w-4 h-4 mr-2 text-gray-400" />
                  {billing.school.email}
                </div>
              )}
              {billing.school.schoolAdmin && (
                <div className="flex items-center text-sm text-gray-600">
                  <User className="w-4 h-4 mr-2 text-gray-400" />
                  Admin: {billing.school.schoolAdmin.user.firstName} {billing.school.schoolAdmin.user.lastName}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Package Information */}
          <Card className="bg-gradient-to-br from-white/70 to-purple-50/70 backdrop-blur-sm border-0">
            <CardHeader>
              <CardTitle className="edugenius-text-gradient-purple flex items-center">
                <Package className="w-5 h-5 mr-2" />
                Package Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-900">{billing.package.name}</span>
                <span className="text-sm font-bold text-gray-900">${billing.package.price.toLocaleString()}</span>
              </div>
              {billing.package.description && (
                <p className="text-sm text-gray-600">{billing.package.description}</p>
              )}
              <div className="flex items-center text-sm text-gray-600">
                <Clock className="w-4 h-4 mr-2 text-gray-400" />
                Duration: {billing.package.duration} months
              </div>
              {billing.package.features && billing.package.features.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-900 mb-2">Features:</p>
                  <ul className="text-sm text-gray-600 space-y-1">
                    {billing.package.features.map((feature, index) => (
                      <li key={index} className="flex items-center">
                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2"></div>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Subscription Status */}
          <Card className="bg-gradient-to-br from-white/70 to-orange-50/70 backdrop-blur-sm border-0">
            <CardHeader>
              <CardTitle className="edugenius-text-gradient-orange flex items-center">
                <Clock className="w-5 h-5 mr-2" />
                Subscription Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Status:</span>
                <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(billing.status)}`}>
                  {billing.status}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Days Remaining:</span>
                <span className={`text-sm font-medium ${isExpired ? 'text-red-600' : daysRemaining < 30 ? 'text-yellow-600' : 'text-green-600'}`}>
                  {isExpired ? 'Expired' : `${daysRemaining} days`}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Created:</span>
                <span className="text-sm text-gray-900">{new Date(billing.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Last Updated:</span>
                <span className="text-sm text-gray-900">{new Date(billing.updatedAt).toLocaleDateString()}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}
