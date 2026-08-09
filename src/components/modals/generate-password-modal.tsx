'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogBody, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Key, 
  X, 
  Copy,
  RefreshCw,
  Eye,
  EyeOff,
  Check,
  AlertCircle
} from 'lucide-react'

interface GeneratePasswordModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (password: string) => void
  studentName: string
  studentId: string
}

export default function GeneratePasswordModal({ isOpen, onClose, onSuccess, studentName, studentId }: GeneratePasswordModalProps) {
  const [loading, setLoading] = useState(false)
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [copied, setCopied] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const generateRandomPassword = () => {
    const length = 12
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*'
    let result = ''
    for (let i = 0; i < length; i++) {
      result += charset.charAt(Math.floor(Math.random() * charset.length))
    }
    setPassword(result)
    setErrors({})
  }

  const validatePassword = (pwd: string) => {
    const newErrors: Record<string, string> = {}

    if (pwd.length < 8) {
      newErrors.password = 'Password must be at least 8 characters long'
    }

    if (pwd.length > 50) {
      newErrors.password = 'Password must be less than 50 characters'
    }

    if (!/(?=.*[a-z])/.test(pwd)) {
      newErrors.password = 'Password must contain at least one lowercase letter'
    }

    if (!/(?=.*[A-Z])/.test(pwd)) {
      newErrors.password = 'Password must contain at least one uppercase letter'
    }

    if (!/(?=.*\d)/.test(pwd)) {
      newErrors.password = 'Password must contain at least one number'
    }

    if (!/(?=.*[!@#$%^&*])/.test(pwd)) {
      newErrors.password = 'Password must contain at least one special character (!@#$%^&*)'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handlePasswordChange = (value: string) => {
    setPassword(value)
    if (value.length > 0) {
      validatePassword(value)
    } else {
      setErrors({})
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!password.trim()) {
      setErrors({ password: 'Password is required' })
      return
    }

    if (!validatePassword(password)) {
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`/api/teacher/students/${studentId}/credentials`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          password: password
        })
      })

      if (response.ok) {
        onSuccess(password)
        onClose()
        resetForm()
      } else {
        const error = await response.json()
        console.error('Error setting password:', error)
        setErrors({ password: 'Failed to set password. Please try again.' })
      }
    } catch (error) {
      console.error('Error setting password:', error)
      setErrors({ password: 'Failed to set password. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setPassword('')
    setShowPassword(false)
    setCopied(false)
    setErrors({})
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(password)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy password:', error)
    }
  }

  const getPasswordStrength = (pwd: string) => {
    let score = 0
    if (pwd.length >= 8) score++
    if (pwd.length >= 12) score++
    if (/(?=.*[a-z])/.test(pwd)) score++
    if (/(?=.*[A-Z])/.test(pwd)) score++
    if (/(?=.*\d)/.test(pwd)) score++
    if (/(?=.*[!@#$%^&*])/.test(pwd)) score++
    
    if (score <= 2) return { level: 'Weak', color: 'text-red-600', bgColor: 'bg-red-100' }
    if (score <= 4) return { level: 'Medium', color: 'text-yellow-600', bgColor: 'bg-yellow-100' }
    return { level: 'Strong', color: 'text-green-600', bgColor: 'bg-green-100' }
  }

  const strength = password ? getPasswordStrength(password) : null

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl bg-gradient-to-br from-white via-blue-50 to-purple-50 border-0 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Key className="w-6 h-6 text-blue-600" />
            Generate Student Password
          </DialogTitle>
          <DialogDescription className="text-gray-600">
            Create a secure password for {studentName}
          </DialogDescription>
        </DialogHeader>

        <DialogBody className="space-y-6 mt-1">
          <form id="generate-password-form" onSubmit={handleSubmit} className="space-y-6">
          {/* Password Input */}
          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-medium text-gray-700">
              Student Password *
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => handlePasswordChange(e.target.value)}
                placeholder="Enter or generate a secure password"
                className="pr-20 bg-white/70 backdrop-blur-sm border-0 shadow-sm focus:ring-2 focus:ring-blue-500"
              />
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPassword(!showPassword)}
                  className="h-8 w-8 p-0 hover:bg-white/50"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={generateRandomPassword}
                  className="h-8 w-8 p-0 hover:bg-white/50"
                >
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </div>
            </div>
            {errors.password && (
              <p className="text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.password}
              </p>
            )}
          </div>

          {/* Password Strength Indicator */}
          {password && strength && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Password Strength</span>
                <span className={`text-sm font-medium px-2 py-1 rounded-full ${strength.bgColor} ${strength.color}`}>
                  {strength.level}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${
                    strength.level === 'Weak' ? 'bg-red-500 w-1/3' :
                    strength.level === 'Medium' ? 'bg-yellow-500 w-2/3' :
                    'bg-green-500 w-full'
                  }`}
                ></div>
              </div>
            </div>
          )}

          {/* Password Requirements */}
          <div className="bg-white/50 rounded-lg p-4 border border-gray-200">
            <h4 className="font-medium text-gray-900 mb-3">Password Requirements</h4>
            <div className="space-y-2 text-sm">
              <div className={`flex items-center gap-2 ${password.length >= 8 ? 'text-green-600' : 'text-gray-500'}`}>
                <Check className={`w-4 h-4 ${password.length >= 8 ? 'text-green-600' : 'text-gray-400'}`} />
                At least 8 characters long
              </div>
              <div className={`flex items-center gap-2 ${/(?=.*[a-z])/.test(password) ? 'text-green-600' : 'text-gray-500'}`}>
                <Check className={`w-4 h-4 ${/(?=.*[a-z])/.test(password) ? 'text-green-600' : 'text-gray-400'}`} />
                Contains lowercase letter
              </div>
              <div className={`flex items-center gap-2 ${/(?=.*[A-Z])/.test(password) ? 'text-green-600' : 'text-gray-500'}`}>
                <Check className={`w-4 h-4 ${/(?=.*[A-Z])/.test(password) ? 'text-green-600' : 'text-gray-400'}`} />
                Contains uppercase letter
              </div>
              <div className={`flex items-center gap-2 ${/(?=.*\d)/.test(password) ? 'text-green-600' : 'text-gray-500'}`}>
                <Check className={`w-4 h-4 ${/(?=.*\d)/.test(password) ? 'text-green-600' : 'text-gray-400'}`} />
                Contains number
              </div>
              <div className={`flex items-center gap-2 ${/(?=.*[!@#$%^&*])/.test(password) ? 'text-green-600' : 'text-gray-500'}`}>
                <Check className={`w-4 h-4 ${/(?=.*[!@#$%^&*])/.test(password) ? 'text-green-600' : 'text-gray-400'}`} />
                Contains special character
              </div>
            </div>
          </div>

          {/* Password Preview */}
          {password && (
            <div className="bg-white/50 rounded-lg p-4 border border-blue-200">
              <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                <Key className="w-4 h-4 text-blue-600" />
                Generated Password
              </h4>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-mono text-sm text-gray-900 break-all">{password}</p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={copyToClipboard}
                  className="bg-white/70 backdrop-blur-sm border-0 shadow-sm hover:bg-white/90"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 mr-1" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 mr-1" />
                      Copy
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          </form>
        </DialogBody>
        <DialogFooter className="border-t border-gray-200">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            className="bg-white/70 backdrop-blur-sm border-0 shadow-sm hover:bg-white/90 px-5 py-2.5 text-sm font-medium"
          >
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
          <Button
            type="submit"
            form="generate-password-form"
            disabled={loading || !password || Object.keys(errors).length > 0}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 px-5 py-2.5 text-sm font-medium"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            ) : (
              <Key className="w-4 h-4 mr-2" />
            )}
            {loading ? 'Setting Password...' : 'Set Password'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
