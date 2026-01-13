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
import { Loader2, Edit, Trash2, Save, X, Lock, Globe, Settings, Shield, Bell, Database, BarChart3 } from 'lucide-react'

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

interface SystemSettingDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  setting: SystemSetting | null
  onSettingUpdated: (setting: SystemSetting) => void
  onSettingDeleted: (settingId: string) => void
}

export default function SystemSettingDetailsModal({
  isOpen,
  onClose,
  setting,
  onSettingUpdated,
  onSettingDeleted
}: SystemSettingDetailsModalProps) {
  const [loading, setLoading] = useState(false)
  const [editing, setEditing] = useState(false)
  const [formData, setFormData] = useState({
    value: '',
    type: 'string',
    category: 'general',
    description: '',
    isPublic: false,
    isEditable: true
  })
  const { toast } = useToast()

  useEffect(() => {
    if (setting) {
      setFormData({
        value: setting.value,
        type: setting.type,
        category: setting.category,
        description: setting.description || '',
        isPublic: setting.isPublic,
        isEditable: setting.isEditable
      })
      setEditing(false)
    }
  }, [setting])

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleUpdate = async () => {
    if (!setting) return

    setLoading(true)
    try {
      const response = await fetch(`/api/system-settings/${setting.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        const updatedSetting = await response.json()
        onSettingUpdated(updatedSetting)
        setEditing(false)
        toast({
          title: "Success",
          description: "System setting updated successfully",
        })
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.error || "Failed to update system setting",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error updating system setting:', error)
      toast({
        title: "Error",
        description: "Failed to update system setting",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!setting) return

    // Confirmation removed - using toast notifications only

    setLoading(true)
    try {
      const response = await fetch(`/api/system-settings/${setting.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        onSettingDeleted(setting.id)
        onClose()
        toast({
          title: "Success",
          description: "System setting deleted successfully",
        })
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.error || "Failed to delete system setting",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error deleting system setting:', error)
      toast({
        title: "Error",
        description: "Failed to delete system setting",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'general': return Settings
      case 'security': return Shield
      case 'notifications': return Bell
      case 'system': return Database
      case 'analytics': return BarChart3
      default: return Settings
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'general': return 'bg-blue-100 text-blue-800'
      case 'security': return 'bg-red-100 text-red-800'
      case 'notifications': return 'bg-yellow-100 text-yellow-800'
      case 'system': return 'bg-purple-100 text-purple-800'
      case 'analytics': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'string': return 'bg-blue-100 text-blue-800'
      case 'number': return 'bg-green-100 text-green-800'
      case 'boolean': return 'bg-yellow-100 text-yellow-800'
      case 'json': return 'bg-purple-100 text-purple-800'
      case 'array': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
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

  if (!setting) return null

  const CategoryIcon = getCategoryIcon(setting.category)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CategoryIcon className="w-5 h-5 text-blue-600" />
            System Setting Details
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header Info */}
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{setting.key}</h3>
              <div className="flex items-center gap-2 mb-3">
                <Badge className={getCategoryColor(setting.category)}>
                  {setting.category}
                </Badge>
                <Badge className={getTypeColor(setting.type)}>
                  {setting.type}
                </Badge>
                {!setting.isEditable && (
                  <Badge variant="outline" className="text-red-600 border-red-600">
                    <Lock className="w-3 h-3 mr-1" />
                    Read Only
                  </Badge>
                )}
                {setting.isPublic && (
                  <Badge variant="outline" className="text-green-600 border-green-600">
                    <Globe className="w-3 h-3 mr-1" />
                    Public
                  </Badge>
                )}
              </div>
              {setting.description && (
                <p className="text-gray-600">{setting.description}</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              {setting.isEditable && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditing(!editing)}
                  className="edugenius-glass"
                >
                  {editing ? <X className="w-4 h-4" /> : <Edit className="w-4 h-4" />}
                </Button>
              )}
              {setting.isEditable && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDelete}
                  disabled={loading}
                  className="edugenius-glass text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Form Fields */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="value">Value</Label>
              {editing ? (
                <Input
                  id="value"
                  value={formData.value}
                  onChange={(e) => handleInputChange('value', e.target.value)}
                  placeholder={getValuePlaceholder(formData.type)}
                  className="edugenius-glass"
                />
              ) : (
                <div className="p-3 bg-gray-50 rounded-md font-mono text-sm">
                  {setting.type === 'boolean' ? (setting.value === 'true' ? 'Yes' : 'No') : setting.value}
                </div>
              )}
              {editing && formData.value && !validateValue(formData.value, formData.type) && (
                <p className="text-xs text-red-500">
                  Invalid {formData.type} format
                </p>
              )}
            </div>

            {editing && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="type">Data Type</Label>
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

                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
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
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Brief description of the setting"
                    className="edugenius-glass"
                    rows={3}
                  />
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
              </>
            )}
          </div>

          {/* Metadata */}
          <div className="pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
              <div>
                <span className="font-medium">Created:</span> {new Date(setting.createdAt).toLocaleString()}
              </div>
              <div>
                <span className="font-medium">Last Updated:</span> {new Date(setting.updatedAt).toLocaleString()}
              </div>
              <div>
                <span className="font-medium">Updated By:</span> {setting.updatedByUser.firstName} {setting.updatedByUser.lastName}
              </div>
              <div>
                <span className="font-medium">Setting ID:</span> {setting.id}
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
                disabled={loading || !validateValue(formData.value, formData.type)}
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
                    Update Setting
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
