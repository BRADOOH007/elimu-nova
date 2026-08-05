'use client'

import { useState, useEffect, useRef } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Plus, X, Calendar, Users, BookOpen, FileText, Clock, AlertCircle,
  Brain, Loader2, Eye, Edit3, Search, Timer, CheckSquare, Trash2,
  ChevronRight, ChevronLeft, Check, CheckCircle, GraduationCap, Mail, User,
  Sparkles, Upload, Video, Link, Play,
} from 'lucide-react'
import { MarkdownRenderer } from '@/components/ui/markdown-renderer'
import { useToast } from '@/hooks/use-toast'
import AnswerGuide from '@/components/answer-guide'

interface CreateAssignmentModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  initialData?: {
    title?: string
    description?: string
    content?: string
    subject?: string
    grade?: string
    topic?: string
    isTimed?: boolean
    timeLimit?: number
    questions?: Question[]
    answerKey?: string
  }
}

interface Student {
  id: string; name: string; email: string; classId?: string | null; className?: string
}

interface Class {
  id: string; name: string; subject: string; grade: string
}

interface LessonPlan {
  id: string; title: string; subject: string; grade: string
}

interface Question {
  id: string; type: 'multiple_choice' | 'true_false' | 'short_answer'
  text: string; marks: number; options?: string[]; correctAnswer: string
}

const STEPS = ['Details', 'Media', 'Content', 'Students', 'Review'] as const

function initials(name: string) {
  return name.split(' ').map(s => s[0]).filter(Boolean).join('').slice(0, 2).toUpperCase()
}

const SUBJECTS = [
  'Mathematics','English','Kiswahili','Science','Social Studies','CRE','IRE',
  'Agriculture','Physics','Chemistry','Biology','History','Geography',
  'Business Studies','Computer Studies','Music','Art & Craft','Physical Education',
]
const GRADES = [
  'Grade 1','Grade 2','Grade 3','Grade 4','Grade 5','Grade 6',
  'Grade 7','Grade 8','Grade 9','Form 1','Form 2','Form 3','Form 4',
]
const TOPIC_SUGGESTIONS: Record<string, string[]> = {
  Mathematics: [
    'Whole Numbers', 'Fractions', 'Decimals', 'Percentages', 'Measurement',
    'Geometry', 'Algebra', 'Data Handling', 'Money', 'Time',
    'Length, Area & Volume', 'Mass & Capacity', 'Position & Direction',
    'Tables & Graphs', 'Number Patterns', 'Ratios & Proportions',
    'Scale Drawing', 'Circles', 'Area of Triangles & Quadrilaterals',
    'Surface Area & Volume of Solids',
  ],
  English: [
    'Listening & Speaking', 'Reading Comprehension', 'Grammar',
    'Writing Composition', 'Vocabulary Development', 'Spelling',
    'Punctuation', 'Poetry', 'Oral Narratives', 'Letter Writing',
    'Creative Writing', 'Functional Writing', 'Reading Aloud',
    'Sentence Structure', 'Word Classes',
  ],
  Kiswahili: [
    'Kusikiliza na Kuzungumza', 'Sarufi', 'Msamiati',
    'Ufahamu', 'Insha', 'Matumizi ya Lugha',
    'Fasihi Simulizi', 'Ushairi', 'Isimu',
  ],
  Science: [
    'Living Things', 'Plants', 'Animals', 'Human Body',
    'Energy', 'Light', 'Sound', 'Forces & Motion',
    'Materials', 'Weather', 'Water', 'Soil',
    'Food & Nutrition', 'Health Education', 'Environment',
    'Simple Machines', 'Electricity', 'Magnets',
  ],
  'Social Studies': [
    'Our Country', 'Our Environment', 'Resources', 'Transport',
    'Communication', 'Culture', 'Government', 'Citizenship',
    'History of Kenya', 'Map Reading', 'Population',
    'Trade', 'Food Production',
  ],
  Agriculture: [
    'Crop Farming', 'Animal Keeping', 'Soil Preparation',
    'Planting', 'Harvesting', 'Marketing',
    'Farm Tools', 'Pests & Diseases', 'Water Conservation',
  ],
  Physics: [
    'Forces', 'Motion', 'Energy', 'Waves', 'Light',
    'Electricity', 'Magnetism', 'Heat Transfer',
    'Fluids', 'Sound', 'Electromagnetism',
  ],
  Chemistry: [
    'States of Matter', 'Mixtures', 'Atoms & Elements',
    'Chemical Reactions', 'Acids & Bases', 'Water & Solutions',
    'Organic Chemistry', 'Periodic Table',
  ],
  Biology: [
    'Cells', 'Classification', 'Nutrition', 'Respiration',
    'Transport Systems', 'Reproduction', 'Ecology',
    'Genetics', 'Human Health', 'Microorganisms',
  ],
  History: [
    'Early Man', 'Agriculture in Kenya', 'Trade in Pre-Colonial Kenya',
    'Colonial Administration', 'Struggle for Independence',
    'Constitution & Governance', 'World Wars',
  ],
  Geography: [
    'Map Work', 'Weather & Climate', 'Vegetation', 'Soils',
    'Mining', 'Forestry', 'Fishing', 'Tourism',
    'Population', 'Urbanization', 'Environmental Conservation',
  ],
  'Computer Studies': [
    'Computer Basics', 'Operating Systems', 'Word Processing',
    'Spreadsheets', 'Internet', 'Programming Concepts',
    'Database', 'Networking', 'Data Security',
  ],
  CRE: [
    'Creation', 'The Bible', 'Jesus Christ', 'The Early Church',
    'Christian Values', 'Faith & Prayer', 'Community Service',
    'Leadership', 'Marriage & Family',
  ],
  IRE: [
    'Quran', 'Hadith', 'Prophets', 'Pillars of Islam',
    'Islamic Values', 'Prayer & Worship', 'Community',
    'Family in Islam', 'Moral Teachings',
  ],
  'Business Studies': [
    'Business & Its Environment', 'Office Practice', 'Entrepreneurship',
    'Money & Banking', 'Trade', 'Consumer Protection',
    'Financial Records', 'Taxation',
  ],
  'Physical Education': [
    'Athletics', 'Ball Games', 'Gymnastics', 'Swimming',
    'Outdoor Activities', 'Fitness & Health',
  ],
  Music: [
    'Rhythm & Melody', 'Musical Instruments', 'Singing',
    'Dance', 'Music Notation', 'Kenyan Folk Music',
    'Music Theory', 'Performance',
  ],
  'Art & Craft': [
    'Drawing & Painting', 'Modeling', 'Weaving', 'Beadwork',
    'Printmaking', 'Patterns & Design', 'Color Theory',
    'Kenyan Traditional Art', 'Paper Craft',
  ],
}

