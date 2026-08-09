'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogBody, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/hooks/use-toast'
import { Loader2, Plus } from 'lucide-react'

interface SystemSetting {
  id: string
  key: string
  value: string
  type: string
  category: string
  description?: string
  isPublic: boolean
  isEditable: boolean
  updatedBy: string
  createdAt: string
  updatedAt: string
  updatedByUser: {
    id: string
    firstName: string
    lastName: string
    email: string
  }
}

interface CreateSystemSettingModalProps {
  isOpen: boolean
  onClose: () => void
  onSettingCreated: (setting: SystemSetting) => void
}

export default function CreateSystemSettingModal({
  isOpen,
  onClose,
  onSettingCreated
}: CreateSystemSettingModalProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    key: '',
    value: '',
    type: 'string',
    category: 'general',
    description: '',
    isPublic: false,
    isEditable: true
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
    
    if (!formData.key || !formData.value || !formData.type || !formData.category) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      })
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/system-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        const settingData = await response.json()
        onSettingCreated(settingData)
        setFormData({
          key: '',
          value: '',
          type: 'string',
          category: 'general',
          description: '',
          isPublic: false,
          isEditable: true
        })
        onClose()
        toast({
          title: "Success",
          description: "System setting created successfully",
        })
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.error || "Failed to create system setting",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error creating system setting:', error)
      toast({
        title: "Error",
        description: "Failed to create system setting",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const validateValue = (value: string, type: string) => {
    if (type === 'number') {
      return !isNaN(Number(value))
    }
    if (type === 'boolean') {
      return value === 'true' || value === 'false'
    }
    if (type === 'json' || type === 'array') {
      try {
        JSON.parse(value)
        return true
      } catch {
        return false
      }
    }
    return true
  }

  const getValuePlaceholder = (type: string) => {
    switch (type) {
      case 'string': return 'Enter text value'
      case 'number': return 'Enter numeric value'
      case 'boolean': return 'true or false'
      case 'json': return '{"key": "value"}'
      case 'array': return '["item1", "item2"]'
      default: return 'Enter value'
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5 text-blue-600" />
            Create System Setting
          </DialogTitle>
        </DialogHeader>

        <form id="create-system-setting-form" onSubmit={handleSubmit} className="contents">
          <DialogBody className="space-y-6 mt-1">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="key">Setting Key *</Label>
                <Input
                  id="key"
                  value={formData.key}
                  onChange={(e) => handleInputChange('key', e.target.value)}
                  placeholder="e.g., site_name, maintenance_mode"
                  className="edugenius-glass"
                  required
                />
                <p className="text-xs text-gray-500">Unique identifier for the setting</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Data Type *</Label>
                <Select value={formData.type} onValueChange={(value) => handleInputChange('type', value)}>
                  <SelectTrigger className="edugenius-glass">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="string">String</SelectItem>
                    <SelectItem value="number">Number</SelectItem>
                    <SelectItem value="boolean">Boolean</SelectItem>
                    <SelectItem value="json">JSON</SelectItem>
                    <SelectItem value="array">Array</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="value">Value *</Label>
              <Input
                id="value"
                value={formData.value}
                onChange={(e) => handleInputChange('value', e.target.value)}
                placeholder={getValuePlaceholder(formData.type)}
                className="edugenius-glass"
                required
              />
              {formData.value && !validateValue(formData.value, formData.type) && (
                <p className="text-xs text-red-500">
                  Invalid {formData.type} format
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
                  <SelectTrigger className="edugenius-glass">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="security">Security</SelectItem>
                    <SelectItem value="notifications">Notifications</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                    <SelectItem value="analytics">Analytics</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Brief description of the setting"
                  className="edugenius-glass"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="isPublic">Public Setting</Label>
                  <p className="text-xs text-gray-500">Visible to non-admin users</p>
                </div>
                <Switch
                  id="isPublic"
                  checked={formData.isPublic}
                  onCheckedChange={(checked) => handleInputChange('isPublic', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="isEditable">Editable</Label>
                  <p className="text-xs text-gray-500">Can be modified after creation</p>
                </div>
                <Switch
                  id="isEditable"
                  checked={formData.isEditable}
                  onCheckedChange={(checked) => handleInputChange('isEditable', checked)}
                />
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
              form="create-system-setting-form"
              disabled={loading || !validateValue(formData.value, formData.type)}
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
                  Create Setting
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
