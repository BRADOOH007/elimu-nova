'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import dynamic from 'next/dynamic'

const LessonNotesTab = dynamic(() => import('@/app/teacher/lesson-notes/page'), { ssr: false, loading: () => <div className="flex justify-center py-12"><span className="animate-spin rounded-full h-7 w-7 border-b-2 border-blue-500"/></div> })
import { TermPlanner } from '@/components/teacher/term-planner'
import DocumentUploadButton from '@/components/teacher/document-upload-button'
import { 
  BookOpen, 
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
  Download,
  Share2,
  Calendar,
  GraduationCap,
  FileText,
  MoreHorizontal,
  Loader2,
  Users,
  Send,
  CheckCircle,
  Presentation,
  NotebookPen,
  User
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { useToast } from '@/hooks/use-toast'
import { LessonPlanViewer } from '@/components/lesson-plan/lesson-plan-viewer'
import { parseLessonPlanContent, getLessonPlanFiles } from '@/lib/lesson-plan-files'
import { getSchemeOfWorkFiles } from '@/lib/scheme-of-work-files'

interface LessonPlan {
  id: string
  title: string
  subject: string
  grade: string
  content: any
  createdAt: string
  updatedAt: string
  isShared?: boolean
  schemeOfWork?: { id: string; title: string }
}

interface Topic {
  id: string
  title: string
  description: string
  weekNumber: number
  lessonNumber: number
  objectives: string[]
  activities: string[]
  resources: string[]
  assessment: string
  duration: number
}

interface SchemeOfWorkContent {
  generatedContent: string
  objectives?: string[]
  topics?: string[]
  duration?: number
}

interface SchemeOfWork {
  id: string
  title: string
  subject: string
  grade: string
  term: string
  content: SchemeOfWorkContent
  duration?: number
  objectives?: string
  createdAt: string
  updatedAt: string
  isShared: boolean
  topics?: Topic[]
  _count?: { lessonPlans: number; topics: number; sharedWith?: number }
}

export default function PlanningPage() {
  const { toast } = useToast()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('lesson-plans')

  // Lesson Plans State
  const [lessonPlans, setLessonPlans] = useState<LessonPlan[]>([])
  const [lessonPlansLoading, setLessonPlansLoading] = useState(true)
  const [lessonPlanSearch, setLessonPlanSearch] = useState('')
  const [lessonPlanSubjectFilter, setLessonPlanSubjectFilter] = useState('')
  const [lessonPlanGradeFilter, setLessonPlanGradeFilter] = useState('')
  const [lessonPlanPage, setLessonPlanPage] = useState(1)
  const [lessonPlanTotalPages, setLessonPlanTotalPages] = useState(1)
  const [lessonPlanTotal, setLessonPlanTotal] = useState(0)

  // Schemes of Work State
  const [schemesOfWork, setSchemesOfWork] = useState<SchemeOfWork[]>([])
  const [schemesLoading, setSchemesLoading] = useState(true)
  const [schemeSearch, setSchemeSearch] = useState('')
  const [schemeSubjectFilter, setSchemeSubjectFilter] = useState('')
  const [schemeGradeFilter, setSchemeGradeFilter] = useState('')

  // Common Modal State
  const [selectedLessonPlan, setSelectedLessonPlan] = useState<LessonPlan | null>(null)
  const [selectedScheme, setSelectedScheme] = useState<SchemeOfWork | null>(null)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [isShareModalOpen, setIsShareModalOpen] = useState(false)
  const [itemToShare, setItemToShare] = useState<LessonPlan | SchemeOfWork | null>(null)
  const [students, setStudents] = useState<any[]>([])
  const [classes, setClasses] = useState<any[]>([])
  const [selectedStudents, setSelectedStudents] = useState<string[]>([])
  const [selectedClass, setSelectedClass] = useState<string>('')
  const [sharing, setSharing] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<LessonPlan | SchemeOfWork | null>(null)

  // Per-lesson-plan action loading states
  const [generatingPptx, setGeneratingPptx] = useState<string | null>(null)
  const [generatingNotes, setGeneratingNotes] = useState<string | null>(null)

  // Send to Students modal state
  const [sendModal, setSendModal] = useState(false)
  const [sendItem, setSendItem] = useState<LessonPlan | null>(null)
  const [sendDueDate, setSendDueDate] = useState('')
  const [sendClassId, setSendClassId] = useState('')
  const [sending, setSending] = useState(false)

  // Fetch Data — wait for session to be ready
  useEffect(() => {
    const fetchData = async () => {
      try {
        const lpParams = new URLSearchParams({
          page: String(lessonPlanPage),
          limit: '50',
          ...(lessonPlanSearch && { search: lessonPlanSearch })
        })

        const [lessonsRes, schemesRes, studentsRes, classesRes] = await Promise.all([
          fetch(`/api/lesson-plans?${lpParams}`),
          fetch('/api/schemes-of-work'),
          fetch('/api/teacher/students'),
          fetch('/api/teacher/classes')
        ])

        if (lessonsRes.ok) {
          const lessonData = await lessonsRes.json()
          setLessonPlans(lessonData.lessonPlans || [])
          if (lessonData.pagination) {
            setLessonPlanTotalPages(lessonData.pagination.totalPages)
            setLessonPlanTotal(lessonData.pagination.total)
          }
        }
        if (schemesRes.ok) setSchemesOfWork((await schemesRes.json()).schemesOfWork || [])
        if (studentsRes.ok) setStudents((await studentsRes.json()).data || [])
        if (classesRes.ok) {
          setClasses((await classesRes.json()).data || [])
        } else if (classesRes.status === 401) {
          setTimeout(async () => {
            const retry = await fetch('/api/teacher/classes').catch(() => null)
            if (retry?.ok) setClasses((await retry.json()).data || [])
          }, 1500)
        }
      } catch (err) {
        console.error('Error fetching data:', err)
      } finally {
        setLessonPlansLoading(false)
        setSchemesLoading(false)
      }
    }
    fetchData()
  }, [lessonPlanPage, lessonPlanSearch])

  // Filtering
  const filteredLessonPlans = lessonPlans.filter(lp => {
    const matchesSearch = lp.title.toLowerCase().includes(lessonPlanSearch.toLowerCase()) ||
                         lp.subject.toLowerCase().includes(lessonPlanSearch.toLowerCase()) ||
                         lp.grade.toLowerCase().includes(lessonPlanSearch.toLowerCase())
    const matchesSubject = !lessonPlanSubjectFilter || lessonPlanSubjectFilter === 'all' || lp.subject === lessonPlanSubjectFilter
    const matchesGrade = !lessonPlanGradeFilter || lessonPlanGradeFilter === 'all' || lp.grade === lessonPlanGradeFilter
    return matchesSearch && matchesSubject && matchesGrade
  })

  const filteredSchemes = schemesOfWork.filter(sw => {
    const matchesSearch = sw.title.toLowerCase().includes(schemeSearch.toLowerCase()) ||
                         sw.subject.toLowerCase().includes(schemeSearch.toLowerCase()) ||
                         sw.grade.toLowerCase().includes(schemeSearch.toLowerCase())
    const matchesSubject = !schemeSubjectFilter || schemeSubjectFilter === 'all' || sw.subject === schemeSubjectFilter
    const matchesGrade = !schemeGradeFilter || schemeGradeFilter === 'all' || sw.grade === schemeGradeFilter
    return matchesSearch && matchesSubject && matchesGrade
  })

  const lessonSubjects = [...new Set(lessonPlans.map(lp => lp.subject))].sort()
  const lessonGrades = [...new Set(lessonPlans.map(lp => lp.grade))].sort()
  const schemeSubjects = [...new Set(schemesOfWork.map(sw => sw.subject))].sort()
  const schemeGrades = [...new Set(schemesOfWork.map(sw => sw.grade))].sort()

  // Actions
  const handleDelete = async () => {
    if (!itemToDelete) return
    setDeleting(true)
    try {
      const isLesson = !('term' in itemToDelete)
      const url = isLesson 
        ? `/api/lesson-plans/${itemToDelete.id}` 
        : `/api/schemes-of-work/${itemToDelete.id}`
      
      const res = await fetch(url, { method: 'DELETE' })
      const data = res.ok ? null : await res.json().catch(() => ({}))
      if (!res.ok) {
        toast({ title: 'Delete failed', description: data?.error || 'Server error', variant: 'destructive' })
        return
      }
      if (isLesson) {
        setLessonPlans(prev => prev.filter(lp => lp.id !== itemToDelete.id))
      } else {
        setSchemesOfWork(prev => prev.filter(sw => sw.id !== itemToDelete.id))
      }
      toast({ title: isLesson ? 'Lesson Plan Deleted' : 'Scheme of Work Deleted', variant: 'success' })
      setItemToDelete(null)
    } catch (err) {
      toast({ title: 'Delete failed', description: 'Network error — please try again', variant: 'destructive' })
    } finally {
      setDeleting(false)
    }
  }

  const handleShare = async () => {
    if (!itemToShare) return
    setSharing(true)
    try {
      const isLesson = 'schemeOfWork' in itemToShare
      const url = isLesson 
        ? '/api/lesson-plans/share' 
        : '/api/schemes-of-work/share'
      
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          [isLesson ? 'lessonPlanId' : 'schemeOfWorkId']: itemToShare.id,
          studentIds: selectedStudents,
          classId: selectedClass || undefined
        })
      })

      if (res.ok) {
        const data = await res.json()
        toast({ 
          title: `${isLesson ? 'Lesson Plan' : 'Scheme'} Shared`, 
          description: `Shared with ${data.sharedCount} students`,
          variant: 'success' 
        })
        setIsShareModalOpen(false)
        setSelectedStudents([])
        setSelectedClass('')
        setItemToShare(null)
      }
    } catch (err) {
      console.error('Share error:', err)
    } finally {
      setSharing(false)
    }
  }

  const [teacherName, setTeacherName] = useState('')
  const [currentDate, setCurrentDate] = useState('')

  const handleViewLessonPlan = async (lp: LessonPlan) => {
    setSelectedLessonPlan(lp)
    setIsViewModalOpen(true)
    setTeacherName('')
    setCurrentDate(new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }))
    try {
      const res = await fetch(`/api/lesson-plans/${lp.id}`)
      if (res.ok) {
        const full = await res.json()
        const content = full.content ?? full.generatedContent ?? full
        // Extract teacher name from API response
        const tName = full.teacher?.user
          ? `${full.teacher.user.firstName} ${full.teacher.user.lastName}`.trim()
          : ''
        setTeacherName(tName || 'Teacher')
        setSelectedLessonPlan(prev => prev ? { ...prev, content } : prev)
      }
    } catch {
      // Keep original data if fetch fails
    }
  }

  const generatePptxFromLesson = async (lp: LessonPlan) => {
    setGeneratingPptx(lp.id)
    try {
      const res = await fetch('/api/ai/generate-pptx-from-lesson', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lessonPlanId: lp.id, subject: lp.subject, grade: lp.grade }),
      })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Failed') }
      const blob = await res.blob()
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href     = url
      a.download = `${lp.title.replace(/[^a-z0-9]/gi, '_')}.pptx`
      a.click()
      URL.revokeObjectURL(url)
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'PPTX Failed', description: e.message })
    } finally {
      setGeneratingPptx(null)
    }
  }

  const generateNotesFromLesson = async (lp: LessonPlan) => {
    setGeneratingNotes(lp.id)
    try {
      const planRes = await fetch(`/api/lesson-plans/${lp.id}`)
      if (!planRes.ok) throw new Error('Could not load lesson plan')
      const fullPlan = await planRes.json()

      const res = await fetch('/api/ai/generate-lesson-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lessonPlan: fullPlan, noteType: 'detailed' }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')

      const notes = data.notes
      const esc = (s: string) => s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')

      let html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${esc(notes.title || lp.title)}</title>`
      html += `<style>
        body { font-family: 'Calibri','Segoe UI',Arial,sans-serif; max-width: 800px; margin: 40px auto; padding: 0 20px; color: #1e293b; line-height: 1.6; }
        h1 { font-size: 24px; color: #1e40af; border-bottom: 3px solid #3b82f6; padding-bottom: 8px; margin-bottom: 16px; }
        h2 { font-size: 18px; color: #1e40af; margin-top: 24px; margin-bottom: 8px; }
        h3 { font-size: 15px; color: #475569; margin-top: 16px; margin-bottom: 6px; }
        .summary { background: #eff6ff; border-left: 4px solid #3b82f6; padding: 12px 16px; border-radius: 6px; margin: 12px 0; }
        .section { margin: 16px 0; }
        .section-title { font-size: 16px; font-weight: 600; color: #1e40af; margin-bottom: 6px; }
        .section-content { color: #334155; }
        ul { padding-left: 20px; }
        li { margin-bottom: 4px; }
        .tip { background: #f0fdf4; border-left: 4px solid #22c55e; padding: 10px 14px; border-radius: 6px; margin: 6px 0; }
        .meta { color: #94a3b8; font-size: 13px; margin-bottom: 20px; }
        hr { border: none; border-top: 1px solid #e2e8f0; margin: 24px 0; }
      </style></head><body>`

      if (notes.title) html += `<h1>${esc(notes.title)}</h1>`
      html += `<p class="meta">${esc(lp.subject)} • ${esc(lp.grade)} • ${new Date().toLocaleDateString('en-GB', { day:'numeric', month:'long', year:'numeric' })}</p>`
      if (notes.summary) html += `<div class="summary">${esc(notes.summary)}</div>`

      ;(notes.sections || []).forEach((s: any) => {
        html += `<div class="section">`
        if (s.heading) html += `<div class="section-title">${esc(s.heading)}</div>`
        if (s.content) html += `<div class="section-content">${esc(s.content)}</div>`
        if (s.keyPoints?.length) {
          html += `<ul>${s.keyPoints.map((p: string) => `<li>${esc(p)}</li>`).join('')}</ul>`
        }
        html += `</div>`
      })

      if (notes.studyTips?.length) {
        html += `<hr/><h2>Study Tips</h2>`
        notes.studyTips.forEach((t: string) => {
          html += `<div class="tip">${esc(t)}</div>`
        })
      }

      html += `<hr/><p style="text-align:center;color:#94a3b8;font-size:12px;">Generated by ElimuNova AI • ${new Date().toLocaleDateString('en-GB')}</p>`
      html += `</body></html>`

      const blob = new Blob([html], { type: 'application/msword' })
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href     = url
      a.download = `${lp.title.replace(/[^a-z0-9]/gi, '_')}_notes.doc`
      a.click()
      URL.revokeObjectURL(url)
      toast({ title: 'Notes Downloaded', variant: 'success' })
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Notes Failed', description: e.message })
    } finally {
      setGeneratingNotes(null)
    }
  }

  const downloadLessonPlan = async (lp: LessonPlan, format: 'pdf' | 'word' = 'pdf') => {
    try {
      const res = await fetch('/api/export/lesson-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lessonPlanId: lp.id, title: lp.title, subject: lp.subject, grade: lp.grade, format }),
      })
      if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.error || 'Export failed') }
      const blob = await res.blob()
      const url  = URL.createObjectURL(blob)
      // Determine extension from content-type (pdf or word)
      const ct = res.headers.get('content-type') || ''
      const ext = ct.includes('pdf') ? 'pdf' : 'doc'
      const a = document.createElement('a')
      a.href = url
      a.download = `${lp.title.replace(/[^a-z0-9]/gi, '_')}.${ext}`
      document.body.appendChild(a)
      a.click()
      a.remove()
      setTimeout(() => URL.revokeObjectURL(url), 10000)
      toast({ title: `Downloaded ${ext.toUpperCase()}`, variant: 'success' })
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Download Failed', description: e.message })
    }
  }

  const handleDownload = async (item: LessonPlan | SchemeOfWork, format?: 'pdf' | 'word') => {
    try {
      const isLesson = !('term' in item)
      const url = isLesson 
        ? '/api/export/lesson-plan' 
        : '/api/export/scheme-of-work'
      
      const extractContent = (item: any): string => {
        const raw = item.content
        if (typeof raw === 'string') {
          try { const p = JSON.parse(raw); return p.generatedContent || p.content || raw } catch { return raw }
        }
        if (raw && typeof raw === 'object') return raw.generatedContent || raw.content || ''
        return ''
      }
      const fmt = format || 'pdf'
      const body = isLesson 
        ? { content: extractContent(item), title: item.title, subject: item.subject, grade: item.grade, topic: '', duration: 45, format: fmt }
        : { 
            content: extractContent(item), 
            title: item.title, 
            subject: item.subject, 
            grade: item.grade, 
            duration: (item as SchemeOfWork).duration || 12, 
            lessonsPerWeek: 5, 
            lessonDuration: 45, 
            topics: [], 
            format: fmt 
          }

      const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      if (res.ok) {
        const blob = await res.blob()
        const urlObj = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = urlObj
        const ext = fmt === 'word' ? 'doc' : 'html'
        a.download = `${item.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.${ext}`
        document.body.appendChild(a)
        a.click()
        a.remove()
        window.URL.revokeObjectURL(urlObj)
      }
    } catch (err) {
      console.error('Download error:', err)
    }
  }

  const sendAsAssignment = async () => {
    if (!sendItem || !sendDueDate) {
      toast({ variant: 'destructive', title: 'Please set a due date' }); return
    }
    setSending(true)
    try {
      const content = sendItem.content?.generatedContent || sendItem.content?.content || (typeof sendItem.content === 'string' ? sendItem.content : '')
      const res = await fetch('/api/teacher/send-to-class', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `[Lesson] ${sendItem.title}`,
          description: `Lesson plan: ${sendItem.subject} — ${sendItem.grade}`,
          content,
          dueDate: sendDueDate,
          subject: sendItem.subject,
          grade: sendItem.grade,
          lessonPlanId: sendItem.id,
          classId: sendClassId || undefined,
          type: 'ASSIGNMENT',
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast({ title: '✅ Sent!', description: data.message, variant: 'success' })
      setSendModal(false); setSendItem(null); setSendDueDate(''); setSendClassId('')
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Failed to send', description: e.message })
    } finally { setSending(false) }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Planning</span>
          </h1>
          <p className="text-gray-600">Manage lesson plans and schemes of work</p>
        </div>
        <div className="flex items-center gap-3">
          {activeTab === 'lesson-plans' && <DocumentUploadButton docType="lesson-plan" />}
          {activeTab === 'schemes-of-work' && (
            <>
              <DocumentUploadButton docType="scheme-of-work" />
              <DocumentUploadButton docType="curriculum" label="Upload Curriculum" />
            </>
          )}
          <Button 
            onClick={() => router.push(`/teacher/${activeTab}/create`)} 
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            <Plus className="mr-2 h-4 w-4" />
            Create {activeTab === 'lesson-plans' ? 'Lesson Plan' : 'Scheme of Work'}
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full sm:w-auto grid-cols-2 lg:grid-cols-4">
          <TabsTrigger value="lesson-plans">
            <BookOpen className="w-4 h-4 mr-2" />
            Lesson Plans
          </TabsTrigger>
          <TabsTrigger value="schemes-of-work">
            <FileText className="w-4 h-4 mr-2" />
            Schemes of Work
          </TabsTrigger>
          <TabsTrigger value="lesson-notes">
            <BookOpen className="w-4 h-4 mr-2" />
            Lesson Notes
          </TabsTrigger>
          <TabsTrigger value="term-planner">
            <Calendar className="w-4 h-4 mr-2" />
            Term Planner
          </TabsTrigger>
        </TabsList>

        {/* Lesson Plans Tab */}
        <TabsContent value="lesson-plans" className="space-y-6">
          <Card className="bg-gradient-to-br from-white via-blue-50 to-purple-50 shadow-lg backdrop-blur-sm border-0">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search lesson plans..."
                    value={lessonPlanSearch}
                    onChange={(e) => { setLessonPlanSearch(e.target.value); setLessonPlanPage(1) }}
                    className="pl-10 bg-gradient-to-r from-white via-blue-50 to-purple-50 border-0 shadow-sm"
                  />
                </div>
                <Select value={lessonPlanSubjectFilter} onValueChange={setLessonPlanSubjectFilter}>
                  <SelectTrigger className="bg-gradient-to-r from-white via-blue-50 to-purple-50 border-0 shadow-sm">
                    <SelectValue placeholder="All Subjects" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Subjects</SelectItem>
                    {lessonSubjects.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={lessonPlanGradeFilter} onValueChange={setLessonPlanGradeFilter}>
                  <SelectTrigger className="bg-gradient-to-r from-white via-blue-50 to-purple-50 border-0 shadow-sm">
                    <SelectValue placeholder="All Grades" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Grades</SelectItem>
                    {lessonGrades.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  onClick={() => { setLessonPlanSearch(''); setLessonPlanSubjectFilter(''); setLessonPlanGradeFilter(''); setLessonPlanPage(1) }}
                  className="bg-white"
                >
                  <Filter className="mr-2 h-4 w-4" />
                  Clear
                </Button>
              </div>
            </CardContent>
          </Card>

          {lessonPlansLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : filteredLessonPlans.length === 0 ? (
            <Card className="bg-gradient-to-br from-white via-blue-50 to-purple-50">
              <CardContent className="text-center py-12">
                <BookOpen className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No lesson plans found</h3>
                <Button 
                  onClick={() => router.push('/teacher/lesson-plans/create')}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create First Lesson Plan
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredLessonPlans.map(lp => (
                <Card key={lp.id} className="bg-gradient-to-br from-white via-blue-50 to-purple-50 hover:shadow-xl transition-all">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg font-semibold line-clamp-2">{lp.title}</CardTitle>
                        <CardDescription className="mt-2 flex items-center gap-2">
                          <GraduationCap className="h-4 w-4" />
                          <span>{lp.grade} • {lp.subject}</span>
                        </CardDescription>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => { handleViewLessonPlan(lp) }}>
                            <Eye className="mr-2 h-4 w-4" /> View
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => router.push(`/teacher/lesson-plans/edit/${lp.id}`)}>
                            <Edit className="mr-2 h-4 w-4" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => { setItemToShare(lp); setIsShareModalOpen(true) }}>
                            <Share2 className="mr-2 h-4 w-4" /> Share
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => { setSendItem(lp); setSendModal(true) }}>
                            <Send className="mr-2 h-4 w-4 text-green-600" /> Send to Students
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => downloadLessonPlan(lp, 'pdf')}>
                            <Download className="mr-2 h-4 w-4" /> Download PDF (Print)
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => downloadLessonPlan(lp, 'word')}>
                            <Download className="mr-2 h-4 w-4" /> Download Word (.doc)
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => { setItemToDelete(lp); }} 
                            className="text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center text-sm text-gray-600">
                        <Calendar className="h-4 w-4 mr-2" />
                        Created {new Date(lp.createdAt).toLocaleDateString()}
                      </div>
                      <div className="flex items-center justify-between pt-2">
                        <Badge variant="secondary" className="bg-blue-100 text-blue-800">{lp.subject}</Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => { handleViewLessonPlan(lp) }}
                        >
                          <Eye className="w-4 h-4 mr-1" /> View
                        </Button>
                      </div>
                      {/* Quick actions: PPTX + Notes */}
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={generatingPptx === lp.id}
                          onClick={() => generatePptxFromLesson(lp)}
                          className="bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100 text-xs"
                        >
                          {generatingPptx === lp.id
                            ? <Loader2 className="h-3 w-3 animate-spin mr-1" />
                            : <Presentation className="h-3 w-3 mr-1" />}
                          PPTX
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={generatingNotes === lp.id}
                          onClick={() => generateNotesFromLesson(lp)}
                          className="bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100 text-xs"
                        >
                          {generatingNotes === lp.id
                            ? <Loader2 className="h-3 w-3 animate-spin mr-1" />
                            : <NotebookPen className="h-3 w-3 mr-1" />}
                          Notes
                        </Button>
                      </div>

                      {/* Stored generated files (from Supabase) */}
                      {(() => {
                        const files = getLessonPlanFiles(lp.content)
                        if (!files.hasFiles) return null
                        return (
                          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-2.5">
                            <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700">
                              <CheckCircle className="h-3 w-3" /> Generated files
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              {files.pdfUrl && (
                                <Button asChild size="sm" className="h-7 bg-emerald-600 text-xs hover:bg-emerald-700">
                                  <a href={files.pdfUrl} target="_blank" rel="noopener noreferrer">
                                    <Eye className="h-3 w-3 mr-1" /> PDF
                                  </a>
                                </Button>
                              )}
                              {files.wordUrl && (
                                <Button asChild size="sm" variant="outline" className="h-7 border-emerald-300 text-emerald-700 text-xs">
                                  <a href={files.wordUrl} target="_blank" rel="noopener noreferrer">
                                    <Download className="h-3 w-3 mr-1" /> Word
                                  </a>
                                </Button>
                              )}
                              {files.pptxUrl && (
                                <Button asChild size="sm" variant="outline" className="h-7 border-purple-300 text-purple-700 text-xs">
                                  <a href={files.pptxUrl} target="_blank" rel="noopener noreferrer">
                                    <Presentation className="h-3 w-3 mr-1" /> PPTX
                                  </a>
                                </Button>
                              )}
                            </div>
                          </div>
                        )
                      })()}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
          {/* Lesson Plans Pagination */}
          {!lessonPlansLoading && lessonPlans.length > 0 && lessonPlanTotalPages > 1 && (
            <div className="flex items-center justify-between px-2">
              <p className="text-sm text-gray-600">
                Page {lessonPlanPage} of {lessonPlanTotalPages} ({lessonPlanTotal} total)
              </p>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm"
                  onClick={() => setLessonPlanPage(p => Math.max(1, p - 1))}
                  disabled={lessonPlanPage <= 1}
                >
                  Previous
                </Button>
                <span className="text-sm text-gray-700">Page {lessonPlanPage}</span>
                <Button variant="outline" size="sm"
                  onClick={() => setLessonPlanPage(p => Math.min(lessonPlanTotalPages, p + 1))}
                  disabled={lessonPlanPage >= lessonPlanTotalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </TabsContent>

        {/* Schemes of Work Tab */}
        <TabsContent value="schemes-of-work" className="space-y-6">
          <Card className="bg-gradient-to-br from-white via-green-50 to-blue-50 shadow-lg backdrop-blur-sm border-0">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search schemes..."
                    value={schemeSearch}
                    onChange={(e) => setSchemeSearch(e.target.value)}
                    className="pl-10 bg-gradient-to-r from-white via-green-50 to-blue-50 border-0 shadow-sm"
                  />
                </div>
                <Select value={schemeSubjectFilter} onValueChange={setSchemeSubjectFilter}>
                  <SelectTrigger className="bg-gradient-to-r from-white via-green-50 to-blue-50 border-0 shadow-sm">
                    <SelectValue placeholder="All Subjects" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Subjects</SelectItem>
                    {schemeSubjects.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={schemeGradeFilter} onValueChange={setSchemeGradeFilter}>
                  <SelectTrigger className="bg-gradient-to-r from-white via-green-50 to-blue-50 border-0 shadow-sm">
                    <SelectValue placeholder="All Grades" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Grades</SelectItem>
                    {schemeGrades.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  onClick={() => { setSchemeSearch(''); setSchemeSubjectFilter(''); setSchemeGradeFilter('') }}
                  className="bg-white"
                >
                  <Filter className="mr-2 h-4 w-4" />
                  Clear
                </Button>
              </div>
            </CardContent>
          </Card>

          {schemesLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-green-600" />
            </div>
          ) : filteredSchemes.length === 0 ? (
            <Card className="bg-gradient-to-br from-white via-green-50 to-blue-50">
              <CardContent className="text-center py-12">
                <FileText className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No schemes of work found</h3>
                <Button 
                  onClick={() => router.push('/teacher/schemes-of-work/create')}
                  className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create First Scheme
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredSchemes.map(sw => (
                <Card key={sw.id} className="bg-gradient-to-br from-white via-green-50 to-blue-50 hover:shadow-xl transition-all">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg font-semibold line-clamp-2">{sw.title}</CardTitle>
                        <CardDescription className="mt-2 flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          <span>{sw.grade} • {sw.subject}</span>
                        </CardDescription>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => { setSelectedScheme(sw); setIsViewModalOpen(true) }}>
                            <Eye className="mr-2 h-4 w-4" /> View
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => router.push(`/teacher/schemes-of-work/edit/${sw.id}`)}>
                            <Edit className="mr-2 h-4 w-4" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDownload(sw, 'pdf')}>
                            <Download className="mr-2 h-4 w-4" /> Download PDF
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDownload(sw, 'word')}>
                            <FileText className="mr-2 h-4 w-4" /> Download Word
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => { setItemToShare(sw); setIsShareModalOpen(true) }}>
                            <Share2 className="mr-2 h-4 w-4" /> Share
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => { setItemToDelete(sw); }} 
                            className="text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center text-sm text-gray-600">
                        <Calendar className="h-4 w-4 mr-2" />
                        Created {new Date(sw.createdAt).toLocaleDateString()}
                      </div>
                      {sw._count && (
                        <div className="flex items-center text-sm text-gray-600">
                          <CheckCircle className="h-4 w-4 mr-2" />
                          {sw._count.lessonPlans} lesson plans
                        </div>
                      )}
                      <div className="grid grid-cols-2 gap-2 pt-2">
                        <Button
                          onClick={() => { setSelectedScheme(sw); setIsViewModalOpen(true) }}
                          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                        >
                          <Eye className="w-4 h-4 mr-2" /> View
                        </Button>
                        <Button
                          onClick={() => { setItemToShare(sw); setIsShareModalOpen(true) }}
                          variant="outline"
                        >
                          <Share2 className="w-4 h-4 mr-2" /> Share
                        </Button>
                      </div>

                      {/* Stored generated files (from Supabase) */}
                      {(() => {
                        const files = getSchemeOfWorkFiles(sw.content)
                        if (!files.hasFiles) return null
                        return (
                          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-2.5">
                            <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700">
                              <CheckCircle className="h-3 w-3" /> Generated files
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              {files.pdfUrl && (
                                <Button asChild size="sm" className="h-7 bg-emerald-600 text-xs hover:bg-emerald-700">
                                  <a href={files.pdfUrl} target="_blank" rel="noopener noreferrer">
                                    <Eye className="h-3 w-3 mr-1" /> PDF
                                  </a>
                                </Button>
                              )}
                              {files.wordUrl && (
                                <Button asChild size="sm" variant="outline" className="h-7 border-emerald-300 text-emerald-700 text-xs">
                                  <a href={files.wordUrl} target="_blank" rel="noopener noreferrer">
                                    <Download className="h-3 w-3 mr-1" /> Word
                                  </a>
                                </Button>
                              )}
                            </div>
                          </div>
                        )
                      })()}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
        <TabsContent value="lesson-notes"><LessonNotesTab /></TabsContent>
        <TabsContent value="term-planner"><TermPlanner /></TabsContent>
      </Tabs>

      {/* View Modal */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedLessonPlan && <BookOpen className="h-5 w-5 text-blue-600" />}
              {selectedScheme && <FileText className="h-5 w-5 text-green-600" />}
              <span>{selectedLessonPlan?.title || selectedScheme?.title}</span>
            </DialogTitle>
            <DialogDescription className="flex items-center gap-4 flex-wrap">
              <span>{(selectedLessonPlan?.subject || selectedScheme?.subject)} • {(selectedLessonPlan?.grade || selectedScheme?.grade)}</span>
              {selectedLessonPlan && teacherName && (
                <span className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
                  <User className="h-3 w-3" /> {teacherName}
                </span>
              )}
              {currentDate && (
                <span className="inline-flex items-center gap-1 text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                  <Calendar className="h-3 w-3" /> {currentDate}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogBody className="space-y-4 mt-1">
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-2">Content</h4>
              <LessonPlanViewer
                content={selectedLessonPlan?.content ?? selectedScheme?.content}
                teacherName={teacherName || undefined}
                date={currentDate || undefined}
              />
            </div>
            {selectedLessonPlan && (() => {
              const files = getLessonPlanFiles(selectedLessonPlan.content)
              if (!files.hasFiles) return null
              const label = selectedLessonPlan.subject || ''
              const grade = selectedLessonPlan.grade || ''
              return (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                  <h4 className="font-semibold text-emerald-800 mb-2">💾 Generated Files</h4>
                  <div className="flex flex-wrap gap-2">
                    {files.pdfUrl && (
                      <Button asChild size="sm" className="bg-emerald-600 hover:bg-emerald-700">
                        <a href={files.pdfUrl} target="_blank" rel="noopener noreferrer">
                          <Eye className="h-4 w-4 mr-1" /> Preview PDF
                        </a>
                      </Button>
                    )}
                    {files.wordUrl && (
                      <Button asChild size="sm" variant="outline" className="border-emerald-300 text-emerald-700">
                        <a href={files.wordUrl} target="_blank" rel="noopener noreferrer" download>
                          <Download className="h-4 w-4 mr-1" /> Download Word
                        </a>
                      </Button>
                    )}
                    {files.pptxUrl && (
                      <Button asChild size="sm" variant="outline" className="border-purple-300 text-purple-700">
                        <a href={files.pptxUrl} target="_blank" rel="noopener noreferrer" download>
                          <Presentation className="h-4 w-4 mr-1" /> Download PPTX
                        </a>
                      </Button>
                    )}
                  </div>
                  {label && <p className="mt-2 text-xs text-emerald-600">{label} • {grade}</p>}
                </div>
              )
            })()}
            {selectedScheme && (() => {
              const files = getSchemeOfWorkFiles(selectedScheme.content)
              if (!files.hasFiles) return null
              return (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                  <h4 className="font-semibold text-emerald-800 mb-2">💾 Generated Files</h4>
                  <div className="flex flex-wrap gap-2">
                    {files.pdfUrl && (
                      <Button asChild size="sm" className="bg-emerald-600 hover:bg-emerald-700">
                        <a href={files.pdfUrl} target="_blank" rel="noopener noreferrer">
                          <Eye className="h-4 w-4 mr-1" /> Preview PDF
                        </a>
                      </Button>
                    )}
                    {files.wordUrl && (
                      <Button asChild size="sm" variant="outline" className="border-emerald-300 text-emerald-700">
                        <a href={files.wordUrl} target="_blank" rel="noopener noreferrer" download>
                          <Download className="h-4 w-4 mr-1" /> Download Word
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              )
            })()}
          </DialogBody>
          <DialogFooter>
            {selectedLessonPlan && (
              <>
                <Button variant="outline" onClick={() => handleDownload(selectedLessonPlan)}>
                  <Download className="mr-2 h-4 w-4" /> Download
                </Button>
                <Button
                  onClick={() => router.push(`/teacher/lesson-plans/edit/${selectedLessonPlan.id}`)}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  <Edit className="mr-2 h-4 w-4" /> Edit
                </Button>
              </>
            )}
            {selectedScheme && (
              <>
                <Button
                  onClick={() => router.push(`/teacher/schemes-of-work/edit/${selectedScheme.id}`)}
                  className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
                >
                  <Edit className="mr-2 h-4 w-4" /> Edit
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!itemToDelete} onOpenChange={() => setItemToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {itemToDelete && (!('term' in itemToDelete) ? 'Lesson Plan' : 'Scheme of Work')}</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{itemToDelete?.title}"? This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end space-x-2 mt-4">
            <Button variant="outline" onClick={() => setItemToDelete(null)} disabled={deleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Deleting...</>
              ) : (
                <><Trash2 className="mr-2 h-4 w-4" /> Delete</>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Share Modal */}
      <Dialog open={isShareModalOpen} onOpenChange={setIsShareModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Share2 className="mr-2 h-5 w-5" />
              Share {itemToShare && ('schemeOfWork' in itemToShare ? 'Lesson Plan' : 'Scheme of Work')}
            </DialogTitle>
            <DialogDescription>
              Share "{itemToShare?.title}" with your students
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Share with Entire Class</label>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger>
                  <SelectValue placeholder={classes.length > 0 ? "Select a class" : "No classes available"} />
                </SelectTrigger>
                <SelectContent>
                  {classes.length > 0 ? (
                    classes.map(cls => (
                      <SelectItem key={cls.id} value={cls.id}>{cls.name} - {cls.grade}</SelectItem>
                    ))
                  ) : (
                    <SelectItem value="no-classes" disabled>No classes found</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Or Share with Individual Students</label>
              <div className="max-h-60 overflow-y-auto border rounded-md p-3 space-y-2">
                {students.length > 0 ? (
                  students.map(student => (
                    <div key={student.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={student.id}
                        checked={selectedStudents.includes(student.id)}
                        onCheckedChange={(checked) => {
                          if (checked) setSelectedStudents(prev => [...prev, student.id])
                          else setSelectedStudents(prev => prev.filter(id => id !== student.id))
                        }}
                      />
                      <label htmlFor={student.id} className="text-sm font-medium">
                        {student.user?.firstName} {student.user?.lastName} - {student.class?.name || student.grade}
                      </label>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No students found</p>
                  </div>
                )}
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsShareModalOpen(false)} disabled={sharing}>
                Cancel
              </Button>
              <Button
                onClick={handleShare}
                disabled={sharing || (!selectedClass && selectedStudents.length === 0)}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                {sharing ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sharing...</>
                ) : (
                  <><Send className="mr-2 h-4 w-4" /> Share</>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Send to Students as Assignment Modal */}
      <Dialog open={sendModal} onOpenChange={setSendModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Send className="mr-2 h-5 w-5 text-green-600" />
              Send Lesson as Assignment
            </DialogTitle>
            <DialogDescription>
              "{sendItem?.title}" will be sent as an assignment to students
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Due Date *</label>
              <Input type="datetime-local" value={sendDueDate} onChange={e => setSendDueDate(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Send to Class (optional)</label>
              <Select value={sendClassId} onValueChange={setSendClassId}>
                <SelectTrigger>
                  <SelectValue placeholder="All my students (no specific class)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All my students</SelectItem>
                  {classes.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name} — {c.grade}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end space-x-2 pt-2">
              <Button variant="outline" onClick={() => setSendModal(false)} disabled={sending}>Cancel</Button>
              <Button onClick={sendAsAssignment} disabled={sending || !sendDueDate} className="bg-gradient-to-r from-green-600 to-blue-600">
                {sending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/>Sending...</> : <><Send className="mr-2 h-4 w-4"/>Send</>}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

