'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Plus, 
  X, 
  UserPlus,
  Mail,
  Phone,
  MapPin,
  School,
  AlertCircle
} from 'lucide-react'

interface EnrollStudentModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  classes?: Array<{
    id: string
    name: string
    subject: string
    grade: string
  }>
}

export default function EnrollStudentModal({ isOpen, onClose, onSuccess, classes = [] }: EnrollStudentModalProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    classId: ''
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [successData, setSuccessData] = useState<{
    email: string
    password: string
  } | null>(null)

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required'
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required'
    }

    // Email is optional — if provided it must be valid
    if (formData.email.trim() && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email format is invalid'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setLoading(true)
    try {
      const response = await fetch('/api/teacher/students', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone || null,
          address: formData.address || null,
          classId: formData.classId === 'no-classes' ? null : formData.classId
        })
      })

      if (response.ok) {
        const data = await response.json()
        setSuccessData(data.credentials)
        // Don't close immediately - show credentials first
      } else {
        const error = await response.json()
        setErrors({ submit: error.error || 'Failed to enroll student' })
      }
    } catch (error) {
      console.error('Error enrolling student:', error)
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      address: '',
      classId: ''
    })
    setErrors({})
    setSuccessData(null)
  }

  const handleClose = () => {
    if (successData) {
      onSuccess()
    }
    resetForm()
    onClose()
  }

  const handleCopyCredentials = () => {
    if (successData) {
      const displayLogin = successData.email.endsWith('@student.local')
        ? successData.email.replace('@student.local', '')
        : successData.email
      const text = `Username: ${displayLogin}\nPassword: ${successData.password}`
      navigator.clipboard.writeText(text)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] bg-white border-0 shadow-2xl overflow-hidden">
        <div className="max-h-[85vh] overflow-y-auto px-1">
        <DialogHeader className="pb-4 border-b border-gray-100">
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
              <UserPlus className="w-5 h-5 text-white" />
            </div>
            Enroll New Student
          </DialogTitle>
          <DialogDescription className="text-gray-600 text-base mt-2">
            Add a new student to your class and generate their login credentials.
          </DialogDescription>
        </DialogHeader>

        {successData ? (
          <div className="space-y-6">
            <div className="p-6 bg-green-50 border-2 border-green-200 rounded-lg">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                  <UserPlus className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-green-900">Student Enrolled Successfully!</h3>
                  <p className="text-sm text-green-700">Login credentials have been generated</p>
                </div>
              </div>

              <div className="space-y-3 bg-white p-4 rounded-lg border border-green-200">
                <div>
                  <Label className="text-sm font-medium text-gray-700">Username / Login</Label>
                  <p className="text-gray-900 font-mono bg-gray-50 p-2 rounded">
                    {successData.email.endsWith('@student.local')
                      ? successData.email.replace('@student.local', '')
                      : successData.email}
                  </p>
                  {successData.email.endsWith('@student.local') && (
                    <p className="text-xs text-gray-500 mt-1">
                      (or full email: {successData.email})
                    </p>
                  )}
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Password</Label>
                  <p className="text-gray-900 font-mono bg-gray-50 p-2 rounded">{successData.password}</p>
                </div>
              </div>

              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  <strong>Important:</strong> Please share these credentials with the student.
                  The password is permanent — they can use it every time they log in.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={handleCopyCredentials}
                className="bg-white border-gray-200 hover:bg-gray-50"
              >
                Copy Credentials
              </Button>
              <Button
                type="button"
                onClick={handleClose}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg"
              >
                Done
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6 mt-6">
          {/* Error Message */}
          {errors.submit && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-800">
              <AlertCircle className="w-5 h-5" />
              <p className="text-sm">{errors.submit}</p>
            </div>
          )}

          {/* Basic Information */}
          <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-6 space-y-6">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-blue-600" />
              Student Information
            </h3>
            
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="firstName" className="text-sm font-semibold text-gray-700 flex items-center gap-1">
                First Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                placeholder="Enter first name"
                className="bg-white border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {errors.firstName && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.firstName}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastName" className="text-sm font-semibold text-gray-700 flex items-center gap-1">
                Last Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                placeholder="Enter last name"
                className="bg-white border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {errors.lastName && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.lastName}
                </p>
              )}
            </div>
          </div>
          </div>

          {/* Contact Information */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 space-y-6">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <Mail className="w-5 h-5 text-green-600" />
              Contact Details
            </h3>
            
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-semibold text-gray-700 flex items-center gap-1">
              Email Address <span className="text-gray-400 font-normal text-xs">(Optional)</span>
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="student@example.com (leave blank to auto-generate)"
                className="pl-10 bg-white border-gray-200 focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
            {errors.email && (
              <p className="text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.email}
              </p>
            )}
            <p className="text-xs text-gray-500">
              If left blank, a login username will be auto-generated from the student&apos;s name.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-sm font-semibold text-gray-700">
                Phone Number (Optional)
              </Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="+254 700 000 000"
                  className="pl-10 bg-white border-gray-200 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address" className="text-sm font-semibold text-gray-700">
                Address (Optional)
              </Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="Student's address"
                  className="pl-10 bg-white border-gray-200 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
          </div>

          {/* Class Selection */}
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <School className="w-5 h-5 text-purple-600" />
              Class Assignment
            </h3>
            
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-gray-700 flex items-center gap-1">
              Assign to Class <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formData.classId}
              onValueChange={(value) => setFormData(prev => ({ ...prev, classId: value }))}
            >
              <SelectTrigger className="bg-white border-gray-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                <SelectValue placeholder="Select a class for this student" />
              </SelectTrigger>
              <SelectContent>
                {classes && classes.length > 0 ? (
                  classes.map((cls) => (
                    <SelectItem key={cls.id} value={cls.id}>
                      {cls.name} - {cls.subject} ({cls.grade})
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="no-classes">
                    No class (Independent student)
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
            {errors.classId && (
              <p className="text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.classId}
              </p>
            )}
          </div>
          </div>

          {/* Student Preview */}
          <div className="p-6 bg-gradient-to-br from-indigo-50 to-blue-50 rounded-xl border border-indigo-200">
            <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-indigo-600" />
              Student Preview
            </h4>
            <div className="space-y-2 text-sm text-gray-700">
              <p><strong>Name:</strong> {formData.firstName || '—'} {formData.lastName || '—'}</p>
              <p><strong>Email/Login:</strong> {formData.email || 'Auto-generated from name'}</p>
              {formData.phone && <p><strong>Phone:</strong> {formData.phone}</p>}
              {formData.address && <p><strong>Address:</strong> {formData.address}</p>}
              <p><strong>Class:</strong> {
                formData.classId 
                  ? classes.find(c => c.id === formData.classId)?.name || 'Selected class'
                  : 'No class selected'
              }</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="bg-white border-gray-200 hover:bg-gray-50"
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <UserPlus className="w-4 h-4 mr-2" />
              )}
              {loading ? 'Enrolling...' : 'Enroll Student'}
            </Button>
          </div>
        </form>
        )}
        </div>
      </DialogContent>
    </Dialog>
  )
}