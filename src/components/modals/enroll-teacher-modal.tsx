"use client"

import { useEffect, useMemo, useState } from 'react'
import { cn } from "@/lib/utils"
import {
  AdminModal,
  AdminModalFooter,
  AdminFormField,
  adminInputClass,
} from "@/components/ui/admin-modal"
import {
  UserPlus, Eye, EyeOff, CheckCircle, Copy, KeyRound,
  Sparkles, GraduationCap, BookOpen, RefreshCw, Check, Mail,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Credentials {
  username: string
  password: string | null
  email: string
  name: string
}

interface EnrollTeacherModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

const GRADE_BANDS: Array<{ label: string; grades: string[] }> = [
  { label: 'Pre-Primary',   grades: ['PP1', 'PP2'] },
  { label: 'Lower Primary', grades: ['Grade 1', 'Grade 2', 'Grade 3'] },
  { label: 'Upper Primary', grades: ['Grade 4', 'Grade 5', 'Grade 6'] },
  { label: 'Junior School', grades: ['Grade 7', 'Grade 8', 'Grade 9'] },
  { label: 'Senior School', grades: ['Grade 10', 'Grade 11', 'Grade 12', 'Form 1', 'Form 2', 'Form 3', 'Form 4'] },
]

const SUBJECT_OPTIONS = [
  'Language Activities','Mathematical Activities','Environmental Activities','Psychomotor & Creative Activities',
  'English','Kiswahili / KSL','Mathematics','Religious Education','Creative Activities','Science & Technology',
  'Agriculture & Nutrition','Social Studies','Creative Arts','Integrated Science','Pre-Technical Studies',
  'Creative Arts & Sports','English / Kiswahili / KSL','Community Service Learning','Physical Education',
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

const ALL_SUBJECTS = [...new Set([...SUBJECT_OPTIONS, ...Object.values(GRADE_SUBJECT_MAP).flat()])]

const CORE_SUBJECTS_BY_GRADE: Record<string, string[]> = {
  PP1: ['Language Activities','Mathematical Activities'],
  PP2: ['Language Activities','Mathematical Activities'],
  'Grade 1': ['English','Kiswahili / KSL','Mathematics'],
  'Grade 2': ['English','Kiswahili / KSL','Mathematics'],
  'Grade 3': ['English','Kiswahili / KSL','Mathematics'],
  'Grade 4': ['English','Kiswahili / KSL','Mathematics','Science & Technology'],
  'Grade 5': ['English','Kiswahili / KSL','Mathematics','Science & Technology'],
  'Grade 6': ['English','Kiswahili / KSL','Mathematics','Science & Technology'],
  'Grade 7': ['English','Kiswahili / KSL','Mathematics','Integrated Science'],
  'Grade 8': ['English','Kiswahili / KSL','Mathematics','Integrated Science'],
  'Grade 9': ['English','Kiswahili / KSL','Mathematics','Integrated Science'],
  'Grade 10': ['English / Kiswahili / KSL','Mathematics'],
  'Grade 11': ['English / Kiswahili / KSL','Mathematics'],
  'Grade 12': ['English / Kiswahili / KSL','Mathematics'],
  'Form 1': ['English / Kiswahili / KSL','Mathematics'],
  'Form 2': ['English / Kiswahili / KSL','Mathematics'],
  'Form 3': ['English / Kiswahili / KSL','Mathematics'],
  'Form 4': ['English / Kiswahili / KSL','Mathematics'],
}

const DRAFT_KEY = 'enroll-teacher-draft-v1'

interface Draft {
  formData: { firstName: string; lastName: string; email: string; phone: string }
  generatedPassword: string
  selectedGrades: string[]
  manualSubjects: string[]
  removedAutoSubjects: string[]
}

function loadDraft(): Draft | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(DRAFT_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Draft
    if (!parsed?.formData) return null
    return parsed
  } catch { return null }
}
function saveDraft(draft: Draft) { if (typeof window !== 'undefined') try { localStorage.setItem(DRAFT_KEY, JSON.stringify(draft)) } catch {} }
function clearDraft() { if (typeof window !== 'undefined') try { localStorage.removeItem(DRAFT_KEY) } catch {} }

function previewUsername(first: string, last: string): string {
  const f = first.trim().toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/g, '')
  const l = last.trim().toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/g, '')
  if (f && l) return `${f}.${l}`
  return f || l
}
function generatePassword(): string {
  const adjs = ['Blue','Green','Happy','Brave','Swift','Bright','Calm','Bold','Clever','Golden']
  const nouns = ['Lion','Star','River','Eagle','Mountain','Sunrise','Ocean','Forest','Tiger','Falcon']
  return `${adjs[Math.floor(Math.random()*adjs.length)]}${nouns[Math.floor(Math.random()*nouns.length)]}${Math.floor(100+Math.random()*900)}`
}

