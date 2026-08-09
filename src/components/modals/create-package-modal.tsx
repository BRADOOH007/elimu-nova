'use client'

import { useState } from 'react'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogBody,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Loader2, Package, Plus, X } from 'lucide-react'

interface CreatePackageModalProps {
  isOpen: boolean
  onClose: () => void
  onPackageCreated: (packageData: any) => void
}

export default function CreatePackageModal({
  isOpen,
  onClose,
  onPackageCreated
}: CreatePackageModalProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    duration: '',
    maxTeachers: '',
    maxStudents: '',
    features: [] as string[],
    isActive: true
  })
  const [newFeature, setNewFeature] = useState('')
  const { toast } = useToast()

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleAddFeature = () => {
    if (newFeature.trim() && !formData.features.includes(newFeature.trim())) {
      setFormData(prev => ({
        ...prev,
        features: [...prev.features, newFeature.trim()]
      }))
      setNewFeature('')
    }
  }

  const handleRemoveFeature = (index: number) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index)
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name || !formData.description || !formData.price || !formData.duration || !formData.maxTeachers || !formData.maxStudents) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please fill in all required fields",
      })
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/packages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          price: parseFloat(formData.price),
          duration: parseInt(formData.duration),
          maxTeachers: parseInt(formData.maxTeachers),
          maxStudents: parseInt(formData.maxStudents)
        }),
      })

      if (response.ok) {
        const packageData = await response.json()
        onPackageCreated(packageData)
        setFormData({
          name: '',
          description: '',
          price: '',
          duration: '',
          maxTeachers: '',
          maxStudents: '',
          features: [],
          isActive: true
        })
        setNewFeature('')
        toast({
          title: "Success",
          description: "Package created successfully",
        })
      } else {
        const error = await response.json()
        toast({
          variant: "destructive",
          title: "Error",
          description: error.error || "Failed to create package",
        })
      }
    } catch (error) {
      console.error('Error creating package:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create package",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] bg-gradient-to-br from-white via-blue-50 to-purple-50">
        <DialogHeader>
          <DialogTitle className="edugenius-text-gradient-blue flex items-center">
            <Package className="w-5 h-5 mr-2" />
            Create New Package
          </DialogTitle>
          <DialogDescription>
            Create a new subscription package with pricing and features. Fill in the required information below.
          </DialogDescription>
        </DialogHeader>

        <form id="create-package-form" onSubmit={handleSubmit} className="contents">
          <DialogBody className="space-y-6 mt-1">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Package Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Enter package name"
                  required
                  className="edugenius-glass"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">Price (USD) *</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={(e) => handleInputChange('price', e.target.value)}
                  placeholder="Enter price"
                  required
                  className="edugenius-glass"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Enter package description"
                required
                className="edugenius-glass"
                rows={3}
              />
            </div>

            {/* Duration and Limits */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="duration">Duration (Days) *</Label>
                <Input
                  id="duration"
                  type="number"
                  min="1"
                  value={formData.duration}
                  onChange={(e) => handleInputChange('duration', e.target.value)}
                  placeholder="Enter duration"
                  required
                  className="edugenius-glass"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxTeachers">Max Teachers *</Label>
                <Input
                  id="maxTeachers"
                  type="number"
                  min="1"
                  value={formData.maxTeachers}
                  onChange={(e) => handleInputChange('maxTeachers', e.target.value)}
                  placeholder="Enter max teachers"
                  required
                  className="edugenius-glass"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxStudents">Max Students *</Label>
                <Input
                  id="maxStudents"
                  type="number"
                  min="1"
                  value={formData.maxStudents}
                  onChange={(e) => handleInputChange('maxStudents', e.target.value)}
                  placeholder="Enter max students"
                  required
                  className="edugenius-glass"
                />
              </div>
            </div>

            {/* Features */}
            <div className="space-y-2">
              <Label>Features</Label>
              <div className="flex gap-2">
                <Input
                  value={newFeature}
                  onChange={(e) => setNewFeature(e.target.value)}
                  placeholder="Enter a feature"
                  className="edugenius-glass"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleAddFeature()
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddFeature}
                  disabled={!newFeature.trim()}
                  className="edugenius-glass"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              {formData.features.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.features.map((feature, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                    >
                      <span>{feature}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveFeature(index)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Status */}
            <div className="flex items-center space-x-2">
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => handleInputChange('isActive', checked)}
              />
              <Label htmlFor="isActive">Active Package</Label>
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
              form="create-package-form"
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
                  <Package className="w-4 h-4 mr-2" />
                  Create Package
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
