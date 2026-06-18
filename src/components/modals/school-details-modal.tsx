"use client"

import React, { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { useDeleteConfirmation } from "@/components/ui/delete-confirmation-dialog"
import { 
  X, 
  Save, 
  School,
  Loader2,
  Edit,
  Trash2,
  Users,
  DollarSign,
  Calendar,
  Mail,
  Phone,
  Globe,
  MapPin,
  UserPlus,
  Package
} from "lucide-react"

interface SchoolData {
  id: string
  name: string
  address: string
  phone?: string
  email?: string
  website?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
  schoolAdmin?: {
    user: {
      firstName: string
      lastName: string
      email: string
    }
  }
  teachers?: Array<{
    user: {
      firstName: string
      lastName: string
    }
  }>
  students?: Array<{
    id: string
  }>
  subscriptions?: Array<{
    id: string
    status: string
    startDate: string
    endDate: string
    package: {
      name: string
      price: number
    }
  }>
}

interface SchoolDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  schoolId: string | null
  onSchoolUpdated?: (schoolData: any) => void
  onSchoolDeleted?: (schoolId: string) => void
}

export function SchoolDetailsModal({ 
  isOpen, 
  onClose, 
  schoolId, 
  onSchoolUpdated, 
  onSchoolDeleted 
}: SchoolDetailsModalProps) {
  const { toast } = useToast()
  const { showDeleteConfirmation, DeleteConfirmationDialog } = useDeleteConfirmation()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editing, setEditing] = useState(false)
  const [schoolData, setSchoolData] = useState<SchoolData | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
    website: '',
    isActive: true
  })

  // Fetch school data when modal opens
  useEffect(() => {
    if (isOpen && schoolId) {
      fetchSchoolData()
    }
  }, [isOpen, schoolId])

  const fetchSchoolData = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/schools/${schoolId}`)
      if (response.ok) {
        const data = await response.json()
        setSchoolData(data)
        setFormData({
          name: data.name || '',
          address: data.address || '',
          phone: data.phone || '',
          email: data.email || '',
          website: data.website || '',
          isActive: data.isActive
        })
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to fetch school data",
        })
      }
    } catch (error) {
      console.error('Error fetching school data:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch school data",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      const response = await fetch(`/api/schools/${schoolId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      
      if (response.ok) {
        const updatedSchool = await response.json()
        setSchoolData(updatedSchool)
        setEditing(false)
        toast({
          variant: "success",
          title: "School Updated",
          description: "School information has been updated successfully!",
        })
        
        if (onSchoolUpdated) {
          onSchoolUpdated(updatedSchool)
        }
      } else {
        const errorData = await response.json()
        toast({
          variant: "destructive",
          title: "Update Failed",
          description: errorData.error || 'Failed to update school',
        })
      }
    } catch (error) {
      console.error('Error updating school:', error)
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: "Failed to update school. Please try again.",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!schoolData) return

    try {
      const response = await fetch(`/api/schools/${schoolId}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        toast({
          title: "School Deleted Successfully",
          description: `${schoolData.name} has been permanently removed from the system.`,
          variant: "success",
        })
        
        if (onSchoolDeleted) {
          onSchoolDeleted(schoolId!)
        }
        
        onClose()
      } else {
        const errorData = await response.json()
        toast({
          variant: "destructive",
          title: "Delete Failed",
          description: errorData.error || 'Unable to delete school. Please try again.',
        })
      }
    } catch (error) {
      console.error('Error deleting school:', error)
      toast({
        variant: "destructive",
        title: "Delete Failed",
        description: "Network error occurred. Please check your connection and try again.",
      })
    }
  }

  const handleDeleteClick = () => {
    if (!schoolData) return
    
    showDeleteConfirmation(
      'Delete School',
      'Are you sure you want to delete this school? This will permanently remove all school data, users, and associated records.',
      schoolData.name,
      handleDelete
    )
  }

  const handleClose = () => {
    if (!saving) {
      setEditing(false)
      setFormData({
        name: '',
        address: '',
        phone: '',
        email: '',
        website: '',
        isActive: true
      })
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <>
      <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50 flex-shrink-0">
          <div className="flex items-center space-x-3">
            <School className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">
              {schoolData ? schoolData.name : 'School Details'}
            </h2>
          </div>
          <div className="flex items-center space-x-2">
            {schoolData && !editing && (
              <>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setEditing(true)}
                  disabled={loading}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleDeleteClick}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
              </>
            )}
            <Button variant="ghost" size="sm" onClick={handleClose} disabled={saving}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
              <span className="ml-3 text-gray-500">Loading school data...</span>
            </div>
          ) : schoolData ? (
            <div className="space-y-6">
              {/* School Information */}
              <Card className="bg-gradient-to-br from-white via-blue-50 to-purple-50 shadow-lg backdrop-blur-sm border-0">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <School className="w-5 h-5 text-blue-600" />
                    <span>School Information</span>
                  </CardTitle>
                  <CardDescription>Basic school details and contact information</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">School Name</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        disabled={!editing}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="address">Address</Label>
                      <Input
                        id="address"
                        value={formData.address}
                        onChange={(e) => handleInputChange('address', e.target.value)}
                        disabled={!editing}
                        className="mt-1"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        disabled={!editing}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        disabled={!editing}
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="website">Website</Label>
                      <Input
                        id="website"
                        value={formData.website}
                        onChange={(e) => handleInputChange('website', e.target.value)}
                        disabled={!editing}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="isActive">Status</Label>
                      <Select 
                        value={formData.isActive ? 'active' : 'inactive'} 
                        onValueChange={(value) => handleInputChange('isActive', value === 'active')}
                        disabled={!editing}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* School Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-gradient-to-br from-white via-green-50 to-blue-50 shadow-lg backdrop-blur-sm border-0">
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-3">
                      <Users className="w-8 h-8 text-green-600" />
                      <div>
                        <p className="text-2xl font-bold text-gray-900">
                          {schoolData.students?.length || 0}
                        </p>
                        <p className="text-sm text-gray-600">Total Students</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-white via-blue-50 to-purple-50 shadow-lg backdrop-blur-sm border-0">
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-3">
                      <UserPlus className="w-8 h-8 text-blue-600" />
                      <div>
                        <p className="text-2xl font-bold text-gray-900">
                          {schoolData.teachers?.length || 0}
                        </p>
                        <p className="text-sm text-gray-600">Total Teachers</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-white via-purple-50 to-pink-50 shadow-lg backdrop-blur-sm border-0">
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-3">
                      <Package className="w-8 h-8 text-purple-600" />
                      <div>
                        <p className="text-2xl font-bold text-gray-900">
                          {schoolData.subscriptions?.length || 0}
                        </p>
                        <p className="text-sm text-gray-600">Active Subscriptions</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Admin Information */}
              {schoolData.schoolAdmin && (
                <Card className="bg-gradient-to-br from-white via-blue-50 to-purple-50 shadow-lg backdrop-blur-sm border-0">
                  <CardHeader>
                    <CardTitle>School Administrator</CardTitle>
                    <CardDescription>Primary school administrator details</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                        <span className="text-white font-semibold">
                          {schoolData.schoolAdmin.user.firstName[0]}{schoolData.schoolAdmin.user.lastName[0]}
                        </span>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">
                          {schoolData.schoolAdmin.user.firstName} {schoolData.schoolAdmin.user.lastName}
                        </h4>
                        <p className="text-sm text-gray-600">{schoolData.schoolAdmin.user.email}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Subscriptions */}
              {schoolData.subscriptions && schoolData.subscriptions.length > 0 && (
                <Card className="bg-gradient-to-br from-white via-blue-50 to-purple-50 shadow-lg backdrop-blur-sm border-0">
                  <CardHeader>
                    <CardTitle>Active Subscriptions</CardTitle>
                    <CardDescription>Current subscription packages</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {schoolData.subscriptions.map((subscription) => (
                        <div key={subscription.id} className="flex items-center justify-between p-3 bg-white/70 rounded-lg">
                          <div>
                            <h5 className="font-medium text-gray-900">{subscription.package.name}</h5>
                            <p className="text-sm text-gray-600">
                              ${subscription.package.price.toLocaleString()} per {subscription.package.name}
                            </p>
                          </div>
                          <div className="text-right">
                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                              subscription.status === 'ACTIVE' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {subscription.status}
                            </span>
                            <p className="text-xs text-gray-500 mt-1">
                              {new Date(subscription.startDate).toLocaleDateString()} - {new Date(subscription.endDate).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <School className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No school data available</p>
            </div>
          )}
        </div>

        {/* Footer - Always visible when editing */}
        {editing && (
          <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50 flex-shrink-0">
            <Button variant="outline" onClick={() => setEditing(false)} disabled={saving}>
              Cancel
            </Button>
            <Button 
              onClick={handleSave}
              disabled={saving}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
    <DeleteConfirmationDialog />
  </>
  )
}
