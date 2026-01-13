'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { Loader2, Edit, Trash2, Save, X, Shield, CheckCircle, XCircle } from 'lucide-react'

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

interface SecurityPolicyDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  policy: SecurityPolicy | null
  onPolicyUpdated: (policy: SecurityPolicy) => void
  onPolicyDeleted: (policyId: string) => void
}

export default function SecurityPolicyDetailsModal({
  isOpen,
  onClose,
  policy,
  onPolicyUpdated,
  onPolicyDeleted
}: SecurityPolicyDetailsModalProps) {
  const [loading, setLoading] = useState(false)
  const [editing, setEditing] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    policyType: 'PASSWORD',
    rules: '{}',
    isActive: true,
    priority: 0
  })
  const { toast } = useToast()

  useEffect(() => {
    if (policy) {
      setFormData({
        name: policy.name,
        description: policy.description || '',
        policyType: policy.policyType,
        rules: policy.rules,
        isActive: policy.isActive,
        priority: policy.priority
      })
      setEditing(false)
    }
  }, [policy])

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleUpdate = async () => {
    if (!policy) return

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
      const response = await fetch(`/api/security/policies/${policy.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        const updatedPolicy = await response.json()
        onPolicyUpdated(updatedPolicy)
        setEditing(false)
        toast({
          title: "Success",
          description: "Security policy updated successfully",
        })
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.error || "Failed to update security policy",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error updating security policy:', error)
      toast({
        title: "Error",
        description: "Failed to update security policy",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!policy) return

    // Confirmation removed - using toast notifications only

    setLoading(true)
    try {
      const response = await fetch(`/api/security/policies/${policy.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        onPolicyDeleted(policy.id)
        onClose()
        toast({
          title: "Success",
          description: "Security policy deleted successfully",
        })
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.error || "Failed to delete security policy",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error deleting security policy:', error)
      toast({
        title: "Error",
        description: "Failed to delete security policy",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const getPolicyTypeColor = (policyType: string) => {
    switch (policyType) {
      case 'PASSWORD': return 'bg-blue-100 text-blue-800'
      case 'SESSION': return 'bg-green-100 text-green-800'
      case 'API_RATE_LIMITING': return 'bg-purple-100 text-purple-800'
      case 'FILE_UPLOAD': return 'bg-orange-100 text-orange-800'
      case 'AUTHENTICATION': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatPolicyType = (policyType: string) => {
    return policyType.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())
  }

  const formatRules = (rules: string) => {
    try {
      const parsed = JSON.parse(rules)
      return JSON.stringify(parsed, null, 2)
    } catch {
      return rules
    }
  }

  if (!policy) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-600" />
            Security Policy Details
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header Info */}
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{policy.name}</h3>
              <div className="flex items-center gap-2 mb-3">
                <Badge className={getPolicyTypeColor(policy.policyType)}>
                  {formatPolicyType(policy.policyType)}
                </Badge>
                <Badge variant="outline" className="text-blue-600 border-blue-600">
                  Priority: {policy.priority}
                </Badge>
                {policy.isActive ? (
                  <Badge variant="outline" className="text-green-600 border-green-600">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Active
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-red-600 border-red-600">
                    <XCircle className="w-3 h-3 mr-1" />
                    Inactive
                  </Badge>
                )}
              </div>
              {policy.description && (
                <p className="text-gray-600">{policy.description}</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditing(!editing)}
                className="edugenius-glass"
              >
                {editing ? <X className="w-4 h-4" /> : <Edit className="w-4 h-4" />}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDelete}
                disabled={loading}
                className="edugenius-glass text-red-600 hover:text-red-700"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Form Fields */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Policy Name</Label>
                {editing ? (
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="edugenius-glass"
                  />
                ) : (
                  <div className="p-3 bg-gray-50 rounded-md">{policy.name}</div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="policyType">Policy Type</Label>
                {editing ? (
                  <Select value={formData.policyType} onValueChange={(value) => handleInputChange('policyType', value)}>
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
                ) : (
                  <div className="p-3 bg-gray-50 rounded-md">{formatPolicyType(policy.policyType)}</div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              {editing ? (
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  className="edugenius-glass"
                  rows={3}
                />
              ) : (
                <div className="p-3 bg-gray-50 rounded-md">
                  {policy.description || 'No description provided'}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="rules">Rules Configuration</Label>
              {editing ? (
                <Textarea
                  id="rules"
                  value={formData.rules}
                  onChange={(e) => handleInputChange('rules', e.target.value)}
                  className="edugenius-glass font-mono text-sm"
                  rows={8}
                />
              ) : (
                <div className="p-3 bg-gray-50 rounded-md font-mono text-sm max-h-48 overflow-y-auto">
                  <pre>{formatRules(policy.rules)}</pre>
                </div>
              )}
            </div>

            {editing && (
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
                    className="edugenius-glass"
                    min="0"
                    max="100"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Metadata */}
          <div className="pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
              <div>
                <span className="font-medium">Created:</span> {new Date(policy.createdAt).toLocaleString()}
              </div>
              <div>
                <span className="font-medium">Last Updated:</span> {new Date(policy.updatedAt).toLocaleString()}
              </div>
              <div>
                <span className="font-medium">Created By:</span> {policy.createdByUser.firstName} {policy.createdByUser.lastName}
              </div>
              <div>
                <span className="font-medium">Updated By:</span> {policy.updatedByUser.firstName} {policy.updatedByUser.lastName}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          {editing && (
            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditing(false)}
                className="edugenius-glass"
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpdate}
                disabled={loading}
                className="edugenius-button"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Update Policy
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
