'use client'

import { useState, useEffect, useMemo } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogBody, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Edit, 
  X, 
  User,
  Mail,
  Phone,
  MapPin,
  School,
  BookOpen,
  AlertCircle,
  Plus,
  XCircle
} from 'lucide-react'

interface EditStudentModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  student: any
  classes?: Array<{
    id: string
    name: string
    subject: string
    grade: string
  }>
}

export default function EditStudentModal({ isOpen, onClose, onSuccess, student, classes = [] }: EditStudentModalProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    classId: '',
    isActive: true,
    subjects: [] as string[]
  })
  const [customSubject, setCustomSubject] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  const DEFAULT_SUBJECTS = [
    'Mathematics', 'English', 'Kiswahili', 'Science & Technology',
    'Social Studies', 'CRE', 'Physical Education', 'Creative Arts',
    'Agriculture', 'Life Skills', 'Home Science', 'Computer Studies'
  ]

  // Derive available subjects from the teacher's classes, fallback to defaults
  const availableSubjects = useMemo(() => {
    const subjects = new Set<string>()
    classes.forEach(cls => { if (cls.subject) subjects.add(cls.subject) })
    if (subjects.size === 0) DEFAULT_SUBJECTS.forEach(s => subjects.add(s))
    return Array.from(subjects).sort()
  }, [classes])

  // Initialize form data when student changes
  useEffect(() => {
    if (student && isOpen) {
      setFormData({
        firstName: student.name?.split(' ')[0] || '',
        lastName: student.name?.split(' ').slice(1).join(' ') || '',
        email: student.email || '',
        phone: student.phone || '',
        address: student.address || '',
        classId: student.class?.id || '',
        isActive: student.status === 'Active',
        subjects: student.subjects || []
      })
      setCustomSubject('')
    }
  }, [student, isOpen])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required'
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required'
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setLoading(true)
    try {
      const response = await fetch(`/api/teacher/students/${student.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone || null,
          address: formData.address || null,
          classId: formData.classId === 'no-class' || formData.classId === 'no-classes' ? null : formData.classId,
          isActive: formData.isActive,
          subjects: formData.subjects
        })
      })

      if (response.ok) {
        onSuccess()
        onClose()
      } else {
        const error = await response.json()
        console.error('Error updating student:', error)
      }
    } catch (error) {
      console.error('Error updating student:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setErrors({})
    onClose()
  }

  if (!student) return null

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl bg-white border-0 shadow-2xl">
        <DialogHeader className="pb-4 border-b border-gray-100">
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
              <Edit className="w-5 h-5 text-white" />
            </div>
            Edit Student
          </DialogTitle>
          <DialogDescription className="text-gray-600 text-base mt-2">
            Update student information and class assignment.
          </DialogDescription>
        </DialogHeader>

        <DialogBody className="space-y-6 mt-1">
          <form id="edit-student-form" onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-6 space-y-6">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <User className="w-5 h-5 text-blue-600" />
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
              Email Address <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              id="email"
              type="email"
              value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="student@example.com"
                className="pl-10 bg-white border-gray-200 focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
            {errors.email && (
              <p className="text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.email}
              </p>
            )}
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
            <Label className="text-sm font-semibold text-gray-700">
              Assign to Class
            </Label>
            <Select
              value={formData.classId}
              onValueChange={(value) => setFormData(prev => ({ ...prev, classId: value }))}
            >
              <SelectTrigger className="bg-white border-gray-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                <SelectValue placeholder="Select a class for this student" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="no-class">No class assigned</SelectItem>
                {classes && classes.length > 0 ? (
                  classes.map((cls) => (
                    <SelectItem key={cls.id} value={cls.id}>
                      {cls.name} - {cls.subject} ({cls.grade})
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="no-classes" disabled>
                    No classes available
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-gray-700">
              Student Status
            </Label>
            <Select
              value={formData.isActive ? 'active' : 'inactive'}
              onValueChange={(value) => setFormData(prev => ({ ...prev, isActive: value === 'active' }))}
            >
              <SelectTrigger className="bg-white border-gray-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">✅ Active</SelectItem>
                <SelectItem value="inactive">❌ Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
          </div>

          {/* Learning Areas / Subjects */}
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-6 space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-amber-600" />
              Learning Areas / Subjects
            </h3>
            <p className="text-sm text-gray-500">Select the subjects this student is enrolled in.</p>
            <div className="flex flex-wrap gap-2">
              {availableSubjects.map(subject => {
                const selected = formData.subjects.includes(subject)
                return (
                  <button
                    key={subject}
                    type="button"
                    onClick={() => setFormData(prev => ({
                      ...prev,
                      subjects: selected
                        ? prev.subjects.filter(s => s !== subject)
                        : [...prev.subjects, subject]
                    }))}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                      selected
                        ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-amber-300'
                    }`}
                  >
                    {subject}
                  </button>
                )
              })}
            </div>
            {/* Custom subject input */}
            <div className="flex items-center gap-2">
              <Input
                value={customSubject}
                onChange={e => setCustomSubject(e.target.value)}
                placeholder="Add custom subject…"
                className="max-w-xs bg-white border-gray-200 text-sm"
                onKeyDown={e => {
                  if (e.key === 'Enter' && customSubject.trim()) {
                    e.preventDefault()
                    if (!formData.subjects.includes(customSubject.trim())) {
                      setFormData(prev => ({ ...prev, subjects: [...prev.subjects, customSubject.trim()] }))
                    }
                    setCustomSubject('')
                  }
                }}
              />
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={!customSubject.trim()}
                onClick={() => {
                  if (customSubject.trim() && !formData.subjects.includes(customSubject.trim())) {
                    setFormData(prev => ({ ...prev, subjects: [...prev.subjects, customSubject.trim()] }))
                  }
                  setCustomSubject('')
                }}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {formData.subjects.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {formData.subjects.map(s => (
                  <span key={s} className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full text-xs font-medium">
                    {s}
                    <button type="button" onClick={() => setFormData(prev => ({ ...prev, subjects: prev.subjects.filter(x => x !== s) }))}>
                      <XCircle className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Student Preview */}
          <div className="p-6 bg-gradient-to-br from-indigo-50 to-blue-50 rounded-xl border border-indigo-200">
            <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-indigo-600" />
              Student Preview
            </h4>
            <div className="space-y-2 text-sm text-gray-700">
              <p><strong>Name:</strong> {formData.firstName} {formData.lastName}</p>
              <p><strong>Email:</strong> {formData.email}</p>
              {formData.phone && <p><strong>Phone:</strong> {formData.phone}</p>}
              {formData.address && <p><strong>Address:</strong> {formData.address}</p>}
              <p><strong>Class:</strong> {
                formData.classId 
                  ? classes.find(c => c.id === formData.classId)?.name || 'Selected class'
                  : 'No class assigned'
              }</p>
              <p><strong>Subjects:</strong> {formData.subjects.length > 0 ? formData.subjects.join(', ') : 'None assigned'}</p>
              <p><strong>Status:</strong> {formData.isActive ? 'Active' : 'Inactive'}</p>
            </div>
          </div>

          </form>
        </DialogBody>
        <DialogFooter className="border-t border-gray-200">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            className="bg-white border-gray-200 hover:bg-gray-50 px-5 py-2.5 text-sm font-medium"
          >
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
          <Button
            type="submit"
            form="edit-student-form"
            disabled={loading}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg px-5 py-2.5 text-sm font-medium"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            ) : (
              <Edit className="w-4 h-4 mr-2" />
            )}
            {loading ? 'Updating...' : 'Update Student'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}