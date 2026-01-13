'use client'

import { useState, useEffect } from 'react'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Package, Edit, Save, X, Plus, Trash2, Users, DollarSign, Calendar, CheckCircle, XCircle } from 'lucide-react'

interface PackageDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  packageId: string
  onPackageUpdated: (packageData: any) => void
  onPackageDeleted: (packageId: string) => void
}

interface PackageData {
  id: string
  name: string
  description: string
  price: number
  duration: number
  maxTeachers: number
  maxStudents: number
  features: string[]
  isActive: boolean
  createdAt: string
  updatedAt: string
  subscriptions: Array<{
    id: string
    school: {
      id: string
      name: string
      email: string
    }
  }>
  _count: {
    subscriptions: number
  }
}

export default function PackageDetailsModal({
  isOpen,
  onClose,
  packageId,
  onPackageUpdated,
  onPackageDeleted
}: PackageDetailsModalProps) {
  const [packageData, setPackageData] = useState<PackageData | null>(null)
  const [loading, setLoading] = useState(false)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
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

  const fetchPackage = async () => {
    if (!packageId) return
    
    setLoading(true)
    try {
      const response = await fetch(`/api/packages/${packageId}`)
      if (response.ok) {
        const data = await response.json()
        setPackageData(data)
        setFormData({
          name: data.name,
          description: data.description,
          price: data.price.toString(),
          duration: data.duration.toString(),
          maxTeachers: data.maxTeachers.toString(),
          maxStudents: data.maxStudents.toString(),
          features: data.features || [],
          isActive: data.isActive
        })
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to fetch package details",
        })
      }
    } catch (error) {
      console.error('Error fetching package:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch package details",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen && packageId) {
      fetchPackage()
    }
  }, [isOpen, packageId])

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

  const handleSave = async () => {
    if (!formData.name || !formData.description || !formData.price || !formData.duration || !formData.maxTeachers || !formData.maxStudents) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please fill in all required fields",
      })
      return
    }

    setSaving(true)
    try {
      const response = await fetch(`/api/packages/${packageId}`, {
        method: 'PUT',
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
        const updatedPackage = await response.json()
        setPackageData(updatedPackage)
        setEditing(false)
        onPackageUpdated(updatedPackage)
        toast({
          title: "Success",
          description: "Package updated successfully",
        })
      } else {
        const error = await response.json()
        toast({
          variant: "destructive",
          title: "Error",
          description: error.error || "Failed to update package",
        })
      }
    } catch (error) {
      console.error('Error updating package:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update package",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    // Confirmation removed - using toast notifications only

    try {
      const response = await fetch(`/api/packages/${packageId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        onPackageDeleted(packageId)
        toast({
          title: "Success",
          description: "Package deleted successfully",
        })
      } else {
        const error = await response.json()
        toast({
          variant: "destructive",
          title: "Error",
          description: error.error || "Failed to delete package",
        })
      }
    } catch (error) {
      console.error('Error deleting package:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete package",
      })
    }
  }

  if (loading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto bg-gradient-to-br from-white via-blue-50 to-purple-50">
          <DialogHeader>
            <DialogTitle className="edugenius-text-gradient-blue">Loading Package Details</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            <span className="ml-3 text-gray-500">Loading package details...</span>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  if (!packageData) {
    return null
  }

  const getStatusColor = (isActive: boolean) => {
    return isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
  }

  const getStatusIcon = (isActive: boolean) => {
    return isActive ? CheckCircle : XCircle
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto bg-gradient-to-br from-white via-blue-50 to-purple-50">
        <DialogHeader className="sticky top-0 bg-gradient-to-br from-white via-blue-50 to-purple-50 z-10 pb-4">
          <DialogTitle className="edugenius-text-gradient-blue flex items-center justify-between">
            <div className="flex items-center">
              <Package className="w-5 h-5 mr-2" />
              Package Details
            </div>
            <div className="flex items-center space-x-2">
              {editing ? (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditing(false)
                      setFormData({
                        name: packageData.name,
                        description: packageData.description,
                        price: packageData.price.toString(),
                        duration: packageData.duration.toString(),
                        maxTeachers: packageData.maxTeachers.toString(),
                        maxStudents: packageData.maxStudents.toString(),
                        features: packageData.features || [],
                        isActive: packageData.isActive
                      })
                    }}
                    className="edugenius-glass"
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSave}
                    disabled={saving}
                    className="edugenius-button"
                  >
                    {saving ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
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
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDelete}
                    className="edugenius-glass text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </Button>
                </>
              )}
            </div>
          </DialogTitle>
          <DialogDescription>
            View and manage package information and subscription details
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 pb-4">
          {/* Package Information */}
          <Card className="bg-gradient-to-br from-white/70 to-blue-50/70 backdrop-blur-sm border-0">
            <CardHeader>
              <CardTitle className="edugenius-text-gradient-blue">Package Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Package Name</Label>
                  {editing ? (
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className="edugenius-glass"
                    />
                  ) : (
                    <p className="text-lg font-semibold text-gray-900">{packageData.name}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price">Price (USD)</Label>
                  {editing ? (
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.price}
                      onChange={(e) => handleInputChange('price', e.target.value)}
                      className="edugenius-glass"
                    />
                  ) : (
                    <p className="text-lg font-semibold text-green-600">${packageData.price.toLocaleString()}</p>
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
                  <p className="text-gray-700">{packageData.description}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="duration">Duration (Days)</Label>
                  {editing ? (
                    <Input
                      id="duration"
                      type="number"
                      min="1"
                      value={formData.duration}
                      onChange={(e) => handleInputChange('duration', e.target.value)}
                      className="edugenius-glass"
                    />
                  ) : (
                    <p className="text-gray-700">{packageData.duration} days</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxTeachers">Max Teachers</Label>
                  {editing ? (
                    <Input
                      id="maxTeachers"
                      type="number"
                      min="1"
                      value={formData.maxTeachers}
                      onChange={(e) => handleInputChange('maxTeachers', e.target.value)}
                      className="edugenius-glass"
                    />
                  ) : (
                    <p className="text-gray-700">{packageData.maxTeachers}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxStudents">Max Students</Label>
                  {editing ? (
                    <Input
                      id="maxStudents"
                      type="number"
                      min="1"
                      value={formData.maxStudents}
                      onChange={(e) => handleInputChange('maxStudents', e.target.value)}
                      className="edugenius-glass"
                    />
                  ) : (
                    <p className="text-gray-700">{packageData.maxStudents}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Label htmlFor="isActive">Status</Label>
                {editing ? (
                  <Switch
                    id="isActive"
                    checked={formData.isActive}
                    onCheckedChange={(checked) => handleInputChange('isActive', checked)}
                  />
                ) : (
                  <Badge className={getStatusColor(packageData.isActive)}>
                    {packageData.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Features */}
          <Card className="bg-gradient-to-br from-white/70 to-blue-50/70 backdrop-blur-sm border-0">
            <CardHeader>
              <CardTitle className="edugenius-text-gradient-blue">Features</CardTitle>
            </CardHeader>
            <CardContent>
              {editing ? (
                <div className="space-y-4">
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
                    <div className="flex flex-wrap gap-2">
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
              ) : (
                <div className="flex flex-wrap gap-2">
                  {packageData.features.length > 0 ? (
                    packageData.features.map((feature, index) => (
                      <Badge key={index} variant="secondary">
                        {feature}
                      </Badge>
                    ))
                  ) : (
                    <p className="text-gray-500">No features defined</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Subscription Statistics */}
          <Card className="bg-gradient-to-br from-white/70 to-blue-50/70 backdrop-blur-sm border-0">
            <CardHeader>
              <CardTitle className="edugenius-text-gradient-blue">Subscription Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">{packageData._count.subscriptions}</p>
                  <p className="text-sm text-gray-500">Total Subscriptions</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">{packageData.subscriptions.length}</p>
                  <p className="text-sm text-gray-500">Active Subscriptions</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-purple-600">${(packageData.price * packageData.subscriptions.length).toLocaleString()}</p>
                  <p className="text-sm text-gray-500">Total Revenue</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Active Subscriptions */}
          {packageData.subscriptions.length > 0 && (
            <Card className="bg-gradient-to-br from-white/70 to-blue-50/70 backdrop-blur-sm border-0">
              <CardHeader>
                <CardTitle className="edugenius-text-gradient-blue">Active Subscriptions</CardTitle>
                <CardDescription>Schools currently subscribed to this package</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {packageData.subscriptions.map((subscription) => (
                    <div key={subscription.id} className="flex items-center justify-between p-3 bg-white/50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">{subscription.school.name}</p>
                        <p className="text-sm text-gray-500">{subscription.school.email}</p>
                      </div>
                      <Badge variant="outline">Active</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Package Metadata */}
          <Card className="bg-gradient-to-br from-white/70 to-blue-50/70 backdrop-blur-sm border-0">
            <CardHeader>
              <CardTitle className="edugenius-text-gradient-blue">Package Metadata</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Created</p>
                  <p className="font-medium">{new Date(packageData.createdAt).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-gray-500">Last Updated</p>
                  <p className="font-medium">{new Date(packageData.updatedAt).toLocaleDateString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}
