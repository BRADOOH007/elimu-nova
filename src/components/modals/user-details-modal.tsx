"use client"

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { useDeleteConfirmation } from "@/components/ui/delete-confirmation-dialog"
import { 
  Loader2, 
  User, 
  School, 
  GraduationCap, 
  Mail, 
  Phone, 
  Calendar,
  Edit,
  Trash2,
  Save,
  X,
  Shield,
  Clock,
  MapPin
} from "lucide-react"

interface School {
  id: string
  name: string
}

interface User {
  id: string
  firstName: string
  lastName: string
  email: string
  phone?: string
  role: string
  isActive: boolean
  createdAt: string
  updatedAt: string
  lastLogin?: string
  schoolAdmin?: {
    school: {
      id: string
      name: string
      address: string
      phone?: string
      email?: string
    }
  }
  teacher?: {
    school: {
      id: string
      name: string
      address: string
      phone?: string
      email?: string
    }
  }
  student?: {
    school: {
      id: string
      name: string
      address: string
      phone?: string
      email?: string
    }
  }
}

interface UserDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  userId: string | null
  onUserUpdated: (user: User) => void
  onUserDeleted: (userId: string) => void
}

export function UserDetailsModal({ 
  isOpen, 
  onClose, 
  userId, 
  onUserUpdated, 
  onUserDeleted 
}: UserDetailsModalProps) {
  const { toast } = useToast()
  const { showDeleteConfirmation, DeleteConfirmationDialog } = useDeleteConfirmation()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editing, setEditing] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [schools, setSchools] = useState<School[]>([])
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    role: '',
    schoolId: '',
    isActive: true
  })

  // Fetch user data
  const fetchUser = async () => {
    if (!userId) return

    setLoading(true)
    try {
      const response = await fetch(`/api/users/${userId}`)
      if (response.ok) {
        const userData = await response.json()
        setUser(userData)
        setFormData({
          firstName: userData.firstName,
          lastName: userData.lastName,
          email: userData.email,
          phone: userData.phone || '',
          role: userData.role,
          schoolId: userData.schoolAdmin?.school?.id || 
                   userData.teacher?.school?.id || 
                   userData.student?.school?.id || '',
          isActive: userData.isActive
        })
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to fetch user details",
        })
      }
    } catch (error) {
      console.error('Error fetching user:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch user details",
      })
    } finally {
      setLoading(false)
    }
  }

  // Fetch schools
  const fetchSchools = async () => {
    try {
      const response = await fetch('/api/schools?limit=100')
      if (response.ok) {
        const data = await response.json()
        setSchools(data.schools)
      }
    } catch (error) {
      console.error('Error fetching schools:', error)
    }
  }

  useEffect(() => {
    if (isOpen && userId) {
      fetchUser()
      fetchSchools()
    }
  }, [isOpen, userId])

  const handleSave = async () => {
    if (!userId) return

    setSaving(true)
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        const updatedUser = await response.json()
        setUser(updatedUser)
        onUserUpdated(updatedUser)
        setEditing(false)
        toast({
          variant: "success",
          title: "User Updated",
          description: "User information has been updated successfully!",
        })
      } else {
        const error = await response.json()
        toast({
          variant: "destructive",
          title: "Error",
          description: error.error || "Failed to update user",
        })
      }
    } catch (error) {
      console.error('Error updating user:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update user",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!userId || !user) return

    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        onUserDeleted(userId)
        onClose()
        toast({
          title: "User Deleted Successfully",
          description: `${user.firstName} ${user.lastName} has been permanently removed from the system.`,
          variant: "success",
        })
      } else {
        const error = await response.json()
        toast({
          variant: "destructive",
          title: "Delete Failed",
          description: error.error || "Unable to delete user. Please try again.",
        })
      }
    } catch (error) {
      console.error('Error deleting user:', error)
      toast({
        variant: "destructive",
        title: "Delete Failed",
        description: "Network error occurred. Please check your connection and try again.",
      })
    }
  }

  const handleDeleteClick = () => {
    if (!user) return
    
    showDeleteConfirmation(
      'Delete User',
      'Are you sure you want to delete this user? This will permanently remove all their data, assignments, and access to the system.',
      `${user.firstName} ${user.lastName}`,
      handleDelete
    )
  }

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return <Shield className="w-4 h-4" />
      case 'SCHOOL_ADMIN':
        return <School className="w-4 h-4" />
      case 'TEACHER':
        return <GraduationCap className="w-4 h-4" />
      case 'STUDENT':
        return <User className="w-4 h-4" />
      default:
        return <User className="w-4 h-4" />
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return 'bg-red-100 text-red-800'
      case 'SCHOOL_ADMIN':
        return 'bg-blue-100 text-blue-800'
      case 'TEACHER':
        return 'bg-green-100 text-green-800'
      case 'STUDENT':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getSchoolInfo = () => {
    if (user?.schoolAdmin?.school) return user.schoolAdmin.school
    if (user?.teacher?.school) return user.teacher.school
    if (user?.student?.school) return user.student.school
    return null
  }

  const requiresSchool = ['SCHOOL_ADMIN', 'TEACHER', 'STUDENT'].includes(formData.role)

  if (loading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[600px] bg-gradient-to-br from-white via-blue-50 to-purple-50 [&>button]:hidden">
          <DialogHeader>
            <DialogTitle className="edugenius-text-gradient-blue">Loading User Details</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            <span className="ml-3 text-gray-500">Loading user details...</span>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  if (!user) {
    return null
  }

  const schoolInfo = getSchoolInfo()

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] bg-gradient-to-br from-white via-blue-50 to-purple-50 flex flex-col gap-0 p-0 [&>button]:hidden">
        {/* Header - Fixed */}
        <div className="flex-shrink-0 p-6 border-b border-gray-200">
          <DialogHeader>
            <DialogTitle className="edugenius-text-gradient-blue flex items-center justify-between">
              <div className="flex items-center">
                {getRoleIcon(user.role)}
                <span className="ml-2">User Details</span>
              </div>
              <div className="flex items-center space-x-2">
                {editing ? (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditing(false)}
                      disabled={saving}
                      className="edugenius-glass"
                    >
                      <X className="w-4 h-4 mr-1" />
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSave}
                      disabled={saving}
                      className="edugenius-button"
                    >
                      {saving ? (
                        <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4 mr-1" />
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
                      <Edit className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleDeleteClick}
                      className="edugenius-glass text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Delete
                    </Button>
                  </>
                )}
              </div>
            </DialogTitle>
            <DialogDescription>
              View and manage user information and permissions
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* User Information */}
          <Card className="bg-gradient-to-br from-white/70 to-blue-50/70 backdrop-blur-sm border-0">
            <CardHeader>
              <CardTitle className="edugenius-text-gradient-blue">User Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  {editing ? (
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) => handleInputChange('firstName', e.target.value)}
                      className="edugenius-glass"
                    />
                  ) : (
                    <p className="text-sm font-medium text-gray-900">{user.firstName}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  {editing ? (
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) => handleInputChange('lastName', e.target.value)}
                      className="edugenius-glass"
                    />
                  ) : (
                    <p className="text-sm font-medium text-gray-900">{user.lastName}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                {editing ? (
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="edugenius-glass"
                  />
                ) : (
                  <div className="flex items-center text-sm text-gray-900">
                    <Mail className="w-4 h-4 mr-2 text-gray-400" />
                    {user.email}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                {editing ? (
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className="edugenius-glass"
                  />
                ) : (
                  <div className="flex items-center text-sm text-gray-900">
                    <Phone className="w-4 h-4 mr-2 text-gray-400" />
                    {user.phone || 'Not provided'}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                {editing ? (
                  <Select value={formData.role} onValueChange={(value) => handleInputChange('role', value)}>
                    <SelectTrigger className="edugenius-glass">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
                      <SelectItem value="SCHOOL_ADMIN">School Admin</SelectItem>
                      <SelectItem value="TEACHER">Teacher</SelectItem>
                      <SelectItem value="STUDENT">Student</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="flex items-center">
                    {getRoleIcon(user.role)}
                    <span className={`ml-2 inline-flex px-3 py-1 text-sm font-medium rounded-full ${getRoleColor(user.role)}`}>
                      {user.role.replace('_', ' ')}
                    </span>
                  </div>
                )}
              </div>

              {editing && requiresSchool && (
                <div className="space-y-2">
                  <Label htmlFor="school">School</Label>
                  <Select value={formData.schoolId} onValueChange={(value) => handleInputChange('schoolId', value)}>
                    <SelectTrigger className="edugenius-glass">
                      <SelectValue placeholder="Select school" />
                    </SelectTrigger>
                    <SelectContent>
                      {schools.map((school) => (
                        <SelectItem key={school.id} value={school.id}>
                          {school.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="isActive">Status</Label>
                {editing ? (
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="isActive"
                      checked={formData.isActive}
                      onCheckedChange={(checked) => handleInputChange('isActive', checked)}
                    />
                    <Label htmlFor="isActive">
                      {formData.isActive ? 'Active' : 'Inactive'}
                    </Label>
                  </div>
                ) : (
                  <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${
                    user.isActive 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {user.isActive ? 'Active' : 'Inactive'}
                  </span>
                )}
              </div>
            </CardContent>
          </Card>

          {/* School Information */}
          {schoolInfo && (
            <Card className="bg-gradient-to-br from-white/70 to-green-50/70 backdrop-blur-sm border-0">
              <CardHeader>
                <CardTitle className="edugenius-text-gradient-green flex items-center">
                  <School className="w-5 h-5 mr-2" />
                  School Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center text-sm text-gray-900">
                  <School className="w-4 h-4 mr-2 text-gray-400" />
                  <span className="font-medium">{schoolInfo.name}</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                  {schoolInfo.address}
                </div>
                {schoolInfo.phone && (
                  <div className="flex items-center text-sm text-gray-600">
                    <Phone className="w-4 h-4 mr-2 text-gray-400" />
                    {schoolInfo.phone}
                  </div>
                )}
                {schoolInfo.email && (
                  <div className="flex items-center text-sm text-gray-600">
                    <Mail className="w-4 h-4 mr-2 text-gray-400" />
                    {schoolInfo.email}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Account Information */}
          <Card className="bg-gradient-to-br from-white/70 to-purple-50/70 backdrop-blur-sm border-0">
            <CardHeader>
              <CardTitle className="edugenius-text-gradient-purple flex items-center">
                <Clock className="w-5 h-5 mr-2" />
                Account Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center text-sm text-gray-600">
                <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                <span className="font-medium">Created:</span>
                <span className="ml-2">{new Date(user.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                <span className="font-medium">Last Updated:</span>
                <span className="ml-2">{new Date(user.updatedAt).toLocaleDateString()}</span>
              </div>
              {user.lastLogin && (
                <div className="flex items-center text-sm text-gray-600">
                  <Clock className="w-4 h-4 mr-2 text-gray-400" />
                  <span className="font-medium">Last Login:</span>
                  <span className="ml-2">{new Date(user.lastLogin).toLocaleDateString()}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
    <DeleteConfirmationDialog />
  </>
  )
}
