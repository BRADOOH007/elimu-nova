"use client"

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogBody,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"

interface CreateInvoiceModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

interface Subscription {
  id: string
  school: {
    id: string
    name: string
  }
  package: {
    id: string
    name: string
    price: number
  }
  amount: number
}

interface PaymentMethod {
  id: string
  name: string
  type: string
}

export function CreateInvoiceModal({
  open,
  onOpenChange,
  onSuccess
}: CreateInvoiceModalProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [formData, setFormData] = useState({
    subscriptionId: '',
    amount: '',
    taxAmount: '0',
    dueDate: '',
    paymentMethodId: '',
    notes: ''
  })

  // Fetch subscriptions and payment methods
  useEffect(() => {
    if (open) {
      fetchSubscriptions()
      fetchPaymentMethods()
    }
  }, [open])

  const fetchSubscriptions = async () => {
    try {
      const response = await fetch('/api/billing?limit=100')
      if (response.ok) {
        const data = await response.json()
        setSubscriptions(data.subscriptions)
      }
    } catch (error) {
      console.error('Error fetching subscriptions:', error)
    }
  }

  const fetchPaymentMethods = async () => {
    try {
      const response = await fetch('/api/payment-methods?limit=100')
      if (response.ok) {
        const data = await response.json()
        setPaymentMethods(data.paymentMethods)
      }
    } catch (error) {
      console.error('Error fetching payment methods:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.subscriptionId || !formData.amount || !formData.dueDate) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Subscription, amount, and due date are required",
      })
      return
    }

    try {
      setLoading(true)
      
      const response = await fetch('/api/invoices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          amount: parseFloat(formData.amount),
          taxAmount: parseFloat(formData.taxAmount),
          paymentMethodId: formData.paymentMethodId === 'no-method' ? null : formData.paymentMethodId
        }),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Invoice created successfully",
        })
        onSuccess()
        setFormData({
          subscriptionId: '',
          amount: '',
          taxAmount: '0',
          dueDate: '',
          paymentMethodId: '',
          notes: ''
        })
      } else {
        const error = await response.json()
        toast({
          variant: "destructive",
          title: "Error",
          description: error.error || "Failed to create invoice",
        })
      }
    } catch (error) {
      console.error('Error creating invoice:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create invoice",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const selectedSubscription = subscriptions.find(sub => sub.id === formData.subscriptionId)
  const totalAmount = parseFloat(formData.amount) + parseFloat(formData.taxAmount)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create Invoice</DialogTitle>
          <DialogDescription>
            Generate a new invoice for a subscription.
          </DialogDescription>
        </DialogHeader>
        
        <form id="create-invoice-form" onSubmit={handleSubmit} className="contents">
          <DialogBody className="space-y-4 mt-1">
          <div className="space-y-2">
            <Label htmlFor="subscriptionId">Subscription *</Label>
            <Select
              value={formData.subscriptionId}
              onValueChange={(value) => handleInputChange('subscriptionId', value)}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select subscription" />
              </SelectTrigger>
              <SelectContent>
                {subscriptions.map((subscription) => (
                  <SelectItem key={subscription.id} value={subscription.id}>
                    {subscription.school.name} - {subscription.package.name} (${subscription.amount})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedSubscription && (
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">
                <strong>School:</strong> {selectedSubscription.school.name}
              </p>
              <p className="text-sm text-gray-600">
                <strong>Package:</strong> {selectedSubscription.package.name}
              </p>
              <p className="text-sm text-gray-600">
                <strong>Base Amount:</strong> ${selectedSubscription.amount}
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount (USD) *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.amount}
                onChange={(e) => handleInputChange('amount', e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="taxAmount">Tax Amount (USD)</Label>
              <Input
                id="taxAmount"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.taxAmount}
                onChange={(e) => handleInputChange('taxAmount', e.target.value)}
              />
            </div>
          </div>

          {formData.amount && (
            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="text-sm font-medium text-blue-900">
                Total Amount: ${totalAmount.toFixed(2)}
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="dueDate">Due Date *</Label>
            <Input
              id="dueDate"
              type="date"
              value={formData.dueDate}
              onChange={(e) => handleInputChange('dueDate', e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="paymentMethodId">Payment Method</Label>
            <Select
              value={formData.paymentMethodId}
              onValueChange={(value) => handleInputChange('paymentMethodId', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select payment method (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="no-method">No payment method</SelectItem>
                {paymentMethods.map((method) => (
                  <SelectItem key={method.id} value={method.id}>
                    {method.name} ({method.type})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Optional notes for this invoice"
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              rows={3}
            />
          </div>

          </DialogBody>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="px-5 py-2.5 text-sm font-medium"
            >
              Cancel
            </Button>
            <Button type="submit" form="create-invoice-form" disabled={loading} className="px-5 py-2.5 text-sm font-medium">
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Create Invoice
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
