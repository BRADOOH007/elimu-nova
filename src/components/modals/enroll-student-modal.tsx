'use client'

import { useState, useEffect, useMemo } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  X, UserPlus, Mail, Phone, MapPin, School, AlertCircle,
  Copy, CheckCircle, Eye, EyeOff, Sparkles, GraduationCap,
  BookOpen, Plus, XCircle
} from 'lucide-react'

// All CBC grades
const ALL_GRADES = [
  'PP1', 'PP2',
  'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6',
  'Grade 7', 'Grade 8', 'Grade 9',
  'Form 1', 'Form 2', 'Form 3', 'Form 4',
]

interface EnrollStudentModalProps {
  isOpen:     boolean
  onClose:    () => void
  onSuccess:  () => void
  classes?:   Array<{ id: string; name: string; subject: string; grade: string }>
  /** 'teacher' (default) | 'school-admin' — controls which API to call */
  role?:      'teacher' | 'school-admin'
  /** Required when role='school-admin' */
  teachers?:  Array<{ id: string; name: string }>
}

/** Generate preview username from name */
function previewUsername(first: string, last: string): string {
  if (!first && !last) return ''
  const f = first.trim().toLowerCase().replace(/\s+/g, '')
  const l = last.trim().toLowerCase().replace(/\s+/g, '')
  if (f && l) return `${f}.${l}`
  return f || l
}

/** Generate a preview password (same logic as server, but just for display) */
function generatePreviewPassword(): string {
  const adjs  = ['Blue','Green','Happy','Brave','Swift','Bright','Calm','Bold']
  const nouns = ['Lion','Star','River','Eagle','Mountain','Sunrise','Ocean','Forest']
  const adj  = adjs [Math.floor(Math.random() * adjs.length)]
  const noun = nouns[Math.floor(Math.random() * nouns.length)]
  const num  = Math.floor(100 + Math.random() * 900)
  return `${adj}${noun}${num}`
}

