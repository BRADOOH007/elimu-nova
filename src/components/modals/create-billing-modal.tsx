"use client"

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { Loader2, CreditCard, School, Package, Calendar, DollarSign } from "lucide-react"

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

interface CreateBillingModalProps {
  isOpen: boolean
  onClose: () => void
  onBillingCreated: (billing: any) => void
}

export function CreateBillingModal({ isOpen, onClose, onBillingCreated }: CreateBillingModalProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [dataLoading, setDataLoading] = useState(false)
  const [schools, setSchools] = useState<School[]>([])
  const [packages, setPackages] = useState<Package[]>([])
  const [formData, setFormData] = useState({
    schoolId: '',
    packageId: '',
    startDate: '',
    endDate: '',
    amount: '',
    status: 'ACTIVE',
    type: 'SUBSCRIPTION',
    paymentMethod: 'MANUAL',
    transactionId: '',
    notes: ''
  })

  // Fetch schools and packages when modal opens
  const fetchData = async () => {
    setDataLoading(true)
    try {
      const [schoolsResponse, packagesResponse] = await Promise.all([
        fetch('/api/schools?limit=100'),
        fetch('/api/packages')
      ])

      if (schoolsResponse.ok) {
        const schoolsData = await schoolsResponse.json()
        setSchools(schoolsData.schools || [])
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to fetch schools data",
        })
      }

      if (packagesResponse.ok) {
        const packagesData = await packagesResponse.json()
        setPackages(packagesData.packages || [])
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to fetch packages data",
        })
      }
    } catch (error) {
      console.error('Error fetching data:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch data",
      })
    } finally {
      setDataLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen) {
      fetchData()
    }
  }, [isOpen])

  // Auto-calculate end date and amount when package changes
  useEffect(() => {
    if (formData.packageId && formData.startDate && packages && packages.length > 0) {
      const selectedPackage = packages.find(pkg => pkg.id === formData.packageId && pkg.isActive)
      if (selectedPackage) {
        const startDate = new Date(formData.startDate)
        const endDate = new Date(startDate)
        endDate.setMonth(endDate.getMonth() + selectedPackage.duration)
        
        setFormData(prev => ({
          ...prev,
          endDate: endDate.toISOString().split('T')[0],
          amount: selectedPackage.price.toString()
        }))
      }
    }
  }, [formData.packageId, formData.startDate, packages])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/billing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          amount: parseFloat(formData.amount)
        }),
      })

      if (response.ok) {
        const billing = await response.json()
        onBillingCreated(billing)
        onClose()
        setFormData({
          schoolId: '',
          packageId: '',
          startDate: '',
          endDate: '',
          amount: '',
          status: 'ACTIVE',
          type: 'SUBSCRIPTION',
          paymentMethod: 'MANUAL',
          transactionId: '',
          notes: ''
        })
        toast({
          variant: "default",
          title: "Billing Created",
          description: "New billing record has been created successfully!",
        })
      } else {
        const error = await response.json()
        toast({
          variant: "destructive",
          title: "Error",
          description: error.error || "Failed to create billing record",
        })
      }
    } catch (error) {
      console.error('Error creating billing:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create billing record",
      })
    } finally {
      setLoading(false)
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto bg-gradient-to-br from-white via-blue-50 to-purple-50">
        <DialogHeader className="sticky top-0 bg-gradient-to-br from-white via-blue-50 to-purple-50 z-10 pb-4">
          <DialogTitle className="edugenius-text-gradient-blue flex items-center">
            <CreditCard className="w-5 h-5 mr-2" />
            Create New Billing Record
          </DialogTitle>
          <DialogDescription>
            Add a new billing record for a school subscription. Fill in the required information below.
          </DialogDescription>
        </DialogHeader>

        {dataLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            <span className="ml-3 text-gray-500">Loading schools and packages...</span>
          </div>
        ) : (
        <form onSubmit={handleSubmit} className="space-y-6 pb-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="schoolId">School *</Label>
              <Select value={formData.schoolId} onValueChange={(value) => handleInputChange('schoolId', value)}>
                <SelectTrigger className="edugenius-glass">
                  <SelectValue placeholder="Select school" />
                </SelectTrigger>
                <SelectContent>
                  {schools && schools.length > 0 ? (
                    schools.map((school) => (
                      <SelectItem key={school.id} value={school.id}>
                        <div className="flex items-center">
                          <School className="w-4 h-4 mr-2" />
                          {school.name}
                        </div>
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="no-schools" disabled>
                      No schools available
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="packageId">Package *</Label>
              <p className="text-xs text-gray-500">Only active packages are shown</p>
              <Select value={formData.packageId} onValueChange={(value) => handleInputChange('packageId', value)}>
                <SelectTrigger className="edugenius-glass">
                  <SelectValue placeholder="Select package" />
                </SelectTrigger>
                <SelectContent>
                  {packages && packages.length > 0 ? (
                    (() => {
                      const activePackages = packages.filter(pkg => pkg.isActive)
                      return activePackages.length > 0 ? (
                        activePackages.map((pkg) => (
                          <SelectItem key={pkg.id} value={pkg.id}>
                            <div className="flex items-center justify-between w-full">
                              <div className="flex items-center">
                                <Package className="w-4 h-4 mr-2" />
                                {pkg.name}
                              </div>
                              <span className="text-sm text-gray-500 ml-2">
                                ${pkg.price.toLocaleString()}
                              </span>
                            </div>
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="no-active-packages" disabled>
                          No active packages available
                        </SelectItem>
                      )
                    })()
                  ) : (
                    <SelectItem value="no-packages" disabled>
                      No packages available
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date *</Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) => handleInputChange('startDate', e.target.value)}
                required
                className="edugenius-glass"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">End Date *</Label>
              <Input
                id="endDate"
                type="date"
                value={formData.endDate}
                onChange={(e) => handleInputChange('endDate', e.target.value)}
                required
                className="edugenius-glass"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount (USD) *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => handleInputChange('amount', e.target.value)}
                placeholder="Enter amount"
                required
                className="edugenius-glass"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
                <SelectTrigger className="edugenius-glass">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                      Active
                    </div>
                  </SelectItem>
                  <SelectItem value="PENDING">
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></div>
                      Pending
                    </div>
                  </SelectItem>
                  <SelectItem value="EXPIRED">
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
                      Expired
                    </div>
                  </SelectItem>
                  <SelectItem value="CANCELLED">
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-gray-500 rounded-full mr-2"></div>
                      Cancelled
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
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
            </div>
            <div className="space-y-2">
              <Label htmlFor="paymentMethod">Payment Method</Label>
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
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="transactionId">Transaction ID</Label>
            <Input
              id="transactionId"
              value={formData.transactionId}
              onChange={(e) => handleInputChange('transactionId', e.target.value)}
              placeholder="Enter transaction ID (optional)"
              className="edugenius-glass"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Enter any additional notes (optional)"
              className="edugenius-glass"
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="edugenius-glass"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="edugenius-button"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <CreditCard className="w-4 h-4 mr-2" />
                  Create Billing
                </>
              )}
            </Button>
          </div>
        </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
