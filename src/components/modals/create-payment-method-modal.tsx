"use client"

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"

interface PaymentMethodData {
  id?: string
  name: string
  type: string
  description?: string
  isActive: boolean
}

interface CreatePaymentMethodModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  editing?: PaymentMethodData | null
}

const paymentTypes = [
  { value: 'CREDIT_CARD', label: 'Credit Card' },
  { value: 'BANK_TRANSFER', label: 'Bank Transfer' },
  { value: 'MOBILE_MONEY', label: 'Mobile Money' },
  { value: 'CASH', label: 'Cash' },
  { value: 'CHECK', label: 'Check' },
  { value: 'OTHER', label: 'Other' }
]

export function CreatePaymentMethodModal({
  open,
  onOpenChange,
  onSuccess,
  editing
}: CreatePaymentMethodModalProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    description: '',
    isActive: true
  })

  useEffect(() => {
    if (open && editing) {
      setFormData({
        name: editing.name || '',
        type: editing.type || '',
        description: editing.description || '',
        isActive: editing.isActive
      })
    } else if (open) {
      setFormData({ name: '', type: '', description: '', isActive: true })
    }
  }, [open, editing])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name || !formData.type) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Name and type are required",
      })
      return
    }

    try {
      setLoading(true)
      
      const isEdit = Boolean(editing?.id)
      const response = await fetch('/api/payment-methods', {
        method: isEdit ? 'PATCH' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(isEdit ? { id: editing!.id, ...formData } : formData),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: isEdit ? "Payment method updated successfully" : "Payment method created successfully",
        })
        onSuccess()
        setFormData({ name: '', type: '', description: '', isActive: true })
      } else {
        const error = await response.json()
        toast({
          variant: "destructive",
          title: "Error",
          description: error.error || (isEdit ? "Failed to update payment method" : "Failed to create payment method"),
        })
      }
    } catch (error) {
      console.error('Error saving payment method:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save payment method",
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{editing ? 'Edit Payment Method' : 'Create Payment Method'}</DialogTitle>
          <DialogDescription>
            {editing ? 'Update this payment method.' : 'Add a new payment method for subscriptions and invoices.'}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              placeholder="e.g., Visa, M-Pesa, Bank Transfer"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Type *</Label>
            <Select
              value={formData.type}
              onValueChange={(value) => handleInputChange('type', value)}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select payment type" />
              </SelectTrigger>
              <SelectContent>
                {paymentTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Optional description for this payment method"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="isActive"
              checked={formData.isActive}
              onCheckedChange={(checked) => handleInputChange('isActive', checked)}
            />
            <Label htmlFor="isActive">Active</Label>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editing ? 'Update Payment Method' : 'Create Payment Method'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}