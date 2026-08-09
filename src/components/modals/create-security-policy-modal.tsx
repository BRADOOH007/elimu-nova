'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogBody, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/hooks/use-toast'
import { Loader2, Plus, Shield } from 'lucide-react'

interface SecurityPolicy {
  id: string
  name: string
  description?: string
  policyType: string
  rules: string
  isActive: boolean
  priority: number
  createdBy: string
  updatedBy: string
  createdAt: string
  updatedAt: string
  createdByUser: {
    id: string
    firstName: string
    lastName: string
    email: string
  }
  updatedByUser: {
    id: string
    firstName: string
    lastName: string
    email: string
  }
}

interface CreateSecurityPolicyModalProps {
  isOpen: boolean
  onClose: () => void
  onPolicyCreated: (policy: SecurityPolicy) => void
}

export default function CreateSecurityPolicyModal({
  isOpen,
  onClose,
  onPolicyCreated
}: CreateSecurityPolicyModalProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    policyType: 'PASSWORD',
    rules: '{}',
    isActive: true,
    priority: 0
  })
  const { toast } = useToast()

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name || !formData.policyType || !formData.rules) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      })
      return
    }

    // Validate JSON rules
    try {
      JSON.parse(formData.rules)
    } catch {
      toast({
        title: "Error",
        description: "Invalid JSON format for rules",
        variant: "destructive"
      })
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/security/policies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        const policyData = await response.json()
        onPolicyCreated(policyData)
        setFormData({
          name: '',
          description: '',
          policyType: 'PASSWORD',
          rules: '{}',
          isActive: true,
          priority: 0
        })
        onClose()
        toast({
          title: "Success",
          description: "Security policy created successfully",
        })
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.error || "Failed to create security policy",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error creating security policy:', error)
      toast({
        title: "Error",
        description: "Failed to create security policy",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const getDefaultRules = (policyType: string) => {
    switch (policyType) {
      case 'PASSWORD':
        return JSON.stringify({
          minLength: 8,
          requireUppercase: true,
          requireLowercase: true,
          requireNumbers: true,
          requireSpecialChars: true,
          maxAge: 90
        }, null, 2)
      case 'SESSION':
        return JSON.stringify({
          timeoutMinutes: 60,
          extendOnActivity: true,
          maxSessionDuration: 480
        }, null, 2)
      case 'API_RATE_LIMITING':
        return JSON.stringify({
          requestsPerMinute: 100,
          requestsPerHour: 1000,
          burstLimit: 20
        }, null, 2)
      case 'FILE_UPLOAD':
        return JSON.stringify({
          allowedTypes: ['pdf', 'doc', 'docx', 'txt', 'jpg', 'jpeg', 'png'],
          maxSize: 10485760,
          scanForMalware: true
        }, null, 2)
      case 'AUTHENTICATION':
        return JSON.stringify({
          requireTwoFactor: false,
          maxLoginAttempts: 5,
          lockoutDuration: 30
        }, null, 2)
      default:
        return '{}'
    }
  }

  const handlePolicyTypeChange = (policyType: string) => {
    setFormData(prev => ({
      ...prev,
      policyType,
      rules: getDefaultRules(policyType)
    }))
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-600" />
            Create Security Policy
          </DialogTitle>
        </DialogHeader>

        <form id="create-security-policy-form" onSubmit={handleSubmit} className="contents">
          <DialogBody className="space-y-6 mt-1">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Policy Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="e.g., Password Policy, Session Timeout"
                  className="edugenius-glass"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="policyType">Policy Type *</Label>
                <Select value={formData.policyType} onValueChange={handlePolicyTypeChange}>
                  <SelectTrigger className="edugenius-glass">
                    <SelectValue placeholder="Select policy type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PASSWORD">Password</SelectItem>
                    <SelectItem value="SESSION">Session</SelectItem>
                    <SelectItem value="API_RATE_LIMITING">API Rate Limiting</SelectItem>
                    <SelectItem value="FILE_UPLOAD">File Upload</SelectItem>
                    <SelectItem value="AUTHENTICATION">Authentication</SelectItem>
                    <SelectItem value="AUTHORIZATION">Authorization</SelectItem>
                    <SelectItem value="IP_WHITELIST">IP Whitelist</SelectItem>
                    <SelectItem value="IP_BLACKLIST">IP Blacklist</SelectItem>
                    <SelectItem value="DATA_ACCESS">Data Access</SelectItem>
                    <SelectItem value="AUDIT_LOGGING">Audit Logging</SelectItem>
                    <SelectItem value="CUSTOM">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Brief description of the policy"
                className="edugenius-glass"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="rules">Rules Configuration *</Label>
              <Textarea
                id="rules"
                value={formData.rules}
                onChange={(e) => handleInputChange('rules', e.target.value)}
                placeholder="JSON configuration for policy rules"
                className="edugenius-glass font-mono text-sm"
                rows={8}
                required
              />
              <p className="text-xs text-gray-500">
                Enter valid JSON configuration for the policy rules. The format depends on the policy type.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="isActive">Active Policy</Label>
                  <p className="text-xs text-gray-500">Enable this policy</p>
                </div>
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => handleInputChange('isActive', checked)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Input
                  id="priority"
                  type="number"
                  value={formData.priority}
                  onChange={(e) => handleInputChange('priority', parseInt(e.target.value) || 0)}
                  placeholder="0"
                  className="edugenius-glass"
                  min="0"
                  max="100"
                />
                <p className="text-xs text-gray-500">Higher numbers have higher priority</p>
              </div>
            </div>
          </DialogBody>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="edugenius-glass px-5 py-2.5 text-sm font-medium"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form="create-security-policy-form"
              disabled={loading}
              className="edugenius-button px-5 py-2.5 text-sm font-medium"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Policy
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
