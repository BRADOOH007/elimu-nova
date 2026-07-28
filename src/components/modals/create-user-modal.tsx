"use client"

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { Loader2, UserPlus, School, GraduationCap, User, Copy, Check, Eye, EyeOff, Mail, AlertCircle } from "lucide-react"

interface School {
  id: string
  name: string
}

interface CreatedUser {
  id: string
  username: string
  email: string
  firstName: string
  lastName: string
  role: string
  generatedPassword?: string
}

interface CreateUserModalProps {
  isOpen: boolean
  onClose: () => void
  onUserCreated: (user: any) => void
}

export function CreateUserModal({ isOpen, onClose, onUserCreated }: CreateUserModalProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [schools, setSchools] = useState<School[]>([])
  const [createdUser, setCreatedUser] = useState<CreatedUser | null>(null)
  const [showPwd, setShowPwd] = useState(false)
  const [copied, setCopied] = useState(false)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    role: '',
    schoolId: '',
    password: '',
    isActive: true
  })

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setCreatedUser(null)
      fetchSchools()
    }
  }, [isOpen])

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        const user = await response.json()
        onUserCreated(user)
        setCreatedUser(user)
        toast({
          variant: "default",
          title: "User Created",
          description: user.generatedPassword
            ? "Credentials generated — save them now"
            : "New user has been created successfully!",
        })
      } else {
        const error = await response.json()
        toast({
          variant: "destructive",
          title: "Error",
          description: error.error || "Failed to create user",
        })
      }
    } catch (error) {
      console.error('Error creating user:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create user",
      })
    } finally {
      setLoading(false)
    }
  }

  const copyCredentials = () => {
    if (!createdUser) return
    const text = `Username: ${createdUser.username}\nEmail: ${createdUser.email}\nPassword: ${createdUser.generatedPassword || '[your-password]'}`
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleClose = () => {
    setCreatedUser(null)
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      role: '',
      schoolId: '',
      password: '',
      isActive: true
    })
    onClose()
  }

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'SCHOOL_ADMIN':
        return <School className="w-4 h-4" />
      case 'TEACHER':
        return <GraduationCap className="w-4 h-4" />
      case 'STUDENT':
        return <User className="w-4 h-4" />
      default:
        return <UserPlus className="w-4 h-4" />
    }
  }

  const roleLabel = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN': return 'Super Admin'
      case 'SCHOOL_ADMIN': return 'School Admin'
      case 'TEACHER': return 'Teacher'
      case 'STUDENT': return 'Student'
      default: return role
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[95vh] overflow-hidden bg-white border-0 shadow-2xl">
        <div className="max-h-[85vh] overflow-y-auto px-1">
        <DialogHeader className="pb-4 border-b border-gray-100">
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
              <UserPlus className="w-5 h-5 text-white" />
            </div>
            {createdUser ? 'User Created' : 'Create New User'}
          </DialogTitle>
          <DialogDescription className="text-gray-600 text-base mt-2">
            {createdUser
              ? 'Save the credentials below and share them with the user. The password will not be shown again.'
              : 'Add a new user to the system. Fill in the required information below.'}
          </DialogDescription>
        </DialogHeader>

        {createdUser ? (
          // ── SUCCESS / CREDENTIAL SCREEN ──
          <div className="mt-6 space-y-6">
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                  <Check className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="font-semibold text-green-800">User Created Successfully</p>
                  <p className="text-sm text-green-600">{createdUser.firstName} {createdUser.lastName} &mdash; {roleLabel(createdUser.role)}</p>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-green-200 overflow-hidden">
                <div className="px-5 py-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Username</span>
                    <span className="text-sm font-medium text-gray-800">@{createdUser.username}</span>
                  </div>
                  <div className="border-t border-gray-100" />
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Email</span>
                    <span className="text-sm font-medium text-gray-800">{createdUser.email}</span>
                  </div>
                  <div className="border-t border-gray-100" />
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Password</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-mono font-bold text-gray-800">
                        {showPwd ? createdUser.generatedPassword : '••••••••••••••••'}
                      </span>
                      {createdUser.generatedPassword && (
                        <button type="button" onClick={() => setShowPwd(!showPwd)}
                          className="text-gray-400 hover:text-gray-600 transition-colors">
                          {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 mt-4">
                <Button type="button" onClick={copyCredentials}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg">
                  {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                  {copied ? 'Copied!' : 'Copy Credentials'}
                </Button>
              </div>

              <p className="text-xs text-gray-500 mt-3 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-gray-400" />
                Credentials were also emailed to {createdUser.email}. If email is not configured, use the copy button above.
              </p>
            </div>

            <div className="flex justify-end pt-4 border-t border-gray-200">
              <Button type="button" onClick={handleClose}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg">
                <Check className="w-4 h-4 mr-2" />
                Done
              </Button>
            </div>
          </div>
        ) : (
          // ── CREATE USER FORM ──
          <form onSubmit={handleSubmit} className="space-y-6 mt-6">
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-6 space-y-6">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <User className="w-5 h-5 text-blue-600" />
                User Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName" className="text-sm font-semibold text-gray-700 flex items-center gap-1">
                  First Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  placeholder="Enter first name"
                  required
                  className="bg-white border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName" className="text-sm font-semibold text-gray-700 flex items-center gap-1">
                  Last Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  placeholder="Enter last name"
                  required
                  className="bg-white border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-semibold text-gray-700 flex items-center gap-1">
                Email Address <span className="text-red-500">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="Enter email address"
                required
                className="bg-white border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="text-sm font-semibold text-gray-700">
                Phone Number
              </Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="Enter phone number"
                className="bg-white border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role" className="text-sm font-semibold text-gray-700 flex items-center gap-1">
                Role <span className="text-red-500">*</span>
              </Label>
              <Select value={formData.role} onValueChange={(value) => handleInputChange('role', value)}>
                <SelectTrigger className="bg-white border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <SelectValue placeholder="Select user role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SUPER_ADMIN">
                    <div className="flex items-center">
                      <UserPlus className="w-4 h-4 mr-2" />
                      Super Admin
                    </div>
                  </SelectItem>
                  <SelectItem value="SCHOOL_ADMIN">
                    <div className="flex items-center">
                      <School className="w-4 h-4 mr-2" />
                      School Admin
                    </div>
                  </SelectItem>
                  <SelectItem value="TEACHER">
                    <div className="flex items-center">
                      <GraduationCap className="w-4 h-4 mr-2" />
                      Teacher
                    </div>
                  </SelectItem>
                  <SelectItem value="STUDENT">
                    <div className="flex items-center">
                      <User className="w-4 h-4 mr-2" />
                      Student
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {['TEACHER', 'STUDENT', 'SCHOOL_ADMIN'].includes(formData.role) && (
              <div className="space-y-2">
                <Label htmlFor="school" className="text-sm font-semibold text-gray-700 flex items-center gap-1">
                  <School className="w-4 h-4" />
                  School <span className="text-red-500">*</span>
                </Label>
                <Select value={formData.schoolId} onValueChange={(value) => handleInputChange('schoolId', value)}>
                  <SelectTrigger className="bg-white border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent">
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
              <Label htmlFor="password" className="text-sm font-semibold text-gray-700">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                placeholder="Enter password (optional)"
                className="bg-white border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500">
                If no password is provided, a default password will be set
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => handleInputChange('isActive', checked)}
              />
              <Label htmlFor="isActive" className="text-sm font-medium text-gray-700">Active User</Label>
            </div>
            </div>

            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={loading}
                className="bg-white border-gray-200 hover:bg-gray-50"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Create User
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