function bgForName(name: string) {
  const colors = ['bg-blue-500', 'bg-emerald-500', 'bg-violet-500', 'bg-rose-500', 'bg-amber-500', 'bg-cyan-500', 'bg-pink-500', 'bg-indigo-500']
  let hash = 0; for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return colors[Math.abs(hash) % colors.length]
}

export default function CreateAssignmentModal({ isOpen, onClose, onSuccess, initialData }: CreateAssignmentModalProps) {
  const { toast } = useToast()
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [preview, setPreview] = useState(false)

  // Data
  const [students, setStudents] = useState<Student[]>([])
  const [classes, setClasses] = useState<Class[]>([])
  const [lessonPlans, setLessonPlans] = useState<LessonPlan[]>([])
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [classFilter, setClassFilter] = useState('all')
  const [studentSearch, setStudentSearch] = useState('')
  const [studentPage, setStudentPage] = useState(1)
  const [studentTotalPages, setStudentTotalPages] = useState(1)
  const [loadingMore, setLoadingMore] = useState(false)
  const PAGE_SIZE = 50

  // Form
  const [form, setForm] = useState({ title: '', description: '', content: '', dueDate: '', dueTime: '23:59', lessonPlanId: '', subject: '', grade: '' })
  const [numQuestions, setNumQuestions] = useState(5)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Exam
  const [isTimed, setIsTimed] = useState(false)
  const [timeLimit, setTimeLimit] = useState(60)
  const [aiGrade, setAiGrade] = useState(false)
  const [questions, setQuestions] = useState<Question[]>([])
  const [showQF, setShowQF] = useState(false)
  const [editQ, setEditQ] = useState<Question | null>(null)
  const [qf, setQf] = useState<Question>({ id: '', type: 'multiple_choice', text: '', marks: 1, options: ['A. ', 'B. ', 'C. ', 'D. '], correctAnswer: '' })
  const [examAnswerKey, setExamAnswerKey] = useState<string>('')
  // Interactive (non-timed) structured assignments — MCQ questions answered via
  // radio buttons by students, graded deterministically against this answer key.
  const [structuredQuestions, setStructuredQuestions] = useState<Question[]>([])
  const [structuredAnswerKey, setStructuredAnswerKey] = useState('')
  const [pdfUploading, setPdfUploading] = useState(false)
  const [pdfUrl, setPdfUrl] = useState<string>('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [topicStrands, setTopicStrands] = useState<{ id: string; name: string }[]>([])
  const [loadingTopics, setLoadingTopics] = useState(false)

  // Video state
  const [videoUrl, setVideoUrl] = useState('')
  const [videoProvider, setVideoProvider] = useState<'youtube' | 'vimeo' | 'upload' | ''>('')
  const [videoDuration, setVideoDuration] = useState(0)
  const [videoUploading, setVideoUploading] = useState(false)
  const [videoName, setVideoName] = useState('')
  const [linkInput, setLinkInput] = useState('')
  const videoDropRef = useRef<HTMLDivElement>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail
      if (typeof detail === 'string') setExamAnswerKey(detail)
    }
    window.addEventListener('setAnswerKey', handler)
    return () => window.removeEventListener('setAnswerKey', handler)
  }, [])

  const uploadVideo = async (file: File) => {
    if (file.size > 500 * 1024 * 1024) { toast({ title: 'Video too large (max 500MB)', variant: 'destructive' }); return }
    setVideoUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const r = await fetch('/api/upload-video', { method: 'POST', body: fd })
      if (r.ok) {
        const data = await r.json()
        setVideoUrl(data.url)
        setVideoProvider('upload')
        setVideoName(data.name || file.name)
        toast({ title: 'Video uploaded successfully' })
      } else {
        const err = await r.json()
        toast({ title: err.error || 'Video upload failed', variant: 'destructive' })
      }
    } catch { toast({ title: 'Video upload failed', variant: 'destructive' }) }
    finally { setVideoUploading(false) }
  }

  const parseVideoLink = (url: string) => {
    const ytMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/)
    if (ytMatch) {
      setVideoUrl(`https://www.youtube.com/embed/${ytMatch[1]}`)
      setVideoProvider('youtube')
      setLinkInput('')
      toast({ title: 'YouTube video linked' })
      return
    }
    const vmMatch = url.match(/vimeo\.com\/(\d+)/)
    if (vmMatch) {
      setVideoUrl(`https://player.vimeo.com/video/${vmMatch[1]}`)
      setVideoProvider('vimeo')
      setLinkInput('')
      toast({ title: 'Vimeo video linked' })
      return
    }
    toast({ title: 'Paste a valid YouTube or Vimeo URL', variant: 'destructive' })
  }

  const clearVideo = () => {
    setVideoUrl('')
    setVideoProvider('')
    setVideoDuration(0)
    setVideoName('')
    setLinkInput('')
  }

  const uploadPdf = async (file: File) => {
    if (file.size > 20 * 1024 * 1024) { toast({ title: 'File too large (max 20MB)', variant: 'destructive' }); return }
    setPdfUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('docType', 'exam')
      const r = await fetch('/api/teacher/upload-document', { method: 'POST', body: fd })
      if (r.ok) {
        const data = await r.json()
        setPdfUrl(data.url)
        const pdfRef = `\n\n> 📄 **Source PDF**: [${data.name}](${data.url})`
        if (data.extractedText) {
          // Try to structure the uploaded exam into editable questions via AI
          let structured = false
          try {
            const sr = await fetch('/api/ai/process-uploaded-exam', {
              method: 'POST', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ rawText: data.extractedText, subject: form.subject, grade: form.grade }),
            })
            if (sr.ok) {
              const sd = await sr.json()
              const secQs = (sd.extracted?.sections || []).flatMap((sec: any) => sec.questions || [])
              if (secQs.length) {
                const modalQuestions = secQs.map((q: any, i: number) => ({
                  id: String(q.number || i + 1),
                  type: q.type === 'true_false' ? 'true_false' : q.type === 'short_answer' ? 'short_answer' : q.type === 'long_answer' ? 'short_answer' : q.type === 'fill_blank' ? 'short_answer' : 'multiple_choice',
                  text: q.text,
                  marks: q.marks || 1,
                  options: q.options,
                  correctAnswer: q.answer || '',
                }))
                const ak: Record<string, string> = {}
                secQs.forEach((q: any, i: number) => {
                  const k = String(q.number || i + 1)
                  if (q.answer) ak[k] = q.answer
                })
                const totalMarks = modalQuestions.reduce((s: number, q: { marks: number }) => s + q.marks, 0)
                setForm(prev => ({ ...prev, content: JSON.stringify({ questions: modalQuestions }) }))
                setIsTimed(true)
                setAiGrade(true)
                setTimeLimit(totalMarks > 60 ? 120 : 60)
                setQuestions(modalQuestions)
                setExamAnswerKey(JSON.stringify(ak))
                toast({ title: `Exam structured: ${modalQuestions.length} questions extracted` })
                structured = true
              }
            }
          } catch (e) { console.warn('[AssignmentModal] AI structuring failed, falling back to text:', e) }
          if (!structured) {
            setForm(prev => ({ ...prev, content: pdfRef + '\n\n--- Extracted from PDF ---\n\n' + data.extractedText }))
            toast({ title: 'PDF uploaded and text extracted' })
          }
        } else {
          setForm(prev => ({ ...prev, content: (prev.content || '') + pdfRef }))
        }
      } else {
        const err = await r.json()
        toast({ title: err.error || 'Upload failed', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Upload failed', variant: 'destructive' })
    } finally { setPdfUploading(false) }
  }

  useEffect(() => {
    if (isOpen) {
      setStep(0)
      if (initialData) {
        setForm(prev => ({
          ...prev,
          title: initialData.title || prev.title,
          description: initialData.description || prev.description,
          content: initialData.content || prev.content,
          subject: initialData.subject || prev.subject,
          grade: initialData.grade || prev.grade,
        }))
        if (initialData.questions?.length) {
          setQuestions(initialData.questions)
          setStructuredQuestions(initialData.questions)
        }
        if (initialData.answerKey) {
          setExamAnswerKey(initialData.answerKey)
          setStructuredAnswerKey(initialData.answerKey)
        }
        if (initialData.isTimed) {
          setIsTimed(true)
          if (initialData.timeLimit) setTimeLimit(initialData.timeLimit)
          setAiGrade(true)
        }
      } else {
        reset()
      }
      fetchStudents(1); fetchClasses(); fetchLessonPlans()
    }
  }, [isOpen])
  useEffect(() => { if (isOpen) { setStudentPage(1); fetchStudents(1) } }, [classFilter, studentSearch])

  const fetchStudents = async (page = 1, append = false) => {
    try {
      if (append) setLoadingMore(true)
      const p = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) })
      if (classFilter !== 'all') p.set('classId', classFilter)
      if (studentSearch) p.set('search', studentSearch)
      const r = await fetch(`/api/teacher/students?${p}`)
      if (r.ok) {
        const d = await r.json()
        const list = Array.isArray(d.data) ? d.data : (d.students || [])
        setStudents(append ? prev => [...prev, ...list] : list)
        if (d.pagination) setStudentTotalPages(d.pagination.totalPages)
      }
    } catch (e) { console.warn('[AssignmentModal] Failed to fetch students:', e) } finally { if (append) setLoadingMore(false) }
  }

  const fetchClasses = async () => { try { const r = await fetch('/api/teacher/classes'); if (r.ok) { const d = await r.json(); setClasses(Array.isArray(d.data) ? d.data : (d.classes || [])) } } catch (e) { console.warn('[AssignmentModal] Failed to fetch classes:', e) } }
  const fetchLessonPlans = async () => { try { const r = await fetch('/api/lesson-plans'); if (r.ok) setLessonPlans((await r.json()).lessonPlans || []) } catch (e) { console.warn('[AssignmentModal] Failed to fetch lesson plans:', e) } }

  const reset = () => {
    setForm({ title: '', description: '', content: '', dueDate: '', dueTime: '23:59', lessonPlanId: '', subject: '', grade: '' })
    setSelectedIds([]); setClassFilter('all'); setStudentSearch(''); setStudentPage(1)
    setIsTimed(false); setTimeLimit(60); setAiGrade(false); setQuestions([]); setShowQF(false); setEditQ(null); setErrors({}); setExamAnswerKey(''); setPdfUrl('')
    setStructuredQuestions([]); setStructuredAnswerKey('')
    setVideoUrl(''); setVideoProvider(''); setVideoDuration(0); setVideoName(''); setLinkInput('')
  }

  const toggle = (id: string) => setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])

  const selLesson = lessonPlans.find(l => l.id === form.lessonPlanId)
  const subj = selLesson?.subject || form.subject
  const grd  = selLesson?.grade || form.grade
  useEffect(() => {
    if (!subj || !grd) { setTopicStrands([]); return }
    setLoadingTopics(true)
    const fallback = TOPIC_SUGGESTIONS[subj] || []
    fetch(`/api/curriculum/strands?grade=${encodeURIComponent(grd)}&subject=${encodeURIComponent(subj)}`)
      .then(r => r.ok ? r.json() : { strands: [] })
      .then(d => {
        const db = (d.strands || []).map((s: any) => ({ id: s.id, name: s.name }))
        const all = [...db]
        fallback.forEach(t => { if (!all.some(a => a.name.toLowerCase() === t.toLowerCase())) all.push({ id: `fb-${t}`, name: t }) })
        setTopicStrands(all)
      })
      .catch(() => setTopicStrands(fallback.map(t => ({ id: `fb-${t}`, name: t }))))
      .finally(() => setLoadingTopics(false))
  }, [subj, grd])
  const availableStudents = classFilter === 'all' ? students : students.filter(s => s.classId === classFilter)

  const handleSubmit = async () => {
    setLoading(true)
    // Exams are broadcast to a whole class (or all teacher's students), never individuals.
    // Assignments/quizzes may target individual students.
    const isExam = !!isTimed
    const finalStudentIds = !isExam && selectedIds.length > 0 ? selectedIds
      : !isExam && availableStudents.length > 0 ? availableStudents.map(s => s.id)
      : []
    if (!isExam && finalStudentIds.length > 0 && selectedIds.length === 0) {
      setSelectedIds(finalStudentIds)
    }
    // Validate
    const errs: Record<string, string> = {}
    if (!form.title.trim()) errs.title = 'Title is required'
    if (!isTimed && !form.content.trim() && !aiGrade) errs.content = 'Content is required'
    if (isTimed && questions.length === 0) errs.content = 'At least one question required'
    const desc = form.description.trim() || form.title
    if (!form.dueDate) errs.dueDate = 'Due date is required'
    else if (new Date(`${form.dueDate}T${form.dueTime}`) <= new Date()) errs.dueDate = 'Must be a future date'
    if (!form.lessonPlanId && (!form.subject.trim() || !form.grade.trim())) errs.subject = 'Subject & grade required'
    if (isExam) {
      // Exams: always a valid audience (all students is the default fallback)
      if (classFilter === 'all') {
        // send neither classId nor studentIds → server assigns to all teacher's students
      }
    } else if (finalStudentIds.length === 0) {
      errs.students = 'Select at least one student'
    }
    setErrors(errs)
    if (Object.keys(errs).length > 0) {
      toast({ title: Object.values(errs).find(Boolean) as string, variant: 'destructive' })
      if (errs.students) setStep(3)
      setLoading(false); return
    }
    try {
      // Interactive (non-timed) assignment: content embeds the structured
      // questions (without answer keys — the server holds them) + the markdown.
      const structuredAssignment = !isTimed && structuredQuestions.length > 0
      const body: any = {
        title: form.title, description: desc,
        content: isTimed
          ? JSON.stringify({ questions })
          : structuredAssignment
            ? JSON.stringify({
                questions: structuredQuestions.map(({ id, type, text, options, marks }) => ({ id, type, text, options, marks })),
                markdown: form.content,
              })
            : form.content,
        subject: selLesson?.subject || form.subject, grade: selLesson?.grade || form.grade,
        dueDate: new Date(`${form.dueDate}T${form.dueTime}`).toISOString(),
        lessonPlanId: form.lessonPlanId || null,
        // Exams: classId when a class is chosen, otherwise no audience fields (→ all students).
        // Assignments/quizzes: classId (if filtered) + explicit studentIds.
        ...(isExam
          ? { classId: classFilter !== 'all' ? classFilter : null }
          : { classId: classFilter !== 'all' ? classFilter : null, studentIds: finalStudentIds }),
        isTimed: isTimed || undefined, timeLimit: isTimed ? timeLimit : undefined, aiGradeable: true,
        videoUrl: videoUrl || undefined, videoProvider: videoProvider || undefined, videoDuration: videoDuration || undefined,
      }
      if (isTimed) {
        if (examAnswerKey) {
          body.answerKey = examAnswerKey
        } else {
          const ak: Record<string, string> = {}; questions.forEach(q => { ak[String(q.id)] = q.correctAnswer })
          body.answerKey = JSON.stringify(ak)
        }
      } else if (structuredAssignment) {
        body.answerKey = structuredAnswerKey
      }
      const r = await fetch('/api/assignments', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      if (r.ok) { onSuccess(); handleClose() }
      else toast({ title: 'Failed to create', variant: 'destructive' })
    } catch (e) { console.warn('[AssignmentModal] Failed to create assignment:', e) } finally { setLoading(false) }
  }

  const handleClose = () => { reset(); onClose() }

  const genAI = async (type = 'assignment') => {
    if (!form.title.trim() || (!form.lessonPlanId && (!form.subject.trim() || !form.grade.trim()))) {
      toast({ title: 'Fill in title and subject/grade first' }); return
    }
    // Auto-fill description from title if empty
    if (!form.description.trim()) {
      setForm(prev => ({ ...prev, description: prev.title }))
    }
    setIsGenerating(true)
    try {
      const recentTopics = lessonPlans
        .filter(lp => lp.subject === (selLesson?.subject || form.subject) && lp.grade === (selLesson?.grade || form.grade))
        .slice(0, 5)
        .map(lp => lp.title)
      const r = await fetch('/api/ai/generate-content', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type, title: form.title, description: form.description || form.title,
          subject: selLesson?.subject || form.subject, grade: selLesson?.grade || form.grade,
          topic: form.title, lessonPlanId: form.lessonPlanId, duration: 60, difficulty: 'intermediate',
          requirements: form.description || form.title, recentTopics,
          numQuestions,
        }),
      })
      if (r.ok) {
        const data = await r.json()

        // Handle structured response from smart assessment (new format)
        if (data.structured) {
          const { questions: structQs, answerKey, totalMarks } = data.structured
          if (structQs?.length) {
            const modalQuestions = structQs.map((q: any, i: number) => ({
              id: String(q.id || i + 1),
              type: q.type === 'true_false' ? 'true_false' : (q.type === 'short_answer' || q.type === 'essay') ? 'short_answer' : 'multiple_choice',
              text: q.text,
              marks: q.marks || 1,
              options: q.options,
              correctAnswer: answerKey?.[String(q.id || i + 1)] || q.correctAnswer || '',
            }))
            if (type === 'exam') {
              setForm(prev => ({ ...prev, content: data.content }))
              setIsTimed(true)
              setTimeLimit(totalMarks > 60 ? 120 : 60)
              setQuestions(modalQuestions)
              setExamAnswerKey(JSON.stringify(answerKey || {}))
              return
            }
            // Assignment type — keep the markdown in the editor for preview, but
            // stash the structured questions + answer key so students get an
            // interactive question-by-question answer sheet with radio buttons.
            setForm(prev => ({ ...prev, content: data.content }))
            setStructuredQuestions(modalQuestions)
            setStructuredAnswerKey(JSON.stringify(answerKey || {}))
            setQuestions(modalQuestions)
            setExamAnswerKey(JSON.stringify(answerKey || {}))
            return
          }
          // Assignment type — no structured questions, just set content
          setForm(prev => ({ ...prev, content: data.content }))
          return
        }

        // Legacy: try parsing content as JSON
        if (type === 'exam') {
          try {
            const parsed = JSON.parse(data.content)
            if (parsed.questions && parsed.answerKey) {
              setForm(prev => ({ ...prev, content: JSON.stringify({ questions: parsed.questions }) }))
              setIsTimed(true)
              setTimeLimit(parsed.totalMarks > 60 ? 120 : 60)
              setQuestions(parsed.questions)
              const keyStr = JSON.stringify(parsed.answerKey)
              setExamAnswerKey(keyStr)
              return
            }
          } catch (e) { console.warn('[AssignmentModal] Failed to parse AI exam content:', e) }
        }
        setForm(prev => ({ ...prev, content: data.content }))
      }
      else toast({ title: 'AI generation failed', variant: 'destructive' })
    } catch (e) { console.warn('[AssignmentModal] AI generation failed:', e) } finally { setIsGenerating(false) }
  }

  const addQuestion = () => {
    if (!qf.text.trim()) return
    if (editQ) setQuestions(prev => prev.map(q => q.id === editQ.id ? { ...qf, id: q.id } : q))
    else setQuestions(prev => [...prev, { ...qf, id: `q_${Date.now()}` }])
    setShowQF(false); setEditQ(null)
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[95vh] overflow-hidden bg-white border-0 shadow-2xl p-0 gap-0">
        {/* Header */}
        <div className="px-6 pt-6 pb-0">
          <DialogHeader className="pb-4 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-xl font-bold text-gray-900 flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center shadow-sm">
                  <Plus className="w-5 h-5 text-white" />
                </div>
                Create Assignment
              </DialogTitle>
            </div>
          </DialogHeader>

          {/* Steps */}
          <div className="flex items-center gap-1 py-4">
            {STEPS.map((s, i) => (
              <div key={s} className="flex items-center gap-1 flex-1">
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  i === step ? 'bg-gray-900 text-white shadow-sm' :
                  i < step ? 'bg-emerald-50 text-emerald-700' :
                  'bg-gray-50 text-gray-400'
                }`}>
                  {i < step ? <Check className="w-3 h-3" /> : <span className="w-1 h-1" />}
                  {s}
                </div>
                {i < STEPS.length - 1 && <div className={`h-px flex-1 ${i < step ? 'bg-emerald-300' : 'bg-gray-200'}`} />}
              </div>
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="px-6 pb-6 overflow-y-auto max-h-[65vh]">
          {/* ── STEP 0: DETAILS ── */}
          {step === 0 && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-gray-700">Title <span className="text-red-400">*</span></Label>
                  <div className="relative">
                    <Input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                      placeholder={loadingTopics ? 'Loading topics…' : topicStrands.length > 0 ? 'Type or pick a topic…' : 'e.g. Solving Linear Equations'}
                      list="assign-topics"
                      className={`h-9 text-sm ${topicStrands.length > 0 ? 'pr-20' : ''}`} />
                    {(subj && grd) && (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-gray-400 font-medium flex items-center gap-1">
                        {loadingTopics ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3 text-blue-400" />}
                      </span>
                    )}
                  </div>
                  <datalist id="assign-topics">
                    {topicStrands.map(s => <option key={s.id} value={s.name} />)}
                  </datalist>
                  {errors.title && <p className="text-xs text-red-500 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.title}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-gray-700">Due Date <span className="text-red-400">*</span></Label>
                  <div className="flex gap-2">
                    <Input type="date" value={form.dueDate} onChange={e => setForm(p => ({ ...p, dueDate: e.target.value }))} className="h-9 text-sm flex-1" />
                    <Input type="time" value={form.dueTime} onChange={e => setForm(p => ({ ...p, dueTime: e.target.value }))} className="h-9 text-sm w-28" />
                  </div>
                  {errors.dueDate && <p className="text-xs text-red-500 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.dueDate}</p>}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-gray-700">Description <span className="text-gray-400 font-normal">(optional — auto-filled from title)</span></Label>
                <Textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                  placeholder="Brief overview of the assignment..." rows={2} className="text-sm resize-none" />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-gray-700">Link Lesson Plan <span className="text-gray-400 font-normal">(optional)</span></Label>
                <Select value={form.lessonPlanId} onValueChange={v => setForm(p => ({ ...p, lessonPlanId: v }))}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="None — I'll type subject/grade" /></SelectTrigger>
                  <SelectContent>
                    {lessonPlans.map(lp => (
                      <SelectItem key={lp.id} value={lp.id} className="text-sm">{lp.title} &middot; {lp.subject} ({lp.grade})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selLesson && (
                  <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-lg border border-blue-100">
                    <BookOpen className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <p className="text-xs text-blue-700"><span className="font-medium">{selLesson.title}</span> &mdash; {selLesson.subject} ({selLesson.grade})</p>
                  </div>
                )}
              </div>

              {!form.lessonPlanId && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-gray-700">Subject <span className="text-red-400">*</span></Label>
                    <Select value={form.subject} onValueChange={v => setForm(p => ({ ...p, subject: v }))}>
                      <SelectTrigger className="h-9 text-sm">
                        <SelectValue placeholder="Select subject…" />
                      </SelectTrigger>
                      <SelectContent>
                        {SUBJECTS.map(s => <SelectItem key={s} value={s} className="text-sm">{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    {errors.subject && <p className="text-xs text-red-500 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.subject}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-gray-700">Grade <span className="text-red-400">*</span></Label>
                    <Select value={form.grade} onValueChange={v => setForm(p => ({ ...p, grade: v }))}>
                      <SelectTrigger className="h-9 text-sm">
                        <SelectValue placeholder="Select grade…" />
                      </SelectTrigger>
                      <SelectContent>
                        {GRADES.map(g => <SelectItem key={g} value={g} className="text-sm">{g}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {/* Number of Questions */}
              <div className="flex items-center gap-4 pt-2">
                <Label className="text-xs font-semibold text-gray-700 shrink-0">Number of Questions</Label>
                <Input type="number" value={numQuestions} onChange={e => setNumQuestions(Math.max(1, Math.min(20, +e.target.value || 5)))}
                  className="h-8 w-20 text-sm text-center" min={1} max={20} />
                <span className="text-[11px] text-gray-400">(1–20)</span>
              </div>

              {/* Exam Settings */}
              <div className="flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input type="checkbox" checked={isTimed} onChange={e => setIsTimed(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-violet-600 focus:ring-violet-500" />
                  <span className="text-sm font-medium text-gray-700">Timed exam</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input type="checkbox" checked={aiGrade} onChange={e => setAiGrade(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-violet-600 focus:ring-violet-500" />
                  <span className="text-sm font-medium text-gray-700">AI auto-grade</span>
                </label>
                {isTimed && (
                  <div className="flex items-center gap-2">
                    <Timer className="w-4 h-4 text-gray-400" />
                    <Input type="number" value={timeLimit} onChange={e => setTimeLimit(Math.max(1, +e.target.value || 60))}
                      className="h-8 w-20 text-sm text-center" min={1} />
                    <span className="text-sm text-gray-500">minutes</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── STEP 1: MEDIA ── */}
          {step === 1 && (
            <div className="space-y-5">
              <div className="flex items-center gap-2">
                <Video className="w-5 h-5 text-violet-500" />
                <Label className="text-sm font-semibold text-gray-700">Add Video to Assignment <span className="text-gray-400 font-normal">(optional)</span></Label>
              </div>

              {videoUrl ? (
                /* Video preview */
                <div className="space-y-3">
                  <div className="bg-gray-900 rounded-xl overflow-hidden shadow-lg">
                    {videoProvider === 'youtube' || videoProvider === 'vimeo' ? (
                      <iframe src={videoUrl} className="w-full aspect-video" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
                    ) : (
                      <video src={videoUrl} controls className="w-full aspect-video" preload="metadata" />
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Play className="w-4 h-4 text-green-500" />
                      <span className="font-medium">
                        {videoProvider === 'youtube' ? 'YouTube' : videoProvider === 'vimeo' ? 'Vimeo' : videoName || 'Uploaded Video'}
                      </span>
                    </div>
                    <Button type="button" variant="outline" size="sm" onClick={clearVideo} className="h-8 text-xs text-red-500 hover:text-red-600">
                      <X className="w-3.5 h-3.5 mr-1" /> Remove
                    </Button>
                  </div>
                </div>
              ) : (
                /* Upload & link options */
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Upload video */}
                  <div
                    ref={videoDropRef}
                    className={`relative p-6 rounded-xl border-2 border-dashed transition-colors cursor-pointer text-center
                      ${videoUploading ? 'border-violet-300 bg-violet-50' : 'border-gray-300 hover:border-violet-400 hover:bg-gray-50'}`}
                    onClick={() => !videoUploading && videoInputRef.current?.click()}
                    onDragOver={e => { e.preventDefault(); if (videoDropRef.current) videoDropRef.current.classList.add('border-violet-400', 'bg-violet-50') }}
                    onDragLeave={() => { if (videoDropRef.current) videoDropRef.current.classList.remove('border-violet-400', 'bg-violet-50') }}
                    onDrop={e => {
                      e.preventDefault()
                      if (videoDropRef.current) videoDropRef.current.classList.remove('border-violet-400', 'bg-violet-50')
                      const f = e.dataTransfer.files?.[0]
                      if (f) uploadVideo(f)
                    }}
                  >
                    <input ref={videoInputRef} type="file" accept="video/mp4,video/webm,video/ogg,video/quicktime,video/x-msvideo" className="hidden"
                      onChange={e => { const f = e.target.files?.[0]; if (f) uploadVideo(f) }} />
                    {videoUploading ? (
                      <div className="space-y-2">
                        <Loader2 className="w-8 h-8 mx-auto animate-spin text-violet-500" />
                        <p className="text-sm font-medium text-violet-700">Uploading video...</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="w-12 h-12 rounded-full bg-violet-100 flex items-center justify-center mx-auto">
                          <Upload className="w-6 h-6 text-violet-600" />
                        </div>
                        <p className="text-sm font-medium text-gray-700">Upload Video File</p>
                        <p className="text-xs text-gray-400">Drag & drop or click to browse</p>
                        <p className="text-[10px] text-gray-300">MP4, WebM, MOV, AVI &bull; Max 500MB</p>
                      </div>
                    )}
                  </div>

                  {/* YouTube / Vimeo link */}
                  <div className="p-6 rounded-xl border border-gray-200 bg-gray-50 flex flex-col justify-center space-y-3">
                    <div className="space-y-2">
                      <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto">
                        <Link className="w-6 h-6 text-red-500" />
                      </div>
                      <p className="text-sm font-medium text-gray-700 text-center">YouTube / Vimeo Link</p>
                    </div>
                    <div className="flex gap-2">
                      <Input value={linkInput} onChange={e => setLinkInput(e.target.value)}
                        placeholder="https://youtube.com/watch?v=..." 
                        className="h-9 text-sm flex-1" 
                        onKeyDown={e => { if (e.key === 'Enter' && linkInput.trim()) parseVideoLink(linkInput) }} />
                      <Button type="button" size="sm" onClick={() => linkInput.trim() && parseVideoLink(linkInput)}
                        disabled={!linkInput.trim()} className="h-9 text-xs gap-1.5 bg-red-500 hover:bg-red-600 text-white">
                        <Play className="w-3.5 h-3.5" /> Link
                      </Button>
                    </div>
                    <p className="text-[10px] text-gray-400 text-center">
                      Paste a YouTube or Vimeo video URL
                    </p>
                  </div>
                </div>
              )}
              <div className="flex items-start gap-2 px-3 py-2 bg-blue-50 rounded-lg border border-blue-100">
                <Video className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                <p className="text-xs text-blue-700">Add a video lecture, demonstration, or explanation. Students will watch it before answering the assignment questions.</p>
              </div>
            </div>
          )}

          {/* ── STEP 2: CONTENT ── */}
          {step === 2 && (
            <div className="space-y-5">
              {/* Toolbar */}
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold text-gray-700">
                  {isTimed ? 'Exam Questions' : 'Assignment Content'}
                </Label>
                <div className="flex gap-2">
                  <AnswerGuide type={isTimed ? 'exam' : 'assignment'} hasVideo={!!videoUrl} />
                  {!isTimed && form.content && (
                    <Button type="button" variant="outline" size="sm" onClick={() => setPreview(!preview)}
                      className="h-8 text-xs gap-1.5">
                      {preview ? <Edit3 className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      {preview ? 'Edit' : 'Preview'}
                    </Button>
                  )}
                  <Button type="button" size="sm" onClick={() => genAI(isTimed ? 'exam' : 'assignment')} disabled={isGenerating || !form.title.trim() || (!form.lessonPlanId && (!form.subject.trim() || !form.grade.trim()))}
                    className="h-8 text-xs gap-1.5 bg-gradient-to-r from-violet-500 to-blue-500 text-white hover:from-violet-600 hover:to-blue-600 shadow-sm">
                    {isGenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Brain className="w-3.5 h-3.5" />}
                    {isGenerating ? 'Generating...' : 'Generate with AI'}
                  </Button>
                </div>
              </div>

              {/* PDF upload */}
              <div className="p-3 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                <div className="flex items-center gap-3">
                  <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx" className="hidden"
                    onChange={e => { const f = e.target.files?.[0]; if (f) uploadPdf(f) }} />
                  <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}
                    disabled={pdfUploading} className="h-8 text-xs gap-1.5">
                    {pdfUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileText className="w-3.5 h-3.5" />}
                    {pdfUploading ? 'Uploading...' : 'Upload PDF'}
                  </Button>
                  <span className="text-xs text-gray-400">PDF, DOC, DOCX (max 20MB)</span>
                  {pdfUrl && (
                    <a href={pdfUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline ml-auto">
                      View uploaded file
                    </a>
                  )}
                </div>
              </div>

              {/* Timed Exam Question Builder */}
              {isTimed ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">{questions.length} question{questions.length !== 1 && 's'}</span>
                    <Button type="button" size="sm" variant="outline" onClick={() => { setEditQ(null); setQf({ id: '', type: 'multiple_choice', text: '', marks: 1, options: ['A. ', 'B. ', 'C. ', 'D. '], correctAnswer: '' }); setShowQF(true) }}
                      className="h-8 text-xs gap-1.5">
                      <Plus className="w-3.5 h-3.5" /> Add Question
                    </Button>
                  </div>

                  {/* Question List */}
                  <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                    {questions.map((q, idx) => (
                      <div key={q.id} className="group flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100 hover:border-gray-200 transition-colors">
                        <div className="w-7 h-7 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center text-xs font-bold shrink-0">
                          {idx + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">{q.text}</p>
                          <p className="text-xs text-gray-400">
                            {q.type.replace(/_/g, ' ')} &middot; {q.marks} mark{q.marks > 1 && 's'} &middot; <span className="text-emerald-600">Answer: {q.correctAnswer}</span>
                          </p>
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button type="button" onClick={() => { setEditQ(q); setQf(q); setShowQF(true) }}
                            className="p-1.5 rounded-md hover:bg-gray-200 text-gray-400 hover:text-gray-700 transition-colors">
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button type="button" onClick={() => setQuestions(prev => prev.filter(x => x.id !== q.id))}
                            className="p-1.5 rounded-md hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                    {questions.length === 0 && (
                      <div className="text-center py-10 text-gray-400">
                        <FileText className="w-8 h-8 mx-auto mb-2 opacity-40" />
                        <p className="text-sm">No questions yet</p>
                        <p className="text-xs">Click "Add Question" to build the exam</p>
                      </div>
                    )}
                  </div>

                  {/* Question Form */}
                  {showQF && (
                    <div className="p-4 bg-white rounded-xl border border-gray-200 shadow-sm space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-semibold text-gray-800">{editQ ? 'Edit' : 'New'} Question</h4>
                        <button type="button" onClick={() => setShowQF(false)} className="p-1 rounded-md hover:bg-gray-100">
                          <X className="w-4 h-4 text-gray-400" />
                        </button>
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        <div className="col-span-2 space-y-1">
                          <Label className="text-xs text-gray-500">Type</Label>
                          <Select value={qf.type} onValueChange={v => setQf(prev => ({ ...prev, type: v as Question['type'], correctAnswer: '' }))}>
                            <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="multiple_choice" className="text-sm">Multiple Choice</SelectItem>
                              <SelectItem value="true_false" className="text-sm">True / False</SelectItem>
                              <SelectItem value="short_answer" className="text-sm">Short Answer</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs text-gray-500">Marks</Label>
                          <Input type="number" value={qf.marks} onChange={e => setQf(prev => ({ ...prev, marks: Math.max(1, +e.target.value || 1) }))}
                            min={1} className="h-8 text-sm text-center" />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-gray-500">Question</Label>
                        <Textarea value={qf.text} onChange={e => setQf(prev => ({ ...prev, text: e.target.value }))}
                          placeholder="Enter your question..." rows={2} className="text-sm resize-none" />
                      </div>

                      {qf.type === 'multiple_choice' && (
                        <div className="space-y-1.5">
                          <Label className="text-xs text-gray-500">Options</Label>
                          {qf.options?.map((opt, idx) => (
                            <div key={idx} className="flex items-center gap-2">
                              <input type="radio" name={`mc_${qf.id || 'new'}`} checked={qf.correctAnswer === opt.charAt(0)}
                                onChange={() => setQf(prev => ({ ...prev, correctAnswer: opt.charAt(0) }))}
                                className="w-3.5 h-3.5 text-violet-600" />
                              <Input value={opt} onChange={e => { const o = [...(qf.options || [])]; o[idx] = e.target.value; setQf(prev => ({ ...prev, options: o })) }}
                                className="h-8 text-sm flex-1" placeholder={`Option ${String.fromCharCode(65 + idx)}`} />
                              {(qf.options?.length || 0) > 2 && (
                                <button type="button" onClick={() => setQf(prev => ({ ...prev, options: prev.options?.filter((_, i) => i !== idx) }))}
                                  className="p-1 rounded hover:bg-gray-100 text-gray-400">
                                  <X className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          ))}
                          <button type="button" onClick={() => { const l = String.fromCharCode(65 + (qf.options?.length || 0)); setQf(prev => ({ ...prev, options: [...(prev.options || []), `${l}. `] })) }}
                            className="text-xs text-violet-600 hover:text-violet-700 font-medium flex items-center gap-1">
                            <Plus className="w-3 h-3" /> Add Option
                          </button>
                        </div>
                      )}

                      {qf.type === 'true_false' && (
                        <div>
                          <Label className="text-xs text-gray-500">Correct Answer</Label>
                          <div className="flex gap-4 mt-1">
                            {['T', 'F'].map(v => (
                              <label key={v} className="flex items-center gap-2 cursor-pointer">
                                <input type="radio" name={`tf_${qf.id || 'new'}`} checked={qf.correctAnswer === v}
                                  onChange={() => setQf(prev => ({ ...prev, correctAnswer: v }))}
                                  className="w-3.5 h-3.5 text-violet-600" />
                                <span className="text-sm">{v === 'T' ? 'True' : 'False'}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      )}

                      {qf.type === 'short_answer' && (
                        <div className="space-y-1">
                          <Label className="text-xs text-gray-500">Correct Answer</Label>
                          <Input value={qf.correctAnswer} onChange={e => setQf(prev => ({ ...prev, correctAnswer: e.target.value }))}
                            placeholder="The correct answer" className="h-8 text-sm" />
                          <p className="text-xs text-gray-400">Matching is case-insensitive</p>
                        </div>
                      )}

                      <div className="flex justify-end gap-2 pt-1">
                        <Button type="button" variant="outline" size="sm" onClick={() => setShowQF(false)} className="h-8 text-xs">Cancel</Button>
                        <Button type="button" size="sm" onClick={addQuestion}
                          className="h-8 text-xs bg-violet-600 hover:bg-violet-700 text-white">{editQ ? 'Update' : 'Add'} Question</Button>
                      </div>
                    </div>
                  )}

                  {errors.content && <p className="text-xs text-red-500 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.content}</p>}
                </div>
              ) : (
                /* Content Editor */
                <div className="space-y-1.5">
                  {preview && form.content ? (
                    <div className="bg-white rounded-xl border border-gray-200 p-5 min-h-[200px]">
                      <div className="mb-3 pb-2 border-b border-gray-100">
                        <h3 className="text-sm font-semibold text-gray-800">Preview</h3>
                      </div>
                      <div className="prose prose-sm max-w-none">
                        <MarkdownRenderer content={form.content} />
                      </div>
                    </div>
                  ) : (
                    <Textarea value={form.content} onChange={e => setForm(p => ({ ...p, content: e.target.value }))}
                      placeholder="Write the assignment content here...&#10;&#10;💡 Tip: You can use Markdown for formatting, or click 'Generate with AI' above." 
                      rows={10} className="text-sm font-mono resize-none" />
                  )}
                  {errors.content && <p className="text-xs text-red-500 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.content}</p>}
                </div>
              )}
            </div>
          )}

          {/* ── STEP 3: STUDENTS ── */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex-1 space-y-1">
                  <Label className="text-xs font-semibold text-gray-700">
                    {isTimed ? 'Send exam to' : 'Class'}
                  </Label>
                  <Select value={classFilter} onValueChange={v => { setClassFilter(v); if (!isTimed) setSelectedIds([]) }}>
                    <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="All Classes" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all" className="text-sm">
                        {isTimed ? 'All students' : `All Classes (${students.length} students)`}
                      </SelectItem>
                      {classes.map(c => (
                        <SelectItem key={c.id} value={c.id} className="text-sm">{c.name} &middot; {c.subject} ({c.grade})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {!isTimed && (
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold text-gray-700">Search</Label>
                    <div className="relative">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                      <Input value={studentSearch} onChange={e => setStudentSearch(e.target.value)}
                        placeholder="Search students..." className="h-9 text-sm pl-8 w-56" />
                    </div>
                  </div>
                )}
              </div>

              {isTimed ? (
                /* Exams: broadcast to a class or all students — no individual selection */
                <div className="flex items-start gap-3 px-4 py-3 bg-blue-50 rounded-xl border border-blue-200">
                  <GraduationCap className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                  <p className="text-sm text-blue-800">
                    {classFilter === 'all'
                      ? <>This exam will be sent to <strong>all your students</strong>.</>
                      : <>This exam will be sent to the whole <strong>{classes.find(c => c.id === classFilter)?.name}</strong> class.</>}
                  </p>
                </div>
              ) : (
                <>
              {/* Actions Bar */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">
                  {selectedIds.length > 0
                    ? <span className="text-emerald-700 font-medium">{selectedIds.length}</span>
                    : '0'} selected
                  {selectedIds.length > 0 && (
                    <button type="button" onClick={() => setSelectedIds([])}
                      className="ml-2 text-xs text-gray-400 hover:text-red-500 underline transition-colors">Clear</button>
                  )}
                </span>
                <div className="flex gap-2">
                  <Button type="button" size="sm" variant="outline" onClick={() => setSelectedIds(availableStudents.map(s => s.id))}
                    className="h-8 text-xs">Select All</Button>
                  <Button type="button" size="sm" variant="outline" onClick={() => setSelectedIds([])}
                    className="h-8 text-xs">Deselect</Button>
                </div>
              </div>

              {/* Student List */}
              <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
                {classFilter !== 'all' && classes.find(c => c.id === classFilter) && (
                  <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-gray-400" />
                    <span className="text-sm font-medium text-gray-700">{classes.find(c => c.id === classFilter)?.name}</span>
                    <span className="text-xs text-gray-400">{availableStudents.length} student{availableStudents.length !== 1 && 's'}</span>
                  </div>
                )}
                <div className="max-h-56 overflow-y-auto divide-y divide-gray-50">
                  {availableStudents.map(student => {
                    const sel = selectedIds.includes(student.id)
                    return (
                      <div key={student.id}
                        className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors hover:bg-gray-50 ${
                          sel ? 'bg-violet-50/50' : ''
                        }`}
                        onClick={() => toggle(student.id)}>
                        <Checkbox checked={sel} onCheckedChange={() => toggle(student.id)}
                          className="data-[state=checked]:bg-violet-600 data-[state=checked]:border-violet-600" />
                        <div className={`w-8 h-8 rounded-full ${bgForName(student.name)} flex items-center justify-center text-white text-xs font-semibold shrink-0 shadow-sm`}>
                          {initials(student.name)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">{student.name}</p>
                          <p className="text-xs text-gray-400 truncate flex items-center gap-1">
                            <Mail className="w-3 h-3" />{student.email}
                          </p>
                        </div>
                        {sel && <Check className="w-4 h-4 text-violet-600 shrink-0" />}
                      </div>
                    )
                  })}
                  {availableStudents.length === 0 && (
                    <div className="py-10 text-center text-gray-400">
                      <Users className="w-8 h-8 mx-auto mb-2 opacity-40" />
                      <p className="text-sm">No students found</p>
                    </div>
                  )}
                </div>
                {classFilter === 'all' && studentPage < studentTotalPages && (
                  <div className="p-2 border-t border-gray-100">
                    <Button type="button" variant="ghost" size="sm" onClick={() => { setStudentPage(p => p + 1); fetchStudents(studentPage + 1, true) }}
                      disabled={loadingMore} className="w-full text-xs text-violet-600 hover:text-violet-700">
                      {loadingMore ? 'Loading...' : `Load More (page ${studentPage}/${studentTotalPages})`}
                    </Button>
                  </div>
                )}
              </div>
              {errors.students && <p className="text-xs text-red-500 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.students}</p>}

              {/* Summary */}
              {selectedIds.length > 0 && (
                <div className="flex items-center gap-2 px-4 py-3 bg-emerald-50 rounded-xl border border-emerald-200">
                  <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                  <p className="text-sm text-emerald-800">
                    Assignment will be assigned to <strong>{selectedIds.length} student{selectedIds.length !== 1 && 's'}</strong>
                  </p>
                </div>
              )}
                </>
              )}
            </div>
          )}

          {/* ── STEP 4: REVIEW ── */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-xl p-5 space-y-4">
                <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-gray-500" /> Assignment Summary
                </h3>
                <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                  <div><span className="text-gray-500">Title</span><p className="font-medium text-gray-800">{form.title}</p></div>
                  <div><span className="text-gray-500">Due</span><p className="font-medium text-gray-800">{form.dueDate} at {form.dueTime}</p></div>
                  {selLesson && <div><span className="text-gray-500">Lesson Plan</span><p className="font-medium text-gray-800">{selLesson.title}</p></div>}
                  <div><span className="text-gray-500">Subject</span><p className="font-medium text-gray-800">{selLesson?.subject || form.subject}</p></div>
                  <div><span className="text-gray-500">Grade</span><p className="font-medium text-gray-800">{selLesson?.grade || form.grade}</p></div>
                  {isTimed && <div><span className="text-gray-500">Time Limit</span><p className="font-medium text-gray-800">{timeLimit} min</p></div>}
                  {aiGrade && <div><span className="text-gray-500">AI Grading</span><p className="font-medium text-emerald-700">Enabled</p></div>}
                  <div><span className="text-gray-500">Students</span><p className="font-medium text-gray-800">{selectedIds.length} selected</p></div>
                  {isTimed && <div><span className="text-gray-500">Questions</span><p className="font-medium text-gray-800">{questions.length}</p></div>}
                  {videoUrl && <div className="col-span-2"><span className="text-gray-500">Video</span><p className="font-medium text-gray-800 flex items-center gap-1"><Play className="w-3 h-3 text-green-500" />{videoProvider === 'youtube' ? 'YouTube' : videoProvider === 'vimeo' ? 'Vimeo' : videoName || 'Uploaded Video'}</p></div>}
                </div>
              </div>

              {!isTimed && form.content && (
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                  <h3 className="text-sm font-semibold text-gray-800 mb-2">Content Preview</h3>
                  <div className="prose prose-sm max-w-none max-h-48 overflow-y-auto">
                    <MarkdownRenderer content={form.content.slice(0, 1000)} />
                  </div>
                  {form.content.length > 1000 && <p className="text-xs text-gray-400 mt-2">...truncated ({form.content.length} chars)</p>}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-gray-50/50">
          <div className="text-xs text-gray-400">
            {step === 0 && 'Basic details about the assignment'}
            {step === 1 && 'Add a video lecture or tutorial (optional)'}
            {step === 2 && isTimed ? 'Build your exam questions' : 'Write or generate assignment content'}
            {step === 3 && 'Choose which students receive this assignment'}
            {step === 4 && 'Review everything before publishing'}
          </div>
          <div className="flex gap-2">
            {step > 0 ? (
              <Button type="button" variant="outline" size="sm" onClick={() => setStep(s => s - 1)}
                className="h-9 gap-1.5 text-sm">
                <ChevronLeft className="w-4 h-4" /> Back
              </Button>
            ) : (
              <Button type="button" variant="outline" size="sm" onClick={handleClose} className="h-9 text-sm">
                Cancel
              </Button>
            )}
            {step < STEPS.length - 1 ? (
              <Button type="button" size="sm" onClick={() => {
                if (step === 0 && (!form.title.trim() || !form.dueDate)) { toast({ title: 'Fill in required fields' }); return }
                setStep(s => s + 1)
              }} className="h-9 gap-1.5 text-sm bg-gray-900 hover:bg-gray-800 text-white shadow-sm">
                Next <ChevronRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button type="button" size="sm" onClick={handleSubmit} disabled={loading}
                className="h-9 gap-1.5 text-sm bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-700 hover:to-blue-700 text-white shadow-sm">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                {loading ? 'Creating...' : 'Create Assignment'}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
