'use client'

import { useState, useEffect, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  AdminModal, AdminModalFooter, AdminFormField, adminInputClass,
} from "@/components/ui/admin-modal"
import {
  UserPlus, Mail, Phone, MapPin, AlertCircle,
  Copy, CheckCircle, Eye, EyeOff, Sparkles, GraduationCap,
  BookOpen, Plus, XCircle, Printer
} from 'lucide-react'

const ALL_GRADES = [
  'PP1','PP2','Grade 1','Grade 2','Grade 3','Grade 4','Grade 5','Grade 6',
  'Grade 7','Grade 8','Grade 9','Form 1','Form 2','Form 3','Form 4',
]

const GRADE_SUBJECT_MAP: Record<string, string[]> = {
  PP1: ['Language Activities','Mathematical Activities','Environmental Activities','Psychomotor & Creative Activities'],
  PP2: ['Language Activities','Mathematical Activities','Environmental Activities','Psychomotor & Creative Activities'],
  'Grade 1': ['English','Kiswahili / KSL','Mathematics','Religious Education','Environmental Activities','Creative Activities'],
  'Grade 2': ['English','Kiswahili / KSL','Mathematics','Religious Education','Environmental Activities','Creative Activities'],
  'Grade 3': ['English','Kiswahili / KSL','Mathematics','Religious Education','Environmental Activities','Creative Activities'],
  'Grade 4': ['English','Kiswahili / KSL','Mathematics','Science & Technology','Agriculture & Nutrition','Social Studies','Creative Arts','Religious Education'],
  'Grade 5': ['English','Kiswahili / KSL','Mathematics','Science & Technology','Agriculture & Nutrition','Social Studies','Creative Arts','Religious Education'],
  'Grade 6': ['English','Kiswahili / KSL','Mathematics','Science & Technology','Agriculture & Nutrition','Social Studies','Creative Arts','Religious Education'],
  'Grade 7': ['English','Kiswahili / KSL','Mathematics','Integrated Science','Agriculture & Nutrition','Social Studies','Pre-Technical Studies','Creative Arts & Sports','Religious Education'],
  'Grade 8': ['English','Kiswahili / KSL','Mathematics','Integrated Science','Agriculture & Nutrition','Social Studies','Pre-Technical Studies','Creative Arts & Sports','Religious Education'],
  'Grade 9': ['English','Kiswahili / KSL','Mathematics','Integrated Science','Agriculture & Nutrition','Social Studies','Pre-Technical Studies','Creative Arts & Sports','Religious Education'],
  'Grade 10': ['English / Kiswahili / KSL','Mathematics','Community Service Learning','Physical Education'],
  'Grade 11': ['English / Kiswahili / KSL','Mathematics','Community Service Learning','Physical Education'],
  'Grade 12': ['English / Kiswahili / KSL','Mathematics','Community Service Learning','Physical Education'],
  'Form 1': ['English / Kiswahili / KSL','Mathematics','Community Service Learning','Physical Education'],
  'Form 2': ['English / Kiswahili / KSL','Mathematics','Community Service Learning','Physical Education'],
  'Form 3': ['English / Kiswahili / KSL','Mathematics','Community Service Learning','Physical Education'],
  'Form 4': ['English / Kiswahili / KSL','Mathematics','Community Service Learning','Physical Education'],
}

interface EnrollStudentModalProps {
  isOpen: boolean; onClose: () => void; onSuccess: () => void
  classes?: Array<{ id: string; name: string; subject: string; grade: string }>
  role?: 'teacher' | 'school-admin'; teachers?: Array<{ id: string; name: string }>
}

function previewUsername(first: string, last: string): string {
  if (!first && !last) return ''
  const f = first.trim().toLowerCase().replace(/\s+/g, '')
  const l = last.trim().toLowerCase().replace(/\s+/g, '')
  return f && l ? `${f}.${l}` : f || l
}
function generatePreviewPassword(): string {
  const adjs = ['Blue','Green','Happy','Brave','Swift','Bright','Calm','Bold']
  const nouns = ['Lion','Star','River','Eagle','Mountain','Sunrise','Ocean','Forest']
  return `${adjs[Math.floor(Math.random()*adjs.length)]}${nouns[Math.floor(Math.random()*nouns.length)]}${Math.floor(100+Math.random()*900)}`
}

