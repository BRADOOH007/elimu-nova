"use client"

import { useState, useEffect } from 'react'
import {
  AdminModal, AdminModalFooter, AdminFormField, adminInputClass,
} from "@/components/ui/admin-modal"
import { User, Mail, Phone, MapPin, Building2, ClipboardList, Plus, Trash2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Teacher {
  id: string; name: string; email: string; phone?: string; address?: string; status: string
}

interface EditTeacherModalProps {
  isOpen: boolean; onClose: () => void; onSuccess: () => void; teacher: Teacher | null
}

const HOD_OPTIONS = [
  { value: '', label: 'None (Classroom Teacher)' },
  { value: 'MATHEMATICS', label: 'Mathematics & Logic' },
  { value: 'LANGUAGES', label: 'Languages (English / Kiswahili)' },
  { value: 'SCIENCE_STEM', label: 'Science & STEM' },
  { value: 'HUMANITIES', label: 'Humanities & Social Studies' },
  { value: 'CREATIVE_ARTS', label: 'Creative & Performing Arts' },
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
const ALL_SUBJECTS = [...new Set(Object.values(GRADE_SUBJECT_MAP).flat())]

export function EditTeacherModal({ isOpen, onClose, onSuccess, teacher }: EditTeacherModalProps) {
  const [formData, setFormData] = useState({ firstName: '', lastName: '', email: '', phone: '', address: '', isActive: true })
  const [departmentHod, setDepartmentHod] = useState('')
  const [subjectAssignments, setSubjectAssignments] = useState<Array<{ classId: string; subject: string }>>([{ classId: '', subject: '' }])
  const [availableClasses, setAvailableClasses] = useState<Array<{ id: string; name: string; grade: string }>>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { toast } = useToast()

  useEffect(() => {
    if (teacher && isOpen) {
      const nameParts = teacher.name.split(' ')
      setFormData({
        firstName: nameParts[0] || '', lastName: nameParts.slice(1).join(' ') || '',
        email: teacher.email, phone: teacher.phone || '', address: teacher.address || '',
        isActive: teacher.status === 'Active',
      })
      // Fetch teacher details including assignments
      fetch(`/api/school-admin/teachers?search=${encodeURIComponent(teacher.email)}`).then(r => r.json().catch(() => ({ teachers: [] }))).then(d => {
        const t = d.teachers?.find((t: any) => t.email === teacher.email)
        if (t) {
          setDepartmentHod(t.departmentHod || '')
          if (t.subjectAssignments?.length > 0) {
            setSubjectAssignments(t.subjectAssignments.map((a: any) => ({ classId: a.classId, subject: a.subject })))
          } else {
            setSubjectAssignments([{ classId: '', subject: '' }])
          }
        }
      }).catch(() => {})
    }
  }, [teacher, isOpen])

  useEffect(() => {
    if (!isOpen) return
    fetch('/api/school-admin/classes?limit=200').then(r => r.json().catch(() => ({ classes: [] }))).then(d => {
      setAvailableClasses(d.classes || [])
    }).catch(() => {})
  }, [isOpen])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value }))
  }

  const addAssignmentRow = () => setSubjectAssignments(prev => [...prev, { classId: '', subject: '' }])
  const removeAssignmentRow = (index: number) => setSubjectAssignments(prev => prev.filter((_, i) => i !== index))
  const updateAssignmentRow = (index: number, field: 'classId' | 'subject', value: string) => {
    setSubjectAssignments(prev => prev.map((row, i) => i === index ? { ...row, [field]: value } : row))
  }
  const getSubjectsForClass = (classId: string): string[] => {
    const cls = availableClasses.find(c => c.id === classId)
    if (!cls) return ALL_SUBJECTS
    return GRADE_SUBJECT_MAP[cls.grade] || ALL_SUBJECTS
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!teacher) return
    setLoading(true); setError('')
    try {
      const res = await fetch(`/api/school-admin/teachers/${teacher.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, departmentHod: departmentHod || null, subjectAssignments: subjectAssignments.filter(r => r.classId && r.subject) }),
      })
      if (res.ok) { toast({ title: "Success", description: "Teacher updated" }); onSuccess(); onClose() }
      else { const d = await res.json(); setError(d.error || 'Failed') }
    } catch { setError('Network error') }
    finally { setLoading(false) }
  }

  const handleClose = () => {
    setFormData({ firstName: '', lastName: '', email: '', phone: '', address: '', isActive: true })
    setDepartmentHod(''); setSubjectAssignments([{ classId: '', subject: '' }]); setError(''); onClose()
  }

  if (!teacher) return null

  return (
    <AdminModal open={isOpen} onClose={handleClose} title="Edit Teacher"
      subtitle="Update teacher information and settings" icon={<User />} size="xl"
      footer={<AdminModalFooter onCancel={handleClose} submitLabel="Update Teacher" loading={loading} type="submit" />}
    >
      <form id="edit-teacher-form" onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <AdminFormField label="First Name" htmlFor="et-first">
            <input id="et-first" name="firstName" type="text" autoComplete="off" value={formData.firstName} onChange={handleInputChange} placeholder="Enter first name" className={adminInputClass} required />
          </AdminFormField>
          <AdminFormField label="Last Name" htmlFor="et-last">
            <input id="et-last" name="lastName" type="text" autoComplete="off" value={formData.lastName} onChange={handleInputChange} placeholder="Enter last name" className={adminInputClass} required />
          </AdminFormField>
        </div>

        <AdminFormField label="Email Address" htmlFor="et-email">
          <div className="relative"><Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" /><input id="et-email" name="email" type="email" autoComplete="off" value={formData.email} onChange={handleInputChange} placeholder="Enter email address" className={`${adminInputClass} pl-9`} required /></div>
        </AdminFormField>
        <AdminFormField label="Phone Number" htmlFor="et-phone">
          <div className="relative"><Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" /><input id="et-phone" name="phone" type="tel" autoComplete="off" value={formData.phone} onChange={handleInputChange} placeholder="Enter phone number" className={`${adminInputClass} pl-9`} /></div>
        </AdminFormField>
        <AdminFormField label="Address" htmlFor="et-addr">
          <div className="relative"><MapPin className="absolute left-3 top-3 w-4 h-4 text-slate-400" /><textarea id="et-addr" name="address" autoComplete="off" value={formData.address} onChange={handleInputChange} placeholder="Enter address" rows={3} className={`${adminInputClass} pl-9 resize-none`} /></div>
        </AdminFormField>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" name="isActive" checked={formData.isActive} onChange={handleInputChange} className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
          <span className="text-sm text-slate-700">Active Status</span>
        </label>

        {/* HOD */}
        <div className="flex items-center gap-2"><Building2 className="h-4 w-4 text-indigo-500" /><span className="text-sm font-medium text-slate-700">Department Leadership</span></div>
        <AdminFormField label="Head of Department (Optional)" htmlFor="et-hod">
          <select id="et-hod" value={departmentHod} onChange={e => setDepartmentHod(e.target.value)} className={adminInputClass}>
            {HOD_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </select>
        </AdminFormField>

        {/* Class & Subject Mapping */}
        <div className="space-y-3">
          <div className="flex items-center gap-2"><ClipboardList className="h-4 w-4 text-indigo-500" /><span className="text-sm font-medium text-slate-700">Class & Subject Assignments</span></div>
          <div className="space-y-2">
            {subjectAssignments.map((row, idx) => (
              <div key={idx} className="flex items-start gap-2">
                <div className="flex-1 grid grid-cols-2 gap-2">
                  <AdminFormField label={idx === 0 ? "Class" : ""} htmlFor={`sa-class-${idx}`}>
                    <select id={`sa-class-${idx}`} value={row.classId} onChange={e => { updateAssignmentRow(idx, 'classId', e.target.value); if (!row.subject) { const cls = availableClasses.find(c => c.id === e.target.value); if (cls) { const s = GRADE_SUBJECT_MAP[cls.grade] || ALL_SUBJECTS; if (s.length === 1) updateAssignmentRow(idx, 'subject', s[0]) } } }} className={adminInputClass}>
                      <option value="">Select class...</option>
                      {availableClasses.map(c => <option key={c.id} value={c.id}>{c.name} ({c.grade})</option>)}
                    </select>
                  </AdminFormField>
                  <AdminFormField label={idx === 0 ? "Subject" : ""} htmlFor={`sa-subject-${idx}`}>
                    <select id={`sa-subject-${idx}`} value={row.subject} onChange={e => updateAssignmentRow(idx, 'subject', e.target.value)} className={adminInputClass}>
                      <option value="">Select subject...</option>
                      {(row.classId ? getSubjectsForClass(row.classId) : ALL_SUBJECTS).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </AdminFormField>
                </div>
                <button type="button" onClick={() => removeAssignmentRow(idx)} className="mt-6 p-2 text-slate-400 hover:text-red-500 transition-colors"><Trash2 className="h-4 w-4" /></button>
              </div>
            ))}
            <button type="button" onClick={addAssignmentRow} className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-700 transition-colors"><Plus className="h-3.5 w-3.5" /> Add Another Class Assignment</button>
          </div>
        </div>

        {error && <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">{error}</div>}
      </form>
    </AdminModal>
  )
}
