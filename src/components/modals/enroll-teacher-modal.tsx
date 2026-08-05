"use client"

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Loader2, UserPlus, Eye, EyeOff, CheckCircle, Copy, Download } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Credentials {
  username: string
  password: string
  email: string
  name: string
}

interface EnrollTeacherModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

function PasswordDisplay({ password }: { password: string }) {
  const [show, setShow] = useState(false)
  return (
    <div className="flex items-center gap-2">
      <span className="font-mono font-semibold">{show ? password : '••••••••'}</span>
      <button type="button" onClick={() => setShow(!show)} className="text-slate-400 hover:text-slate-600">
        {show ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
      </button>
    </div>
  )
}

export function EnrollTeacherModal({ isOpen, onClose, onSuccess }: EnrollTeacherModalProps) {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [credentials, setCredentials] = useState<Credentials | null>(null)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.password) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      })
      return
    }

    if (formData.password.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters long",
        variant: "destructive"
      })
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/school-admin/teachers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        const data = JSON.parse(await response.text())
        if (data.teacher?.username) {
          setCredentials({
            username: data.teacher.username,
            password: formData.password,
            email: formData.email,
            name: `${formData.firstName} ${formData.lastName}`,
          })
        } else {
          toast({ title: "Success", description: "Teacher enrolled successfully" })
          handleClose()
        }
        onSuccess()
      } else {
        const errorText = await response.text()
        let msg = "Failed to enroll teacher"
        try { msg = JSON.parse(errorText).error || msg } catch {}
        toast({ title: "Error", description: msg, variant: "destructive" })
      }
    } catch {
      toast({ title: "Error", description: "An unexpected error occurred", variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleClose = () => {
    setFormData({ firstName: '', lastName: '', email: '', password: '' })
    setCredentials(null)
    onClose()
  }

  const copyCredentials = () => {
    if (!credentials) return
    navigator.clipboard.writeText(`Name: ${credentials.name}\nEmail: ${credentials.email}\nUsername: ${credentials.username}\nPassword: ${credentials.password}`)
    toast({ title: "Copied", description: "Credentials copied to clipboard" })
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto bg-gradient-to-br from-white via-blue-50 to-purple-50">
        <DialogHeader className="sticky top-0 bg-gradient-to-br from-white via-blue-50 to-purple-50 z-10 pb-4">
          <DialogTitle className="elimunova-text-gradient-blue flex items-center">
            <UserPlus className="w-5 h-5 mr-2" />
            Enroll New Teacher
          </DialogTitle>
          <DialogDescription>
            Add a new teacher to your school. They will receive login credentials via email.
          </DialogDescription>
        </DialogHeader>

        {credentials ? (
          <div className="space-y-4 py-4">
            <div className="text-center">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-2" />
              <h3 className="text-lg font-bold text-slate-900">Teacher Enrolled</h3>
              <p className="text-sm text-slate-500">Share these credentials with the teacher</p>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
              <div><p className="text-xs text-slate-500">Name</p><p className="font-semibold">{credentials.name}</p></div>
              <div><p className="text-xs text-slate-500">Email</p><p className="font-semibold">{credentials.email}</p></div>
              <div><p className="text-xs text-slate-500">Username</p><p className="font-mono text-blue-600 font-semibold">{credentials.username}</p></div>
              <div><p className="text-xs text-slate-500">Password</p>
                <PasswordDisplay password={credentials.password} />
              </div>
            </div>
            <p className="text-xs text-amber-600 text-center">Save these credentials now — the password cannot be recovered later</p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={copyCredentials} className="flex-1"><Copy className="h-4 w-4 mr-1.5" />Copy All</Button>
              <Button onClick={handleClose} className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white">Done</Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name *</Label>
              <Input
                id="firstName"
                type="text"
                placeholder="Enter first name"
                value={formData.firstName}
                onChange={(e) => handleInputChange('firstName', e.target.value)}
                className="elimunova-glass"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name *</Label>
              <Input
                id="lastName"
                type="text"
                placeholder="Enter last name"
                value={formData.lastName}
                onChange={(e) => handleInputChange('lastName', e.target.value)}
                className="elimunova-glass"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email Address *</Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter email address"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              className="elimunova-glass"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password *</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter password (min 6 characters)"
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                className="elimunova-glass pr-10"
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          <DialogFooter className="sticky bottom-0 bg-gradient-to-br from-white via-blue-50 to-purple-50 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
              className="elimunova-glass"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Enrolling...
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Enroll Teacher
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