const DEFAULT_SUBJECTS = [
  'Mathematics','English','Kiswahili','Science & Technology','Social Studies',
  'CRE','Physical Education','Creative Arts','Agriculture','Life Skills','Home Science','Computer Studies'
]

function SectionCard({ icon, label, color, children }: { icon: React.ReactNode; label: string; color: string; children: React.ReactNode }) {
  return <div className={`rounded-xl p-4 space-y-3 bg-gradient-to-br ${color}`}>
    <h3 className="font-semibold text-slate-800 flex items-center gap-2 text-sm">{icon} {label}</h3>
    {children}
  </div>
}

export default function EnrollStudentModal({
  isOpen, onClose, onSuccess, classes = [], role = 'teacher', teachers = [],
}: EnrollStudentModalProps) {
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [showPwd, setShowPwd] = useState(false)
  const [previewPwd, setPreviewPwd] = useState(() => generatePreviewPassword())
  const [formData, setFormData] = useState({
    firstName: '', lastName: '', email: '', phone: '', address: '',
    classId: '', grade: '', teacherId: '',
    parentFirstName: '', parentLastName: '', parentEmail: '', parentPhone: '',
    subjects: [] as string[],
  })
  const [customSubject, setCustomSubject] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [successData, setSuccessData] = useState<{ username?: string; email: string; password: string } | null>(null)
  const [parentSuccessData, setParentSuccessData] = useState<{ email: string; password: string; existing?: boolean; emailSent?: boolean } | null>(null)

  useEffect(() => { if (isOpen) setPreviewPwd(generatePreviewPassword()) }, [isOpen])
  useEffect(() => {
    if (!formData.classId || formData.classId === '__none__') return
    const cls = classes.find(c => c.id === formData.classId)
    if (cls?.grade) setFormData(prev => ({ ...prev, grade: cls.grade }))
  }, [formData.classId, classes])

  // Auto-select learning areas when grade changes
  useEffect(() => {
    if (!formData.grade || !isOpen) return
    const gradeSubjects = GRADE_SUBJECT_MAP[formData.grade]
    if (gradeSubjects && gradeSubjects.length > 0) {
      setFormData(prev => ({ ...prev, subjects: [...gradeSubjects] }))
    }
  }, [formData.grade, isOpen])

  const previewUser = useMemo(() => previewUsername(formData.firstName, formData.lastName), [formData.firstName, formData.lastName])
  const availableSubjects = useMemo(() => {
    if (formData.grade) {
      const gradeSubjects = GRADE_SUBJECT_MAP[formData.grade]
      if (gradeSubjects) return gradeSubjects
    }
    const s = new Set<string>(); classes.forEach(c => { if (c.subject) s.add(c.subject) })
    if (s.size === 0) DEFAULT_SUBJECTS.forEach(x => s.add(x))
    return Array.from(s).sort()
  }, [classes, formData.grade])

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, [field]: e.target.value }))
  const validate = () => {
    const errs: Record<string, string> = {}
    if (!formData.firstName.trim()) errs.firstName = 'First name is required'
    if (!formData.lastName.trim()) errs.lastName = 'Last name is required'
    if (formData.email.trim() && !/\S+@\S+\.\S+/.test(formData.email)) errs.email = 'Email format is invalid'
    if (role === 'school-admin' && !formData.teacherId) errs.teacherId = 'Please assign a teacher'
    setErrors(errs); return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); if (!validate()) return
    setLoading(true)
    try {
      const endpoint = role === 'school-admin' ? '/api/school-admin/students' : '/api/teacher/students'
      const body: Record<string, any> = {
        firstName: formData.firstName.trim(), lastName: formData.lastName.trim(),
        email: formData.email.trim() || undefined, phone: formData.phone.trim() || null,
        address: formData.address.trim() || null,
        classId: (formData.classId && formData.classId !== '__none__') ? formData.classId : null,
        grade: formData.grade || null, password: previewPwd, subjects: formData.subjects,
      }
      if (role === 'school-admin') body.teacherId = formData.teacherId
      if (formData.parentFirstName.trim() || formData.parentLastName.trim() || formData.parentEmail.trim()) {
        body.parentFirstName = formData.parentFirstName.trim(); body.parentLastName = formData.parentLastName.trim()
        body.parentEmail = formData.parentEmail.trim(); body.parentPhone = formData.parentPhone.trim() || null
      }
      const res = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      const data = await res.json()
      if (res.ok) {
        setSuccessData(data.credentials || { username: previewUser, email: body.email || `${previewUser}@student.local`, password: previewPwd })
        if (data.parentCredentials) setParentSuccessData(data.parentCredentials)
      } else { setErrors({ submit: data.error || 'Failed to enroll student' }) }    } catch { setErrors({ submit: 'Network error' }) }
    finally { setLoading(false) }
  }

  const reset = () => {
    setFormData({ firstName:'', lastName:'', email:'', phone:'', address:'', classId:'', grade:'', teacherId:'', parentFirstName:'', parentLastName:'', parentEmail:'', parentPhone:'', subjects: [] })
    setCustomSubject(''); setErrors({}); setSuccessData(null); setParentSuccessData(null); setCopied(false)
  }
  const handleClose = () => { if (successData) onSuccess(); reset(); onClose() }

  const copyCredentials = async () => {
    if (!successData) return
    const login = successData.username || successData.email.replace('@student.local', '')
    let text = `Student Login:\n  Username: ${login}\n  Password: ${successData.password}`
    if (parentSuccessData) {
      if (parentSuccessData.existing) {
        text += `\n\nParent: Linked to existing account (${parentSuccessData.email})`
      } else {
        text += `\n\nParent Login:\n  Email: ${parentSuccessData.email}\n  Password: ${parentSuccessData.password}`
      }
    }
    await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2500)
  }
  const displayLogin = (email: string) => email.endsWith('@student.local') ? email.replace('@student.local', '') : email

  const printParentSlip = () => {
    if (!parentSuccessData) return
    const studentName = successData ? (successData.username || displayLogin(successData.email)) : ''
    const printWindow = window.open('', '_blank', 'width=640,height=820')
    if (!printWindow) return
    const body = parentSuccessData.existing
      ? `<p>This parent already has an ElimuNova account at <strong>${parentSuccessData.email}</strong>. No new password was generated.</p>`
      : `<p><strong>Parent Portal Login</strong></p>
         <p>Email: <strong>${parentSuccessData.email}</strong></p>
         <p>Password: <strong>${parentSuccessData.password}</strong></p>
         <p class="muted">Sign in at the Parent Portal to view your child's progress, assignments and reports.</p>`
    printWindow.document.write(`<!doctype html><html><head><title>Parent Welcome Slip</title><style>body{font-family:system-ui,sans-serif;max-width:520px;margin:40px auto;padding:0 20px;color:#0f172a} h1{font-size:20px;margin-bottom:4px} .school{color:#64748b;font-size:14px;margin-bottom:24px} .box{border:1px solid #e2e8f0;border-radius:12px;padding:16px 20px;margin:12px 0} .muted{color:#64748b;font-size:13px} strong{color:#0f172a}</style></head><body>
      <h1>Welcome to ElimuNova</h1>
      <p class="school">Parent / Guardian portal access — ${studentName}</p>
      <div class="box">${body}</div>
      <p class="muted">Keep this slip safe. If you lose it, contact your school administrator.</p>
      <script>window.onload=function(){window.print()}</script></body></html>`)
    printWindow.document.close()
  }

  return (
    <AdminModal open={isOpen} onClose={handleClose} title="Enroll New Student"
      subtitle="Fill in the details below — username &amp; password are generated automatically."
      icon={<UserPlus />} size="2xl"
      footer={successData ? (
        <div className="flex justify-end gap-3 w-full">
          <button onClick={copyCredentials} className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition inline-flex items-center gap-1.5">
            {copied ? <CheckCircle className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copied!' : 'Copy Credentials'}
          </button>
          {parentSuccessData && (
            <button onClick={printParentSlip} className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition inline-flex items-center gap-1.5">
              <Printer className="w-4 h-4" /> Print Parent Slip
            </button>
          )}
          <button onClick={handleClose} className="rounded-lg bg-indigo-600 hover:bg-indigo-700 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition">Done</button>
        </div>
      ) : (
        <AdminModalFooter onCancel={handleClose} submitLabel="Enroll Student" loading={loading} type="submit" />
      )}
    >
      {successData ? (
        <div className="space-y-5 mt-1">
          <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
            <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center shrink-0"><CheckCircle className="w-6 h-6 text-white" /></div>
            <div><p className="font-semibold text-emerald-900 text-lg">Student Enrolled!</p><p className="text-sm text-emerald-700">Share the credentials below with the student.</p></div>
          </div>
          <div className="border-2 border-indigo-200 rounded-xl overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2"><p className="text-white font-semibold text-sm flex items-center gap-2"><Sparkles className="w-4 h-4" /> Login Credentials</p></div>
            <div className="p-4 space-y-3 bg-slate-50">
              <div><p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Username</p><code className="block bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono text-slate-900">@{successData.username || displayLogin(successData.email)}</code></div>
              {successData.email && !successData.email.endsWith('@student.local') && <div><p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Email</p><code className="block bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono text-slate-900">{successData.email}</code></div>}
              <div><p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Password</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono text-slate-900">{showPwd ? successData.password : '\u2022'.repeat(successData.password.length)}</code>
                  <button onClick={() => setShowPwd(v => !v)} className="p-2 text-slate-400 hover:text-slate-700 transition-colors">{showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>
                </div>
              </div>
            </div>
          </div>
          {parentSuccessData && (
            <div className="border-2 border-emerald-200 rounded-xl overflow-hidden">
              <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2"><p className="text-white font-semibold text-sm flex items-center gap-2"><UserPlus className="w-4 h-4" /> Parent Portal Credentials</p></div>
              <div className="p-4 space-y-3 bg-slate-50">
                {parentSuccessData.existing ? (
                  <p className="text-sm text-slate-600">This parent already has an ElimuNova account at <strong>{parentSuccessData.email}</strong>. They were automatically linked to the new student — no new credentials were generated.</p>
                ) : (
                  <>
                    <p className="text-sm text-slate-600">Parent login credentials{parentSuccessData.emailSent ? ' were sent to ' : ' for '}<strong>{parentSuccessData.email}</strong>.{parentSuccessData.emailSent ? <span className="text-emerald-600 font-medium"> (delivered)</span> : <span className="text-amber-600 font-medium"> (displayed below)</span>}</p>
                    <div><p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Parent Email</p><code className="block bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono text-slate-900">{parentSuccessData.email}</code></div>
                    <div><p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Parent Password</p><code className="block bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono text-slate-900">{showPwd ? parentSuccessData.password : '\u2022'.repeat(parentSuccessData.password.length)}</code></div>
                  </>
                )}
              </div>
            </div>
          )}
          <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800"><AlertCircle className="w-4 h-4 mt-0.5 shrink-0" /><span>Save or share these credentials now — the password won't be shown again in plain text.</span></div>
        </div>
      ) : (
        <form id="enroll-student-form" onSubmit={handleSubmit} className="space-y-5 mt-1">
          {errors.submit && <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm"><AlertCircle className="w-4 h-4 shrink-0" />{errors.submit}</div>}

          <SectionCard icon={<UserPlus className="w-4 h-4 text-indigo-600" />} label="Student Information" color="from-indigo-50/60 to-violet-50/60">
            <div className="grid grid-cols-2 gap-3">
              <AdminFormField label="First Name" htmlFor="s-first" required error={errors.firstName}>
                <input id="s-first" value={formData.firstName} onChange={set('firstName')} placeholder="e.g. Jane" className={adminInputClass} autoComplete="off" />
              </AdminFormField>
              <AdminFormField label="Last Name" htmlFor="s-last" required error={errors.lastName}>
                <input id="s-last" value={formData.lastName} onChange={set('lastName')} placeholder="e.g. Wanjiku" className={adminInputClass} autoComplete="off" />
              </AdminFormField>
            </div>
            {(formData.firstName || formData.lastName) && (
              <div className="bg-white border border-indigo-200 rounded-lg p-3 space-y-1.5">
                <p className="text-xs font-semibold text-indigo-700 flex items-center gap-1"><Sparkles className="w-3 h-3" /> Auto-generated Credentials Preview</p>
                <div className="flex items-center gap-2 text-xs"><span className="text-slate-500 w-20 shrink-0">Username:</span><code className="font-mono bg-slate-50 px-2 py-0.5 rounded text-slate-800">{previewUser || '\u2026'}</code></div>
                <div className="flex items-center gap-2 text-xs"><span className="text-slate-500 w-20 shrink-0">Password:</span><code className="font-mono bg-slate-50 px-2 py-0.5 rounded text-slate-800">{previewPwd}</code><span className="text-slate-400">(final may differ slightly)</span></div>
              </div>
            )}
          </SectionCard>

          <SectionCard icon={<GraduationCap className="w-4 h-4 text-violet-600" />} label="Grade &amp; Class" color="from-violet-50/60 to-purple-50/60">
            <AdminFormField label="Grade" htmlFor="s-grade">
              <Select value={formData.grade} onValueChange={v => setFormData(prev => ({ ...prev, grade: v }))}>
                <SelectTrigger className={adminInputClass}><SelectValue placeholder="Select grade…" /></SelectTrigger>
                <SelectContent>{ALL_GRADES.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
              </Select>
            </AdminFormField>
            {classes.length > 0 && (
              <AdminFormField label="Assign to Class (optional)" htmlFor="s-class">
                <Select value={formData.classId} onValueChange={v => setFormData(prev => ({ ...prev, classId: v }))}>
                  <SelectTrigger className={adminInputClass}><SelectValue placeholder="No class" /></SelectTrigger>
                  <SelectContent><SelectItem value="__none__">No class</SelectItem>{classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name} — {c.grade}</SelectItem>)}</SelectContent>
                </Select>
                <p className="text-xs text-slate-400 mt-1">Selecting a class will auto-fill the grade above.</p>
              </AdminFormField>
            )}
            {role === 'school-admin' && teachers.length > 0 && (
              <AdminFormField label="Assign Teacher" htmlFor="s-teacher" required error={errors.teacherId}>
                <Select value={formData.teacherId} onValueChange={v => setFormData(prev => ({ ...prev, teacherId: v }))}>
                  <SelectTrigger className={adminInputClass}><SelectValue placeholder="Select teacher…" /></SelectTrigger>
                  <SelectContent>{teachers.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
                </Select>
              </AdminFormField>
            )}
          </SectionCard>

          <SectionCard icon={<Mail className="w-4 h-4 text-emerald-600" />} label="Contact (optional)" color="from-emerald-50/60 to-green-50/60">
            <AdminFormField label="Email address" htmlFor="s-email" error={errors.email}>
              <div className="relative"><Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" /><input id="s-email" value={formData.email} onChange={set('email')} type="email" placeholder="Leave blank to auto-generate" className={`${adminInputClass} pl-9`} autoComplete="off" /></div>
            </AdminFormField>
            <div className="grid grid-cols-2 gap-3">
              <AdminFormField label="Phone" htmlFor="s-phone">
                <div className="relative"><Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" /><input id="s-phone" value={formData.phone} onChange={set('phone')} placeholder="+254 700 000 000" className={`${adminInputClass} pl-9`} autoComplete="off" /></div>
              </AdminFormField>
              <AdminFormField label="Address" htmlFor="s-addr">
                <div className="relative"><MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" /><input id="s-addr" value={formData.address} onChange={set('address')} placeholder="Student's address" className={`${adminInputClass} pl-9`} autoComplete="off" /></div>
              </AdminFormField>
            </div>
          </SectionCard>

          <SectionCard icon={<UserPlus className="w-4 h-4 text-amber-600" />} label="Parent / Guardian (optional)" color="from-amber-50/60 to-orange-50/60">
            <p className="text-xs text-slate-500">Enter parent details to automatically create a parent account.</p>
            <div className="grid grid-cols-2 gap-3">
              <AdminFormField label="First Name" htmlFor="s-pfirst"><input id="s-pfirst" value={formData.parentFirstName} onChange={set('parentFirstName')} placeholder="Parent first name" className={adminInputClass} autoComplete="off" /></AdminFormField>
              <AdminFormField label="Last Name" htmlFor="s-plast"><input id="s-plast" value={formData.parentLastName} onChange={set('parentLastName')} placeholder="Parent last name" className={adminInputClass} autoComplete="off" /></AdminFormField>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <AdminFormField label="Email" htmlFor="s-pemail"><div className="relative"><Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" /><input id="s-pemail" value={formData.parentEmail} onChange={set('parentEmail')} type="email" placeholder="parent@example.com" className={`${adminInputClass} pl-9`} autoComplete="off" /></div></AdminFormField>
              <AdminFormField label="Phone" htmlFor="s-pphone"><div className="relative"><Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" /><input id="s-pphone" value={formData.parentPhone} onChange={set('parentPhone')} placeholder="+254 700 000 000" className={`${adminInputClass} pl-9`} autoComplete="off" /></div></AdminFormField>
            </div>
            {formData.parentFirstName && formData.parentLastName && formData.parentEmail && (
              <div className="bg-white border border-amber-200 rounded-lg p-3 text-xs text-slate-600">A parent account will be created for <strong>{formData.parentFirstName} {formData.parentLastName}</strong> and linked to this student.</div>
            )}
          </SectionCard>

          <SectionCard icon={<BookOpen className="w-4 h-4 text-amber-600" />} label="Learning Areas / Subjects" color="from-amber-50/60 to-orange-50/60">
            <p className="text-xs text-slate-500">Auto-assigned based on {formData.grade || 'selected grade'}. Tap to adjust.</p>
            <div className="flex flex-wrap gap-1.5">
              {availableSubjects.map(subject => {
                const selected = formData.subjects.includes(subject)
                return <button key={subject} type="button" onClick={() => setFormData(prev => ({ ...prev, subjects: selected ? prev.subjects.filter(s => s !== subject) : [...prev.subjects, subject] }))} className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${selected ? 'bg-amber-500 text-white border-amber-500 shadow-sm' : 'bg-white text-slate-600 border-slate-200 hover:border-amber-300'}`}>{subject}</button>
              })}
            </div>
            <div className="flex items-center gap-2">
              <input value={customSubject} onChange={e => setCustomSubject(e.target.value)} placeholder="Add custom subject…" className={`${adminInputClass} max-w-xs text-sm`} style={{ height:'2.25rem' }}
                onKeyDown={e => { if (e.key==='Enter'&&customSubject.trim()) { e.preventDefault(); if (!formData.subjects.includes(customSubject.trim())) setFormData(prev=>({...prev,subjects:[...prev.subjects,customSubject.trim()]})); setCustomSubject('') } }} />
              <Button type="button" size="sm" variant="outline" disabled={!customSubject.trim()} className="h-9" onClick={()=>{ if(customSubject.trim()&&!formData.subjects.includes(customSubject.trim())) setFormData(prev=>({...prev,subjects:[...prev.subjects,customSubject.trim()]})); setCustomSubject('') }}><Plus className="h-3.5 w-3.5" /></Button>
            </div>
            {formData.subjects.length > 0 && (
              <div className="flex flex-wrap gap-1">{formData.subjects.map(s => <span key={s} className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full text-xs font-medium">{s}<button type="button" onClick={() => setFormData(prev=>({...prev,subjects:prev.subjects.filter(x=>x!==s)}))}><XCircle className="h-3 w-3" /></button></span>)}</div>
            )}
          </SectionCard>
        </form>
      )}
    </AdminModal>
  )
}