export default function EnrollStudentModal({
  isOpen, onClose, onSuccess,
  classes  = [],
  role     = 'teacher',
  teachers = [],
}: EnrollStudentModalProps) {
  const [loading,   setLoading]    = useState(false)
  const [copied,    setCopied]     = useState(false)
  const [showPwd,   setShowPwd]    = useState(false)
  const [previewPwd, setPreviewPwd] = useState(() => generatePreviewPassword())

  const [formData, setFormData] = useState({
    firstName: '',
    lastName:  '',
    email:     '',
    phone:     '',
    address:   '',
    classId:   '',
    grade:     '',
    teacherId: '',
    parentFirstName: '',
    parentLastName:  '',
    parentEmail:     '',
    parentPhone:     '',
    subjects:  [] as string[],
  })
  const [customSubject, setCustomSubject] = useState('')
  const [errors,      setErrors]      = useState<Record<string, string>>({})
  const [successData, setSuccessData] = useState<{ username?: string; email: string; password: string } | null>(null)
  const [parentSuccessData, setParentSuccessData] = useState<{ email: string; password: string; emailSent?: boolean; emailMethod?: string } | null>(null)

  // Regenerate preview password on open
  useEffect(() => {
    if (isOpen) setPreviewPwd(generatePreviewPassword())
  }, [isOpen])

  // Auto-fill grade when class is selected
  useEffect(() => {
    if (!formData.classId || formData.classId === '__none__') return
    const cls = classes.find(c => c.id === formData.classId)
    if (cls?.grade) setFormData(prev => ({ ...prev, grade: cls.grade }))
  }, [formData.classId, classes])

  // Live preview: username derived from name
  const previewUser = useMemo(
    () => previewUsername(formData.firstName, formData.lastName),
    [formData.firstName, formData.lastName]
  )

  const DEFAULT_SUBJECTS = [
    'Mathematics', 'English', 'Kiswahili', 'Science & Technology',
    'Social Studies', 'CRE', 'Physical Education', 'Creative Arts',
    'Agriculture', 'Life Skills', 'Home Science', 'Computer Studies'
  ]

  const availableSubjects = useMemo(() => {
    const subjects = new Set<string>()
    classes.forEach(cls => { if (cls.subject) subjects.add(cls.subject) })
    if (subjects.size === 0) DEFAULT_SUBJECTS.forEach(s => subjects.add(s))
    return Array.from(subjects).sort()
  }, [classes])

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setFormData(prev => ({ ...prev, [field]: e.target.value }))

  const validate = () => {
    const errs: Record<string, string> = {}
    if (!formData.firstName.trim()) errs.firstName = 'First name is required'
    if (!formData.lastName.trim())  errs.lastName  = 'Last name is required'
    if (formData.email.trim() && !/\S+@\S+\.\S+/.test(formData.email))
      errs.email = 'Email format is invalid'
    if (role === 'school-admin' && !formData.teacherId)
      errs.teacherId = 'Please assign a teacher'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    setLoading(true)
    try {
      const endpoint = role === 'school-admin'
        ? '/api/school-admin/students'
        : '/api/teacher/students'

      const body: Record<string, any> = {
        firstName: formData.firstName.trim(),
        lastName:  formData.lastName.trim(),
        email:     formData.email.trim() || undefined,
        phone:     formData.phone.trim()   || null,
        address:   formData.address.trim() || null,
        classId:   (formData.classId && formData.classId !== '__none__') ? formData.classId : null,
        grade:     formData.grade || null,
      }

      body.password = previewPwd
      body.subjects = formData.subjects

      if (role === 'school-admin') {
        body.teacherId = formData.teacherId
      }

      // Parent info
      if (formData.parentFirstName.trim() || formData.parentLastName.trim() || formData.parentEmail.trim()) {
        body.parentFirstName = formData.parentFirstName.trim()
        body.parentLastName  = formData.parentLastName.trim()
        body.parentEmail     = formData.parentEmail.trim()
        body.parentPhone     = formData.parentPhone.trim() || null
      }

      const res  = await fetch(endpoint, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(body),
      })
      const data = await res.json()

      if (res.ok) {
        setSuccessData(data.credentials || {
          username: previewUser,
          email:    body.email || `${previewUser}@student.local`,
          password: previewPwd,
        })
        if (data.parentCredentials) {
          setParentSuccessData(data.parentCredentials)
        }
      } else {
        setErrors({ submit: data.error || 'Failed to enroll student' })
      }
    } catch {
      setErrors({ submit: 'Network error — please try again' })
    } finally {
      setLoading(false)
    }
  }

  const reset = () => {
    setFormData({ firstName:'', lastName:'', email:'', phone:'', address:'', classId:'', grade:'', teacherId:'',
      parentFirstName:'', parentLastName:'', parentEmail:'', parentPhone:'', subjects: [] })
    setCustomSubject('')
    setErrors({})
    setSuccessData(null)
    setParentSuccessData(null)
    setCopied(false)
  }

  const handleClose = () => {
    if (successData) onSuccess()
    reset()
    onClose()
  }

  const copyCredentials = async () => {
    if (!successData) return
    const login = successData.username || successData.email.replace('@student.local', '')
    let text = `Student Login:\n  Username: ${login}\n  Password: ${successData.password}`
    if (parentSuccessData) {
      text += `\n\nParent Login:\n  Email: ${parentSuccessData.email}\n  Password: ${parentSuccessData.password}`
    }
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  const displayLogin = (email: string) =>
    email.endsWith('@student.local') ? email.replace('@student.local', '') : email

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[92vh] overflow-hidden bg-white border-0 shadow-2xl p-0">
        <div className="overflow-y-auto max-h-[92vh]">

          {/* Header */}
          <div className="sticky top-0 z-10 bg-white px-6 pt-6 pb-4 border-b border-gray-100">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shrink-0">
                  <UserPlus className="w-5 h-5 text-white" />
                </div>
                Enroll New Student
              </DialogTitle>
              <DialogDescription className="text-gray-500 mt-1">
                Fill in the details below — username &amp; password are generated automatically.
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="px-6 pb-6">

          {/* ── SUCCESS SCREEN ─────────────────────────────────────────── */}
          {successData ? (
            <div className="mt-6 space-y-5">
              {/* Big success banner */}
              <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-xl">
                <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center shrink-0">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-green-900 text-lg">Student Enrolled!</p>
                  <p className="text-sm text-green-700">Share the credentials below with the student.</p>
                </div>
              </div>

              {/* Credentials card */}
              <div className="border-2 border-blue-200 rounded-xl overflow-hidden">
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-2">
                  <p className="text-white font-semibold text-sm flex items-center gap-2">
                    <Sparkles className="w-4 h-4" /> Login Credentials
                  </p>
                </div>
                <div className="p-4 space-y-3 bg-gray-50">
                  {/* Username */}
                  <div>
                    <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Username</Label>
                    <div className="mt-1 flex items-center gap-2">
                      <code className="flex-1 bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono text-gray-900">
                        @{successData.username || displayLogin(successData.email)}
                      </code>
                    </div>
                  </div>
                  {/* Email (if not student.local) */}
                  {successData.email && !successData.email.endsWith('@student.local') && (
                    <div>
                      <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</Label>
                      <div className="mt-1 flex items-center gap-2">
                        <code className="flex-1 bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono text-gray-900">
                          {successData.email}
                        </code>
                      </div>
                    </div>
                  )}
                  {/* Password */}
                  <div>
                    <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Password</Label>
                    <div className="mt-1 flex items-center gap-2">
                      <code className="flex-1 bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono text-gray-900">
                        {showPwd ? successData.password : '•'.repeat(successData.password.length)}
                      </code>
                      <button
                        onClick={() => setShowPwd(v => !v)}
                        className="p-2 text-gray-400 hover:text-gray-700 transition-colors"
                        title={showPwd ? 'Hide' : 'Show'}
                      >
                        {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Parent credentials */}
              {parentSuccessData && (
                <div className="border-2 border-green-200 rounded-xl overflow-hidden">
                  <div className="bg-gradient-to-r from-green-600 to-teal-600 px-4 py-2">
                    <p className="text-white font-semibold text-sm flex items-center gap-2">
                      <UserPlus className="w-4 h-4" /> Parent Account Created
                    </p>
                  </div>
                  <div className="p-4 space-y-3 bg-gray-50">
                    <p className="text-sm text-gray-600">
                      Parent login credentials{parentSuccessData.emailSent ? ' were sent to ' : ' for '}
                      <strong>{parentSuccessData.email}</strong>.
                      {parentSuccessData.emailSent
                        ? <span className="text-green-600 font-medium"> (delivered)</span>
                        : <span className="text-amber-600 font-medium"> (displayed below — no SMTP configured)</span>
                      }
                    </p>
                    <div>
                      <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Parent Email</Label>
                      <code className="mt-1 block bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono text-gray-900">
                        {parentSuccessData.email}
                      </code>
                    </div>
                    <div>
                      <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Parent Password</Label>
                      <code className="mt-1 block bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono text-gray-900">
                        {parentSuccessData.password}
                      </code>
                    </div>
                  </div>
                </div>
              )}

              {/* Warning */}
              <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>Save or share these credentials now — the password won't be shown again in plain text.</span>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-2">
                <Button variant="outline" onClick={copyCredentials}>
                  {copied ? <CheckCircle className="w-4 h-4 mr-2 text-green-600" /> : <Copy className="w-4 h-4 mr-2" />}
                  {copied ? 'Copied!' : 'Copy Credentials'}
                </Button>
                <Button onClick={handleClose}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                  Done
                </Button>
              </div>
            </div>

          ) : (
          /* ── ENROLLMENT FORM ───────────────────────────────────────── */
          <form onSubmit={handleSubmit} className="mt-6 space-y-5">

            {errors.submit && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {errors.submit}
              </div>
            )}

            {/* ── Student Name ─────────────────────────────────────── */}
            <div className="bg-blue-50/60 rounded-xl p-4 space-y-4">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2 text-sm">
                <UserPlus className="w-4 h-4 text-blue-600" /> Student Information
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-semibold text-gray-600">First Name <span className="text-red-500">*</span></Label>
                  <Input value={formData.firstName} onChange={set('firstName')}
                    placeholder="e.g. Jane" className="mt-1 bg-white"
                    autoComplete="off" />
                  {errors.firstName && <p className="text-xs text-red-600 mt-1">{errors.firstName}</p>}
                </div>
                <div>
                  <Label className="text-xs font-semibold text-gray-600">Last Name <span className="text-red-500">*</span></Label>
                  <Input value={formData.lastName} onChange={set('lastName')}
                    placeholder="e.g. Wanjiku" className="mt-1 bg-white"
                    autoComplete="off" />
                  {errors.lastName && <p className="text-xs text-red-600 mt-1">{errors.lastName}</p>}
                </div>
              </div>

              {/* Live credential preview */}
              {(formData.firstName || formData.lastName) && (
                <div className="bg-white border border-blue-200 rounded-lg p-3 space-y-1.5">
                  <p className="text-xs font-semibold text-blue-700 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> Auto-generated Credentials Preview
                  </p>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-gray-500 w-20 shrink-0">Username:</span>
                    <code className="font-mono bg-gray-50 px-2 py-0.5 rounded text-gray-800">
                      {previewUser || '…'}
                    </code>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-gray-500 w-20 shrink-0">Password:</span>
                    <code className="font-mono bg-gray-50 px-2 py-0.5 rounded text-gray-800">
                      {previewPwd}
                    </code>
                    <span className="text-gray-400">(final may differ slightly)</span>
                  </div>
                </div>
              )}
            </div>

            {/* ── Grade & Class ────────────────────────────────────── */}
            <div className="bg-purple-50/60 rounded-xl p-4 space-y-3">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2 text-sm">
                <GraduationCap className="w-4 h-4 text-purple-600" /> Grade &amp; Class
              </h3>

              {/* Grade dropdown — always visible */}
              <div>
                <Label className="text-xs font-semibold text-gray-600">Grade</Label>
                <Select
                  value={formData.grade}
                  onValueChange={v => setFormData(prev => ({ ...prev, grade: v }))}
                >
                  <SelectTrigger className="mt-1 bg-white">
                    <SelectValue placeholder="Select grade…" />
                  </SelectTrigger>
                  <SelectContent>
                    {ALL_GRADES.map(g => (
                      <SelectItem key={g} value={g}>{g}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Class dropdown — only shown if teacher has classes */}
              {classes.length > 0 && (
                <div>
                  <Label className="text-xs font-semibold text-gray-600">Assign to Class (optional)</Label>
                  <Select
                    value={formData.classId}
                    onValueChange={v => setFormData(prev => ({ ...prev, classId: v }))}
                  >
                    <SelectTrigger className="mt-1 bg-white">
                      <SelectValue placeholder="No class (independent student)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">No class (independent student)</SelectItem>
                      {classes.map(cls => (
                        <SelectItem key={cls.id} value={cls.id}>
                          {cls.name} — {cls.grade}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-400 mt-1">Selecting a class will auto-fill the grade above.</p>
                </div>
              )}

              {/* Teacher selector — school-admin only */}
              {role === 'school-admin' && teachers.length > 0 && (
                <div>
                  <Label className="text-xs font-semibold text-gray-600">Assign Teacher <span className="text-red-500">*</span></Label>
                  <Select
                    value={formData.teacherId}
                    onValueChange={v => setFormData(prev => ({ ...prev, teacherId: v }))}
                  >
                    <SelectTrigger className="mt-1 bg-white">
                      <SelectValue placeholder="Select teacher…" />
                    </SelectTrigger>
                    <SelectContent>
                      {teachers.map(t => (
                        <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.teacherId && <p className="text-xs text-red-600 mt-1">{errors.teacherId}</p>}
                </div>
              )}
            </div>

            {/* ── Contact ──────────────────────────────────────────── */}
            <div className="bg-green-50/60 rounded-xl p-4 space-y-3">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2 text-sm">
                <Mail className="w-4 h-4 text-green-600" /> Contact (optional)
              </h3>
              <div>
                <Label className="text-xs font-semibold text-gray-600">Email address</Label>
                <div className="relative mt-1">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input value={formData.email} onChange={set('email')}
                    type="email" placeholder="Leave blank to auto-generate"
                    className="pl-9 bg-white" />
                </div>
                {errors.email && <p className="text-xs text-red-600 mt-1">{errors.email}</p>}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-semibold text-gray-600">Phone</Label>
                  <div className="relative mt-1">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input value={formData.phone} onChange={set('phone')}
                      placeholder="+254 700 000 000" className="pl-9 bg-white" />
                  </div>
                </div>
                <div>
                  <Label className="text-xs font-semibold text-gray-600">Address</Label>
                  <div className="relative mt-1">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input value={formData.address} onChange={set('address')}
                      placeholder="Student's address" className="pl-9 bg-white" />
                  </div>
                </div>
              </div>
            </div>

            {/* ── Parent Information ────────────────────────────────── */}
            <div className="bg-amber-50/60 rounded-xl p-4 space-y-3">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2 text-sm">
                <UserPlus className="w-4 h-4 text-amber-600" /> Parent / Guardian (optional)
              </h3>
              <p className="text-xs text-gray-500">Enter parent details to automatically create a parent account and link them to this student.</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-semibold text-gray-600">First Name</Label>
                  <Input value={formData.parentFirstName} onChange={set('parentFirstName')}
                    placeholder="Parent first name" className="mt-1 bg-white" />
                </div>
                <div>
                  <Label className="text-xs font-semibold text-gray-600">Last Name</Label>
                  <Input value={formData.parentLastName} onChange={set('parentLastName')}
                    placeholder="Parent last name" className="mt-1 bg-white" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-semibold text-gray-600">Email</Label>
                  <div className="relative mt-1">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input value={formData.parentEmail} onChange={set('parentEmail')}
                      type="email" placeholder="parent@example.com" className="pl-9 bg-white" />
                  </div>
                </div>
                <div>
                  <Label className="text-xs font-semibold text-gray-600">Phone</Label>
                  <div className="relative mt-1">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input value={formData.parentPhone} onChange={set('parentPhone')}
                      placeholder="+254 700 000 000" className="pl-9 bg-white" />
                  </div>
                </div>
              </div>
              {formData.parentFirstName && formData.parentLastName && formData.parentEmail && (
                <div className="bg-white border border-amber-200 rounded-lg p-3 text-xs text-gray-600">
                  A parent account will be created for <strong>{formData.parentFirstName} {formData.parentLastName}</strong>
                  {' '}and linked to this student. Credentials will appear after enrollment.
                </div>
              )}
            </div>

            {/* ── Learning Areas / Subjects ──────────────────────────── */}
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-4 space-y-3">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2 text-sm">
                <BookOpen className="w-4 h-4 text-amber-600" />
                Learning Areas / Subjects
              </h3>
              <p className="text-xs text-gray-500">Select the subjects this student is enrolled in.</p>
              <div className="flex flex-wrap gap-1.5">
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
                      className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
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
              <div className="flex items-center gap-2">
                <Input
                  value={customSubject}
                  onChange={e => setCustomSubject(e.target.value)}
                  placeholder="Add custom subject…"
                  className="max-w-xs bg-white border-gray-200 text-sm h-8"
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
                  className="h-8"
                  onClick={() => {
                    if (customSubject.trim() && !formData.subjects.includes(customSubject.trim())) {
                      setFormData(prev => ({ ...prev, subjects: [...prev.subjects, customSubject.trim()] }))
                    }
                    setCustomSubject('')
                  }}
                >
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              </div>
              {formData.subjects.length > 0 && (
                <div className="flex flex-wrap gap-1">
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

            {/* ── Actions ──────────────────────────────────────────── */}
            <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
              <Button type="button" variant="outline" onClick={handleClose}>
                <X className="w-4 h-4 mr-2" /> Cancel
              </Button>
              <Button type="submit" disabled={loading}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-md">
                {loading
                  ? <><span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" /> Enrolling…</>
                  : <><UserPlus className="w-4 h-4 mr-2" /> Enroll Student</>}
              </Button>
            </div>

          </form>
          )}

          </div>{/* /px-6 */}
        </div>{/* /overflow-y-auto */}
      </DialogContent>
    </Dialog>
  )
}
