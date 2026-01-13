'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Eye, 
  X, 
  User,
  Mail,
  Phone,
  MapPin,
  School,
  Calendar,
  Key,
  Copy,
  Edit,
  Trash2,
  UserCheck,
  UserX
} from 'lucide-react'
import GeneratePasswordModal from './generate-password-modal'

interface ViewStudentModalProps {
  isOpen: boolean
  onClose: () => void
  student: any
  onEdit: (student: any) => void
  onDelete: (studentId: string) => void
  onGenerateCredentials: (studentId: string) => void
}

export default function ViewStudentModal({ isOpen, onClose, student, onEdit, onDelete, onGenerateCredentials }: ViewStudentModalProps) {
  const [loading, setLoading] = useState(false)
  const [studentData, setStudentData] = useState<any>(null)
  const [showPasswordModal, setShowPasswordModal] = useState(false)

  // Fetch detailed student data
  useEffect(() => {
    if (student && isOpen) {
      fetchStudentDetails()
    }
  }, [student, isOpen])

  const fetchStudentDetails = async () => {
    if (!student) return
    
    setLoading(true)
    try {
      const response = await fetch(`/api/teacher/students/${student.id}`)
      if (response.ok) {
        const data = await response.json()
        setStudentData(data.student)
      } else {
        console.error('Failed to fetch student details')
      }
    } catch (error) {
      console.error('Error fetching student details:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setStudentData(null)
    setShowPasswordModal(false)
    onClose()
  }

  const handlePasswordSuccess = (password: string) => {
    fetchStudentDetails()
    setShowPasswordModal(false)
  }

  const handleEdit = () => {
    onEdit(studentData || student)
    handleClose()
  }

  const handleDelete = () => {
    // Confirmation removed - using toast notifications only
  }

  const handleToggleStatus = async () => {
    if (!studentData) return
    
    try {
      const response = await fetch(`/api/teacher/students/${student.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          isActive: studentData.status === 'Inactive'
        })
      })

      if (response.ok) {
        fetchStudentDetails()
      } else {
        console.error('Failed to update student status')
      }
    } catch (error) {
      console.error('Error updating student status:', error)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  if (!student) return null

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] bg-white border-0 shadow-2xl overflow-hidden">
        <div className="max-h-[85vh] overflow-y-auto px-1">
        <DialogHeader className="pb-4 border-b border-gray-100">
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
              <Eye className="w-5 h-5 text-white" />
            </div>
            Student Details
          </DialogTitle>
          <DialogDescription className="text-gray-600 text-base mt-2">
            View detailed information about this student.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading student details...</p>
            </div>
          </div>
        ) : (
          <div className="space-y-6 mt-6">
            {/* Student Information */}
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-200">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                    <User className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{studentData?.name || student.name}</h3>
                    <p className="text-gray-600">{studentData?.email || student.email}</p>
                    <Badge className={
                      (studentData?.status || student.status) === 'Active' 
                        ? 'bg-green-100 text-green-800 mt-2' 
                        : 'bg-yellow-100 text-yellow-800 mt-2'
                    }>
                      {studentData?.status || student.status}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-3">
                  <Mail className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-medium text-gray-900">{studentData?.email || student.email}</p>
                  </div>
                </div>

                {(studentData?.phone || student.phone) && (
                  <div className="flex items-center space-x-3">
                    <Phone className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Phone</p>
                      <p className="font-medium text-gray-900">{studentData?.phone || student.phone}</p>
                    </div>
                  </div>
                )}

                {(studentData?.address || student.address) && (
                  <div className="flex items-center space-x-3 md:col-span-2">
                    <MapPin className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Address</p>
                      <p className="font-medium text-gray-900">{studentData?.address || student.address}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-center space-x-3">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Join Date</p>
                    <p className="font-medium text-gray-900">
                      {formatDate(studentData?.joinDate || student.joinDate)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Class Information */}
            {(studentData?.class || student.class) && (
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
                <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <School className="w-5 h-5 text-green-600" />
                  Class Assignment
                </h4>
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <School className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {(studentData?.class || student.class)?.name}
                    </p>
                    <p className="text-sm text-gray-600">
                      {(studentData?.class || student.class)?.subject} • {(studentData?.class || student.class)?.grade}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Login Credentials */}
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-200">
              <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Key className="w-5 h-5 text-purple-600" />
                Login Credentials
              </h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm text-gray-500">Username</p>
                    <p className="font-mono text-sm text-gray-900">{studentData?.email || student.email}</p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(studentData?.email || student.email)}
                    className="bg-white/70 backdrop-blur-sm border-0 shadow-sm hover:bg-white/90"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm text-gray-500">Password</p>
                    <p className="font-mono text-sm text-gray-900">
                      {studentData?.credentials?.password || 'Click Generate to create password'}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {studentData?.credentials?.password && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(studentData.credentials.password)}
                        className="bg-white/70 backdrop-blur-sm border-0 shadow-sm hover:bg-white/90"
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShowPasswordModal(true)}
                      className="bg-white/70 backdrop-blur-sm border-0 shadow-sm hover:bg-white/90"
                    >
                      <Key className="w-4 h-4 mr-1" />
                      {studentData?.credentials?.password ? 'Change Password' : 'Set Password'}
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
              <Button
                variant="outline"
                onClick={handleClose}
                className="bg-white border-gray-200 hover:bg-gray-50"
              >
                <X className="w-4 h-4 mr-2" />
                Close
              </Button>
              <Button
                variant="outline"
                onClick={handleToggleStatus}
                className="bg-white border-gray-200 hover:bg-gray-50"
              >
                {(studentData?.status || student.status) === 'Active' ? (
                  <>
                    <UserX className="w-4 h-4 mr-2" />
                    Deactivate
                  </>
                ) : (
                  <>
                    <UserCheck className="w-4 h-4 mr-2" />
                    Activate
                  </>
                )}
              </Button>
              <Button
                onClick={handleEdit}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg"
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Button>
              <Button
                variant="outline"
                onClick={handleDelete}
                className="bg-red-50 text-red-600 border-red-200 hover:bg-red-100"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
            </div>
          </div>
        )}
        </div>
      </DialogContent>

      {/* Password Generation Modal */}
      <GeneratePasswordModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        onSuccess={handlePasswordSuccess}
        studentName={studentData?.name || student?.name || 'Student'}
        studentId={student?.id || ''}
      />
    </Dialog>
  )
}
