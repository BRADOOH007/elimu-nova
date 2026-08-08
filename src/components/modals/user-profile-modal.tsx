"use client"

import React, { useState, useEffect, useRef } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useToast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogHeader, DialogBody, DialogFooter } from "@/components/ui/dialog"
import { 
  User, 
  X, 
  Save, 
  Camera, 
  Mail, 
  Phone, 
  MapPin,
  Calendar,
  Shield,
  Edit
} from "lucide-react"

interface UserProfile {
  id: string
  firstName: string
  lastName: string
  email: string
  role: string
  avatar?: string
  phone?: string
  address?: string
  createdAt: string
  isActive: boolean
}

interface UserProfileModalProps {
  isOpen: boolean
  onClose: () => void
  userId: string
  onProfileUpdate?: (profile: UserProfile) => void
}

export function UserProfileModal({ isOpen, onClose, userId, onProfileUpdate }: UserProfileModalProps) {
  const { toast } = useToast()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [editing, setEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [previewAvatar, setPreviewAvatar] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    avatar: '',
    phone: '',
    address: ''
  })

  useEffect(() => {
    if (isOpen && userId) {
      fetchProfile()
    }
  }, [isOpen, userId])

  // Reset editing state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setEditing(false)
      setPreviewAvatar(null)
    }
  }, [isOpen])

  const fetchProfile = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/user-profile?userId=${userId}`)
      if (response.ok) {
        const data = await response.json()
        setProfile(data)
        setFormData({
          firstName: data.firstName,
          lastName: data.lastName,
          avatar: data.avatar || '',
          phone: data.phone || '',
          address: data.address || ''
        })
      } else {
        const err = await response.json().catch(() => ({ error: 'Unknown error' }))
        console.error('Failed to load profile:', err.error)
        toast({
          variant: "destructive",
          title: "Failed to Load Profile",
          description: err.error || 'An error occurred while loading your profile',
        })
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
      toast({
        variant: "destructive",
        title: "Failed to Load Profile",
        description: "Network error. Please try again.",
      })
    } finally {
      setLoading(false)
    }
  }

  const saveProfile = async () => {
    // Validate required fields
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "First name and last name are required",
      })
      return
    }

    try {
      setSaving(true)
      const response = await fetch('/api/user-profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          avatar: formData.avatar,
          phone: formData.phone.trim() || null,
          address: formData.address.trim() || null
        })
      })
      
      if (response.ok) {
        const updatedProfile = await response.json()
        setProfile(updatedProfile)
        setEditing(false)
        // Clear preview avatar after successful save
        setPreviewAvatar(null)
        if (onProfileUpdate) {
          onProfileUpdate(updatedProfile)
        }
        // Show success message
        toast({
          variant: "default",
          title: "Profile Updated",
          description: "Your profile has been updated successfully!",
        })
        
      } else {
        const errorData = await response.json()
        toast({
          variant: "destructive",
          title: "Update Failed",
          description: errorData.error || 'Unknown error occurred',
        })
      }
    } catch (error) {
      console.error('Error saving profile:', error)
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: "Failed to update profile. Please try again.",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleCancelEdit = () => {
    if (profile) {
      setFormData({
        firstName: profile.firstName,
        lastName: profile.lastName,
        avatar: profile.avatar || '',
        phone: profile.phone || '',
        address: profile.address || ''
      })
    }
    setPreviewAvatar(null)
    setEditing(false)
  }

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        variant: "destructive",
        title: "Invalid File Type",
        description: "Please select an image file",
      })
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        variant: "destructive",
        title: "File Too Large",
        description: "File size must be less than 5MB",
      })
      return
    }

    try {
      setUploadingAvatar(true)

      // Show local preview immediately
      const previewReader = new FileReader()
      previewReader.onload = (e) => {
        setPreviewAvatar(e.target?.result as string)
      }
      previewReader.readAsDataURL(file)

      // Upload to Cloudinary via the API
      const uploadFormData = new FormData()
      uploadFormData.append('file', file)
      const res = await fetch('/api/upload-avatar', {
        method: 'POST',
        body: uploadFormData,
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Upload failed' }))
        throw new Error(err.error || 'Upload failed')
      }

      const { url } = await res.json()
      setFormData(prev => ({ ...prev, avatar: url }))
    } catch (error) {
      console.error('Error uploading avatar:', error)
      toast({
        variant: "destructive",
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "Failed to upload avatar. Please try again.",
      })
      setPreviewAvatar(null)
    } finally {
      setUploadingAvatar(false)
    }
  }

  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN': return 'Super Administrator'
      case 'SCHOOL_ADMIN': return 'School Administrator'
      case 'TEACHER': return 'Teacher'
      case 'STUDENT': return 'Student'
      default: return role
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN': return 'bg-red-100 text-red-800'
      case 'SCHOOL_ADMIN': return 'bg-blue-100 text-blue-800'
      case 'TEACHER': return 'bg-green-100 text-green-800'
      case 'STUDENT': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (!isOpen) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl [&>button]:hidden">
        <DialogHeader className="flex flex-row items-center justify-between p-6 pb-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 via-purple-50 to-blue-50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center shadow-md">
              <User className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                User Profile
              </h2>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} className="hover:bg-white/50">
            <X className="w-5 h-5" />
          </Button>
        </DialogHeader>

        <DialogBody className="mt-1">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-500">Loading profile...</p>
            </div>
          ) : profile ? (
            <div className="space-y-6">
              {/* Profile Header */}
              <Card className="bg-gradient-to-br from-blue-50 to-purple-50 shadow-lg border-0">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="relative">
                      <Avatar className="w-24 h-24 border-4 border-white shadow-lg">
                        <AvatarImage src={previewAvatar || formData.avatar || profile.avatar} />
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-2xl font-bold">
                          {profile.firstName[0]}{profile.lastName[0]}
                        </AvatarFallback>
                      </Avatar>
                      <Button
                        size="sm"
                        className="absolute -bottom-1 -right-1 w-10 h-10 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg border-2 border-white"
                        onClick={triggerFileInput}
                        disabled={uploadingAvatar}
                      >
                        {uploadingAvatar ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        ) : (
                          <Camera className="w-4 h-4" />
                        )}
                      </Button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarUpload}
                        className="hidden"
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold text-gray-900">
                        {profile.firstName} {profile.lastName}
                      </h3>
                      <p className="text-gray-600 flex items-center space-x-2">
                        <Mail className="w-4 h-4" />
                        <span>{profile.email}</span>
                      </p>
                      {profile.phone && (
                        <p className="text-gray-600 flex items-center space-x-2">
                          <Phone className="w-4 h-4" />
                          <span>{profile.phone}</span>
                        </p>
                      )}
                      {profile.address && (
                        <p className="text-gray-600 flex items-center space-x-2">
                          <MapPin className="w-4 h-4" />
                          <span>{profile.address}</span>
                        </p>
                      )}
                      <div className="flex items-center space-x-2 mt-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(profile.role)}`}>
                          {getRoleDisplayName(profile.role)}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          profile.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {profile.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Profile Details */}
              <Card className="bg-white shadow-lg border-0">
                <CardHeader className="bg-gradient-to-br from-blue-50 to-purple-50">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center space-x-2">
                      <User className="w-5 h-5 text-blue-600" />
                      <span>Profile Information</span>
                    </CardTitle>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={editing ? handleCancelEdit : () => setEditing(true)}
                      className="bg-white border-gray-200 hover:bg-gray-50"
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      {editing ? 'Cancel' : 'Edit'}
                    </Button>
                  </div>
                  <CardDescription>Manage your personal information</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        value={editing ? formData.firstName : profile.firstName}
                        onChange={(e) => handleInputChange('firstName', e.target.value)}
                        disabled={!editing}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        value={editing ? formData.lastName : profile.lastName}
                        onChange={(e) => handleInputChange('lastName', e.target.value)}
                        disabled={!editing}
                        className="mt-1"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      value={profile.email}
                      disabled
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      value={editing ? formData.phone : (profile.phone || '')}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      disabled={!editing}
                      placeholder="Enter phone number"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="address">Address</Label>
                    <Input
                      id="address"
                      value={editing ? formData.address : (profile.address || '')}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      disabled={!editing}
                      placeholder="Enter address"
                      className="mt-1"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Account Information */}
              <Card className="bg-white shadow-lg border-0">
                <CardHeader className="bg-gradient-to-br from-green-50 to-emerald-50">
                  <CardTitle className="flex items-center space-x-2">
                    <Shield className="w-5 h-5 text-green-600" />
                    <span>Account Information</span>
                  </CardTitle>
                  <CardDescription>Account details and security</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center space-x-3">
                      <Calendar className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Member Since</p>
                        <p className="text-sm text-gray-500">
                          {new Date(profile.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Shield className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Account Status</p>
                        <p className="text-sm text-gray-500">
                          {profile.isActive ? 'Active' : 'Inactive'}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="text-center py-8">
              <User className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">Failed to load profile</p>
              <Button variant="outline" size="sm" onClick={() => fetchProfile()}>
                Retry
              </Button>
            </div>
          )}
        </DialogBody>

        {/* Footer */}
        {editing && (
          <DialogFooter className="border-t border-gray-100 bg-gradient-to-br from-gray-50 to-white">
            <Button 
              variant="outline" 
              onClick={handleCancelEdit}
              className="bg-white border-gray-200 hover:bg-gray-50 px-5 py-2.5 text-sm font-medium"
            >
              Cancel
            </Button>
            <Button 
              onClick={saveProfile} 
              disabled={saving}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg px-5 py-2.5 text-sm font-medium"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}
