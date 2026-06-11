'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Key, 
  Copy, 
  Eye, 
  EyeOff, 
  Check,
  Loader2,
  AlertCircle,
  User,
  Mail,
  Calendar
} from "lucide-react"
import { toast } from "sonner"

interface Student {
  id: string
  name: string
  email: string
  joinDate: string
  status: string
  class?: {
    id: string
    name: string
    subject: string
    grade: string
  }
}

interface ViewStudentPasswordModalProps {
  isOpen: boolean
  onClose: () => void
  student: Student | null
  onPasswordGenerated?: () => void
}

export default function ViewStudentPasswordModal({
  isOpen,
  onClose,
  student,
  onPasswordGenerated
}: ViewStudentPasswordModalProps) {
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [copied, setCopied] = useState(false)
  const [hasPassword, setHasPassword] = useState(false)

  useEffect(() => {
    if (student && isOpen) {
      fetchPasswordInfo()
    }
  }, [student, isOpen])

  const fetchPasswordInfo = async () => {
    if (!student) return

    setLoading(true)
    try {
      const response = await fetch(`/api/teacher/students/${student.id}/password`)
      if (response.ok) {
        const data = await response.json()
        setHasPassword(data.student.hasPassword)
        // Show the stored plain password if available
        if (data.student.plainPassword) {
          setPassword(data.student.plainPassword)
        }
      } else {
        console.error('Failed to fetch password info')
      }
    } catch (error) {
      console.error('Error fetching password info:', error)
    } finally {
      setLoading(false)
    }
  }

  const generatePassword = async () => {
    if (!student) return

    setGenerating(true)
    try {
      const response = await fetch(`/api/teacher/students/${student.id}/credentials`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          generatePassword: true
        })
      })

      if (response.ok) {
        const data = await response.json()
        setPassword(data.password)
        setHasPassword(true)
        toast.success('Password generated successfully!')
        onPasswordGenerated?.()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to generate password')
      }
    } catch (error) {
      console.error('Error generating password:', error)
      toast.error('Failed to generate password')
    } finally {
      setGenerating(false)
    }
  }

  const copyPassword = async () => {
    if (!password) return

    try {
      await navigator.clipboard.writeText(password)
      setCopied(true)
      toast.success('Password copied to clipboard!')
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy password:', error)
      toast.error('Failed to copy password')
    }
  }

  const resetPassword = async () => {
    if (!student) return

    setGenerating(true)
    try {
      const response = await fetch(`/api/teacher/students/${student.id}/credentials`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          resetPassword: true
        })
      })

      if (response.ok) {
        const data = await response.json()
        setPassword(data.password)
        toast.success('Password reset successfully!')
        onPasswordGenerated?.()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to reset password')
      }
    } catch (error) {
      console.error('Error resetting password:', error)
      toast.error('Failed to reset password')
    } finally {
      setGenerating(false)
    }
  }

  if (!student) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] bg-white border-0 shadow-2xl overflow-hidden">
        <div className="max-h-[85vh] overflow-y-auto px-1">
        <DialogHeader className="pb-4 border-b border-gray-100">
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
              <Key className="w-5 h-5 text-white" />
            </div>
            Student Login Credentials
          </DialogTitle>
          <DialogDescription className="text-gray-600 text-base mt-2">
            Manage login credentials for {student.name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-6">
          {/* Student Info */}
          <Card className="bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-200 shadow-none">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <User className="w-5 h-5 text-blue-600" />
                Student Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-gray-500" />
                <div>
                  <span className="text-sm font-medium">
                    {student.email.endsWith('@student.local')
                      ? student.email.replace('@student.local', '')
                      : student.email}
                  </span>
                  <span className="text-xs text-gray-400 ml-2">
                    {student.email.endsWith('@student.local') ? '(username login)' : '(email login)'}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-600">
                  Joined: {new Date(student.joinDate).toLocaleDateString()}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Badge className={
                  student.status === 'Active' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-yellow-100 text-yellow-800'
                }>
                  {student.status}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Password Section */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200 space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <Key className="w-5 h-5 text-green-600" />
                Login Password
              </Label>
              {hasPassword && (
                <Badge variant="outline" className="text-green-600 border-green-300 bg-green-50">
                  Password Set
                </Badge>
              )}
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                <span className="ml-2 text-sm text-gray-600">Loading...</span>
              </div>
            ) : hasPassword ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      readOnly
                      className="pr-10 bg-gray-50"
                      placeholder="Password will be shown here"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4 text-gray-500" />
                      ) : (
                        <Eye className="w-4 h-4 text-gray-500" />
                      )}
                    </Button>
                  </div>
                  <Button
                    onClick={copyPassword}
                    disabled={!password}
                    className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg"
                  >
                    {copied ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    onClick={resetPassword}
                    disabled={generating}
                    variant="outline"
                    className="flex-1"
                  >
                    {generating ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Key className="w-4 h-4 mr-2" />
                    )}
                    Reset Password
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-6">
                <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-3" />
                <p className="text-sm text-gray-600 mb-4">
                  No password has been set for this student yet.
                </p>
                <Button
                  onClick={generatePassword}
                  disabled={generating}
                  className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg"
                >
                  {generating ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Key className="w-4 h-4 mr-2" />
                  )}
                  Generate Password
                </Button>
              </div>
            )}
          </div>

          {/* Instructions */}
          <div className="bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-200 rounded-xl p-6">
            <h4 className="text-base font-semibold text-indigo-900 mb-3 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              Instructions for Student
            </h4>
            <ul className="text-sm text-indigo-800 space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-indigo-600 font-bold">•</span>
                <span>Student should go to the login page</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-indigo-600 font-bold">•</span>
                <span>Login with username: <strong>
                  {student.email.endsWith('@student.local')
                    ? student.email.replace('@student.local', '')
                    : student.email}
                </strong></span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-indigo-600 font-bold">•</span>
                <span>Use the password shown above — it stays the same every time</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-indigo-600 font-bold">•</span>
                <span>Contact you (the teacher) if they forget their password</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
          <Button 
            variant="outline" 
            onClick={onClose}
            className="bg-white border-gray-200 hover:bg-gray-50"
          >
            Close
          </Button>
        </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