function Pill({ active, onClick, children, badge }: { active: boolean; onClick: () => void; children: React.ReactNode; badge?: string }) {
  return (
    <button type="button" onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all duration-200",
        active ? "border-indigo-500 bg-gradient-to-r from-indigo-500 to-violet-500 text-white shadow-sm"
               : "border-slate-200 bg-white text-slate-600 hover:border-indigo-300 hover:bg-indigo-50/60"
      )}>
      {active && <Check className="h-3 w-3" />}{children}
      {badge && <span className={cn("text-[9px] font-bold uppercase tracking-wide rounded-full px-1.5 py-0.5 leading-none", active ? "bg-white/25 text-white" : "bg-indigo-100 text-indigo-600")}>{badge}</span>}
    </button>
  )
}

export function EnrollTeacherModal({ isOpen, onClose, onSuccess }: EnrollTeacherModalProps) {
  const [draft] = useState<Draft | null>(() => loadDraft())
  const [formData, setFormData] = useState(draft?.formData || { firstName: '', lastName: '', email: '', phone: '' })
  const [generatedPassword, setGeneratedPassword] = useState(draft?.generatedPassword || '')
  const [selectedGrades, setSelectedGrades] = useState<string[]>(draft?.selectedGrades || [])
  const [manualSubjects, setManualSubjects] = useState<string[]>(draft?.manualSubjects || [])
  const [removedAutoSubjects, setRemovedAutoSubjects] = useState<string[]>(draft?.removedAutoSubjects || [])
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [credentials, setCredentials] = useState<Credentials | null>(null)
  const { toast } = useToast()

  useEffect(() => { if (isOpen && !generatedPassword) setGeneratedPassword(generatePassword()) }, [isOpen])
  useEffect(() => { if (isOpen && !credentials) saveDraft({ formData, generatedPassword, selectedGrades, manualSubjects, removedAutoSubjects }) }, [formData, generatedPassword, selectedGrades, manualSubjects, removedAutoSubjects, isOpen, credentials])

  const previewUser = useMemo(() => previewUsername(formData.firstName, formData.lastName), [formData.firstName, formData.lastName])

  const autoAssignedSubjects = useMemo(() => {
    const set = new Set<string>()
    for (const grade of selectedGrades) for (const s of CORE_SUBJECTS_BY_GRADE[grade] || []) set.add(s)
    return [...set]
  }, [selectedGrades])

  const effectiveSubjects = useMemo(() => {
    const removed = new Set(removedAutoSubjects)
    const merged = new Set<string>()
    for (const s of autoAssignedSubjects) { if (!removed.has(s)) merged.add(s) }
    for (const s of manualSubjects) merged.add(s)
    return [...merged]
  }, [autoAssignedSubjects, manualSubjects, removedAutoSubjects])

  const optionalSubjects = useMemo(() => ALL_SUBJECTS.filter(s => !autoAssignedSubjects.includes(s)), [autoAssignedSubjects])

  const toggleGrade = (g: string) => setSelectedGrades(prev => prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g])
  const toggleSubject = (subject: string) => {
    const isAuto = autoAssignedSubjects.includes(subject)
    const isSelected = effectiveSubjects.includes(subject)
    if (isSelected) { setManualSubjects(prev => prev.filter(s => s !== subject)); if (isAuto) setRemovedAutoSubjects(prev => [...prev, subject]) }
    else { if (isAuto) setRemovedAutoSubjects(prev => prev.filter(s => s !== subject)); else setManualSubjects(prev => prev.includes(subject) ? prev : [...prev, subject]) }
  }

  const selectOnlyCore = () => { setRemovedAutoSubjects([]); setManualSubjects([]) }
  const selectAllSubjects = () => { setRemovedAutoSubjects([]); setManualSubjects(optionalSubjects) }
  const clearSubjects = () => { setManualSubjects([]); setRemovedAutoSubjects([...autoAssignedSubjects]) }
  const copyPassword = () => { if (generatedPassword) { navigator.clipboard.writeText(generatedPassword); toast({ title: "Copied", description: "Password copied to clipboard" }) } }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.firstName || !formData.lastName || !formData.email) { toast({ title: "Error", description: "Please fill in all required fields", variant: "destructive" }); return }
    setIsLoading(true)
    try {
      const res = await fetch('/api/school-admin/teachers', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ firstName: formData.firstName, lastName: formData.lastName, email: formData.email, phone: formData.phone, password: generatedPassword, gradeLevels: selectedGrades, subjects: effectiveSubjects }) })
      if (res.ok) { const data = JSON.parse(await res.text()); clearDraft(); setCredentials({ username: data.teacher?.username || previewUser, password: data.teacher?.password || generatedPassword, email: formData.email, name: `${formData.firstName} ${formData.lastName}` }); onSuccess() }
      else { const t = await res.text(); let msg = "Failed to enroll teacher"; try { msg = JSON.parse(t).error || msg } catch {}; toast({ title: "Error", description: msg, variant: "destructive" }) }
    } catch { toast({ title: "Error", description: "An unexpected error occurred", variant: "destructive" }) }
    finally { setIsLoading(false) }
  }

  const handleClose = () => { setCredentials(null); setShowPassword(false); onClose() }
  const handleDone = () => { setFormData({ firstName: '', lastName: '', email: '', phone: '' }); setGeneratedPassword(''); setSelectedGrades([]); setManualSubjects([]); setRemovedAutoSubjects([]); setCredentials(null); setShowPassword(false); onClose() }
  const copyCredentials = () => { if (credentials) { navigator.clipboard.writeText(`Name: ${credentials.name}\nEmail: ${credentials.email}\nUsername: ${credentials.username}\nPassword: ${credentials.password}`); toast({ title: "Copied", description: "Credentials copied to clipboard" }) } }

  return (
    <AdminModal open={isOpen} onClose={handleClose} title="Enroll New Teacher"
      subtitle="Add a new teacher to your school roster and assign their teaching areas."
      icon={<UserPlus />} size="xl"
      footer={credentials ? (
        <div className="flex gap-2 w-full justify-end">
          <button onClick={copyCredentials} className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition inline-flex items-center gap-1.5"><Copy className="h-4 w-4" />Copy All</button>
          <button onClick={handleDone} className="rounded-lg bg-indigo-600 hover:bg-indigo-700 px-5 py-2 text-sm font-medium text-white shadow-sm transition">Done</button>
        </div>
      ) : (
        <AdminModalFooter onCancel={handleClose} submitLabel="Enroll Teacher" loading={isLoading} type="submit" />
      )}
    >
      {credentials ? (
        <div className="space-y-4">
          <div className="text-center">
            <CheckCircle className="h-12 w-12 text-emerald-500 mx-auto mb-2" />
            <h3 className="text-lg font-bold text-slate-900">Teacher Enrolled</h3>
            <p className="text-sm text-slate-500 mt-1">Share these credentials with the teacher securely.</p>
          </div>
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
            <div><p className="text-xs text-slate-500">Name</p><p className="font-semibold">{credentials.name}</p></div>
            <div><p className="text-xs text-slate-500">Email</p><p className="font-semibold">{credentials.email}</p></div>
            {formData.phone && <div><p className="text-xs text-slate-500">Phone</p><p className="font-semibold">{formData.phone}</p></div>}
            <div><p className="text-xs text-slate-500">Username</p><p className="font-mono text-indigo-600 font-semibold">{credentials.username}</p></div>
            {credentials.password && <div><p className="text-xs text-slate-500">Password</p><span className="font-mono font-semibold">{showPassword ? credentials.password : '\u2022'.repeat(8)}</span></div>}
          </div>
          <p className="text-xs text-amber-600 text-center">Save these credentials now — the password cannot be recovered later</p>
        </div>
      ) : (
        <form id="enroll-teacher-form" onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <AdminFormField label="First Name" htmlFor="et-first" required>
              <input id="et-first" type="text" autoComplete="off" placeholder="Enter first name"
                value={formData.firstName} onChange={e => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                className={adminInputClass} required />
            </AdminFormField>
            <AdminFormField label="Last Name" htmlFor="et-last" required>
              <input id="et-last" type="text" autoComplete="off" placeholder="Enter last name"
                value={formData.lastName} onChange={e => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                className={adminInputClass} required />
            </AdminFormField>
          </div>
          {(formData.firstName || formData.lastName) && (
            <div className="bg-gradient-to-br from-indigo-50 to-violet-50 border border-indigo-100 rounded-xl p-3 space-y-1.5">
              <p className="text-xs font-semibold text-indigo-700 flex items-center gap-1"><Sparkles className="w-3 h-3" /> Auto-generated Credentials</p>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-500 w-20 shrink-0">Username:</span>
                <code className="font-mono bg-white px-2 py-0.5 rounded text-slate-800">{previewUser || '\u2026'}</code>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-500 w-20 shrink-0">Password:</span>
                <code className="font-mono bg-white px-2 py-0.5 rounded text-slate-800">{showPassword ? generatedPassword : '\u2022'.repeat(generatedPassword.length)}</code>
                <button type="button" onClick={() => setShowPassword(v => !v)} className="text-slate-400 hover:text-slate-600">{showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}</button>
                <button type="button" onClick={copyPassword} className="text-slate-400 hover:text-slate-600" title="Copy"><Copy className="h-3.5 w-3.5" /></button>
                <button type="button" onClick={() => setGeneratedPassword(generatePassword())} className="text-slate-400 hover:text-indigo-600 ml-auto inline-flex items-center gap-1"><RefreshCw className="h-3 w-3" /> Regenerate</button>
              </div>
            </div>
          )}
          <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-indigo-500" /><span className="text-sm font-medium text-slate-700">Contact Information</span></div>
          <AdminFormField label="Email Address" htmlFor="et-email" required>
            <input id="et-email" type="email" autoComplete="off" placeholder="Enter email address"
              value={formData.email} onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
              className={adminInputClass} required />
          </AdminFormField>
          <AdminFormField label="Phone Number" htmlFor="et-phone">
            <input id="et-phone" type="tel" autoComplete="off" placeholder="Enter phone number"
              value={formData.phone} onChange={e => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              className={adminInputClass} />
          </AdminFormField>
          <div className="space-y-3">
            <div className="flex items-center gap-2"><GraduationCap className="h-4 w-4 text-indigo-500" /><span className="text-sm font-medium text-slate-700">Grade Levels</span></div>
            <div className="space-y-3">
              {GRADE_BANDS.map(band => (
                <div key={band.label}>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">{band.label}</p>
                  <div className="flex flex-wrap gap-2">{band.grades.map(g => <Pill key={g} active={selectedGrades.includes(g)} onClick={() => toggleGrade(g)}>{g}</Pill>)}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-2"><BookOpen className="h-4 w-4 text-indigo-500" /><span className="text-sm font-medium text-slate-700">Learning Areas / Subjects</span></div>
            <div className="flex flex-wrap items-center gap-1.5">
              <button type="button" onClick={selectOnlyCore} className="text-[11px] font-medium text-indigo-600 bg-indigo-50 border border-indigo-100 hover:bg-indigo-100 rounded-full px-2.5 py-1 transition-colors">Core subjects</button>
              <button type="button" onClick={selectAllSubjects} className="text-[11px] font-medium text-slate-600 bg-slate-50 border border-slate-200 hover:bg-slate-100 rounded-full px-2.5 py-1 transition-colors">Select all</button>
              <button type="button" onClick={clearSubjects} className="text-[11px] font-medium text-rose-500 bg-rose-50 border border-rose-100 hover:bg-rose-100 rounded-full px-2.5 py-1 transition-colors">Clear</button>
              <span className="ml-auto text-[11px] text-slate-400">{effectiveSubjects.length} selected</span>
            </div>
            {selectedGrades.length > 0 && <p className="text-xs text-indigo-600 bg-indigo-50 border border-indigo-100 rounded-lg px-3 py-2">Core subjects for the selected grades are pre-selected. Tap any pill to adjust.</p>}
            {autoAssignedSubjects.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Core</p>
                <div className="flex flex-wrap gap-2">{autoAssignedSubjects.map(s => <Pill key={s} active={effectiveSubjects.includes(s)} onClick={() => toggleSubject(s)} badge="Core">{s}</Pill>)}</div>
              </div>)}
            {optionalSubjects.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Optional</p>
                <div className="flex flex-wrap gap-2">{optionalSubjects.map(s => <Pill key={s} active={effectiveSubjects.includes(s)} onClick={() => toggleSubject(s)}>{s}</Pill>)}</div>
              </div>)}
          </div>
        </form>
      )}
    </AdminModal>
  )
}
