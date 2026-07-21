'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/hooks/use-toast'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { COUNTRIES, getCurriculaByCountry, getSubjectsForCurriculum, getGradesForCurriculum } from '@/lib/curricula'
import DocumentUploadButton from '@/components/teacher/document-upload-button'
import {
  BookOpen, Loader2, Save, Download, Share2, Plus, Trash2,
  FileText, Calendar, Clock, Target, BookCheck, Lightbulb,
  Home, RefreshCw, GraduationCap, Users, Layers, ChevronDown, ChevronUp
} from 'lucide-react'

type Mode = 'single' | 'term'

interface LessonPlanData {
  title?: string
  duration?: number
  strand?: string
  subStrand?: string
  specificLearningOutcomes?: string
  keyInquiryQuestions?: string[]
  introduction?: { duration?: number; activity?: string; teacherActions?: string; studentActions?: string }
  mainActivity?: { duration?: number; activity?: string; teacherActions?: string; studentActions?: string; coreCompetencies?: string[] }
  practiceActivity?: { duration?: number; activity?: string }
  conclusion?: { duration?: number; activity?: string; assessment?: string }
  learningResources?: string[]
  assessment?: string
  differentiation?: { support?: string; extension?: string }
  homework?: string
  teacherReflection?: string
}

interface TermWeekLesson {
  lessonNumber: number
  topic: string
  duration: number
  specificLearningOutcomes?: string
  keyInquiryQuestions?: string[]
  introduction?: any
  mainActivity?: any
  practiceActivity?: any
  conclusion?: any
  learningResources?: string[]
  assessment?: string
  homework?: string
}

interface TermWeek {
  weekNumber: number
  theme?: string
  lessons: TermWeekLesson[]
}

interface TermPlanData {
  title?: string
  weeks?: TermWeek[]
}

export default function CreateLessonPlan() {
  const router = useRouter()
  const { toast } = useToast()
  const [mode, setMode] = useState<Mode>('single')
  const [singleCountry, setSingleCountry] = useState('KE')
  const [singleCurriculum, setSingleCurriculum] = useState('cbc')
  const [termCountry, setTermCountry] = useState('KE')
  const [termCurriculum, setTermCurriculum] = useState('cbc')

  const SUBJECTS = getSubjectsForCurriculum(mode === 'single' ? singleCurriculum : termCurriculum)
  const GRADES = getGradesForCurriculum(mode === 'single' ? singleCurriculum : termCurriculum)

  // Single mode fields
  const [formData, setFormData] = useState({
    subject: '', grade: '', topic: '', duration: 40,
    objectives: [''],
    prerequisites: [''],
  })

  // Term mode fields
  const [termData, setTermData] = useState({
    subject: '', grade: '', term: 'Term 1',
    weeksCount: 13, lessonsPerWeek: 5,
    topics: [''],
  })

  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedLesson, setGeneratedLesson] = useState<LessonPlanData | null>(null)
  const [generatedTermPlan, setGeneratedTermPlan] = useState<TermPlanData | null>(null)
  const [expandedWeek, setExpandedWeek] = useState<number | null>(null)
  const [expandedLesson, setExpandedLesson] = useState<string | null>(null)
  const [documentContext, setDocumentContext] = useState<string | null>(null)

  const currentSubject = mode === 'single' ? formData.subject : termData.subject
  const currentGrade = mode === 'single' ? formData.grade : termData.grade

  const handleSingleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleObjectiveChange = (index: number, value: string) => {
    const arr = [...formData.objectives]; arr[index] = value; setFormData(prev => ({ ...prev, objectives: arr }))
  }

  const addObjective = () => setFormData(prev => ({ ...prev, objectives: [...prev.objectives, ''] }))
  const removeObjective = (index: number) => {
    if (formData.objectives.length > 1) setFormData(prev => ({ ...prev, objectives: prev.objectives.filter((_, i) => i !== index) }))
  }

  const handlePrereqChange = (index: number, value: string) => {
    const arr = [...formData.prerequisites]; arr[index] = value; setFormData(prev => ({ ...prev, prerequisites: arr }))
  }

  const addPrereq = () => setFormData(prev => ({ ...prev, prerequisites: [...prev.prerequisites, ''] }))
  const removePrereq = (index: number) => {
    if (formData.prerequisites.length > 1) setFormData(prev => ({ ...prev, prerequisites: prev.prerequisites.filter((_, i) => i !== index) }))
  }

  const handleTermTopicChange = (index: number, value: string) => {
    const arr = [...termData.topics]; arr[index] = value; setTermData(prev => ({ ...prev, topics: arr }))
  }

  const addTermTopic = () => setTermData(prev => ({ ...prev, topics: [...prev.topics, ''] }))
  const removeTermTopic = (index: number) => {
    if (termData.topics.length > 1) setTermData(prev => ({ ...prev, topics: prev.topics.filter((_, i) => i !== index) }))
  }

  const handleDocUploaded = async (doc: { name: string; url: string; docType: string; extractedText?: string | null }) => {
    if (doc.extractedText) {
      setDocumentContext(doc.extractedText)
      toast({ title: 'Document loaded as reference', variant: 'success' as any })
    } else {
      toast({ variant: 'destructive', title: 'Could not extract text from document' })
    }
  }

  const getFullTemplate = async () => {
    if (documentContext && documentContext.length > 500) return documentContext
    const res = await fetch('/api/teacher/template')
    if (res.ok) {
      const data = await res.json()
      return data.lessonPlanTemplate || documentContext
    }
    return documentContext
  }

  const handleGenerate = async () => {
    setIsGenerating(true)
    try {
      const fullContext = await getFullTemplate()

      if (mode === 'single') {
        const res = await fetch('/api/ai/generate-lesson-plan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            mode: 'single', ...formData,
            objectives: formData.objectives.filter(o => o.trim()),
            prerequisites: formData.prerequisites.filter(p => p.trim()),
            documentContext: fullContext,
          }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error)
        setGeneratedLesson(data.lesson)
        setGeneratedTermPlan(null)
      } else {
        const res = await fetch('/api/ai/generate-lesson-plan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            mode: 'term',
            subject: termData.subject,
            grade: termData.grade,
            term: termData.term,
            weeksCount: termData.weeksCount,
            lessonsPerWeek: termData.lessonsPerWeek,
            topics: termData.topics.filter(t => t.trim()),
            documentContext: fullContext,
          }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error)
        setGeneratedTermPlan(data.termPlan)
        setGeneratedLesson(null)
      }
    } catch (err) {
      toast({ variant: 'destructive', title: 'Generation failed', description: err instanceof Error ? err.message : 'Unknown error' })
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSave = async () => {
    if (!generatedLesson && !generatedTermPlan) {
      toast({ variant: 'destructive', title: 'Please generate content first' })
      return
    }

    try {
      let title = ''
      let content = {}

      if (generatedLesson) {
        title = generatedLesson.title || `${formData.topic} - ${formData.subject}`
        content = { ...generatedLesson, topic: formData.topic, subject: formData.subject, grade: formData.grade }
      } else if (generatedTermPlan) {
        title = generatedTermPlan.title || `${termData.subject} ${termData.grade} - ${termData.term}`
        content = generatedTermPlan
      }

      const res = await fetch('/api/lesson-plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, subject: currentSubject, grade: currentGrade, content }),
      })

      if (res.ok) {
        toast({ title: 'Saved successfully', variant: 'success' as any })
        router.push('/teacher/lesson-plans')
      } else {
        const err = await res.json()
        toast({ variant: 'destructive', title: 'Failed to save', description: err.error })
      }
    } catch {
      toast({ variant: 'destructive', title: 'Failed to save' })
    }
  }

  const toggleLesson = (weekNum: number, lessonNum: number) => {
    const key = `${weekNum}-${lessonNum}`
    setExpandedLesson(prev => prev === key ? null : key)
  }

  const SectionBlock = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div className="border-l-2 border-blue-200 pl-3 mb-3">
      <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-1">{label}</p>
      <div className="text-sm text-slate-700">{children}</div>
    </div>
  )

  const renderLessonCard = (lesson: LessonPlanData, index?: number) => (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden" key={index || 0}>
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-3">
        <h3 className="text-white font-bold text-sm">{lesson.title || 'Lesson Plan'}</h3>
        {lesson.duration && <p className="text-blue-100 text-xs mt-0.5"><Clock className="w-3 h-3 inline mr-1" />{lesson.duration} minutes</p>}
      </div>
      <div className="p-4 space-y-3">
        {lesson.specificLearningOutcomes && (
          <SectionBlock label="Learning Outcomes">
            <p>{lesson.specificLearningOutcomes}</p>
          </SectionBlock>
        )}
        {lesson.keyInquiryQuestions && lesson.keyInquiryQuestions.length > 0 && (
          <SectionBlock label="Key Inquiry Questions">
            <ul className="list-disc list-inside space-y-0.5">
              {lesson.keyInquiryQuestions.map((q, i) => <li key={i}>{q}</li>)}
            </ul>
          </SectionBlock>
        )}
        {lesson.introduction && (
          <SectionBlock label="Introduction">
            <p className="text-xs text-slate-500 mb-0.5">{lesson.introduction.duration} min</p>
            <p>{lesson.introduction.activity}</p>
          </SectionBlock>
        )}
        {lesson.mainActivity && (
          <SectionBlock label="Main Activity">
            <p className="text-xs text-slate-500 mb-0.5">{lesson.mainActivity.duration} min</p>
            <p>{lesson.mainActivity.activity}</p>
            {lesson.mainActivity.coreCompetencies && lesson.mainActivity.coreCompetencies.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1">
                {lesson.mainActivity.coreCompetencies.map((c, i) => (
                  <span key={i} className="text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded">{c}</span>
                ))}
              </div>
            )}
          </SectionBlock>
        )}
        {lesson.practiceActivity && (
          <SectionBlock label="Practice">
            <p className="text-xs text-slate-500 mb-0.5">{lesson.practiceActivity.duration} min</p>
            <p>{lesson.practiceActivity.activity}</p>
          </SectionBlock>
        )}
        {lesson.conclusion && (
          <SectionBlock label="Conclusion">
            <p className="text-xs text-slate-500 mb-0.5">{lesson.conclusion.duration} min</p>
            <p>{lesson.conclusion.activity}</p>
          </SectionBlock>
        )}
        {lesson.learningResources && lesson.learningResources.length > 0 && (
          <SectionBlock label="Resources">
            <ul className="list-disc list-inside space-y-0.5">
              {lesson.learningResources.map((r, i) => <li key={i}>{r}</li>)}
            </ul>
          </SectionBlock>
        )}
        {lesson.assessment && (
          <SectionBlock label="Assessment">
            <p>{lesson.assessment}</p>
          </SectionBlock>
        )}
        {lesson.differentiation && (
          <SectionBlock label="Differentiation">
            {lesson.differentiation.support && <p className="mb-0.5"><span className="font-medium">Support:</span> {lesson.differentiation.support}</p>}
            {lesson.differentiation.extension && <p><span className="font-medium">Extension:</span> {lesson.differentiation.extension}</p>}
          </SectionBlock>
        )}
        {lesson.homework && (
          <SectionBlock label="Homework">
            <p>{lesson.homework}</p>
          </SectionBlock>
        )}
        {lesson.teacherReflection && (
          <SectionBlock label="Teacher Reflection">
            <p className="italic text-slate-500">{lesson.teacherReflection}</p>
          </SectionBlock>
        )}
      </div>
    </div>
  )

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Create Lesson Plan</h1>
      </div>

      {/* Mode Toggle */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
        <button onClick={() => setMode('single')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${mode === 'single' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
          <BookOpen className="w-4 h-4 inline mr-1.5" />Single Lesson
        </button>
        <button onClick={() => setMode('term')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${mode === 'term' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
          <Layers className="w-4 h-4 inline mr-1.5" />Full Term
        </button>
      </div>

      {/* Form */}
      <Card>
        <CardContent className="p-6 space-y-5">
          {mode === 'single' ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Country</Label>
                  <Select value={singleCountry} onValueChange={(v) => { setSingleCountry(v); setSingleCurriculum(''); setFormData(prev => ({ ...prev, subject: '', grade: '' })) }}>
                    <SelectTrigger><SelectValue placeholder="Select Country" /></SelectTrigger>
                    <SelectContent>
                      {COUNTRIES.map(c => <SelectItem key={c.code} value={c.code}>{c.flag} {c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Curriculum</Label>
                  <Select value={singleCurriculum} onValueChange={(v) => { setSingleCurriculum(v); setFormData(prev => ({ ...prev, subject: '', grade: '' })) }}>
                    <SelectTrigger><SelectValue placeholder="Select Curriculum" /></SelectTrigger>
                    <SelectContent>
                      {getCurriculaByCountry(singleCountry).map(cur => <SelectItem key={cur.id} value={cur.id}>{cur.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Subject</Label>
                  <Select name="subject" value={formData.subject} onValueChange={v => handleSingleChange({ target: { name: 'subject', value: v } } as any)}>
                    <SelectTrigger><SelectValue placeholder="Select Subject" /></SelectTrigger>
                    <SelectContent>
                      {SUBJECTS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Grade</Label>
                  <Select name="grade" value={formData.grade} onValueChange={v => handleSingleChange({ target: { name: 'grade', value: v } } as any)}>
                    <SelectTrigger><SelectValue placeholder="Select Grade" /></SelectTrigger>
                    <SelectContent>
                      {GRADES.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Topic</label>
                <Input name="topic" value={formData.topic} onChange={handleSingleChange} placeholder="e.g. Addition of Fractions" className="h-10" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Duration (minutes)</label>
                <Input name="duration" type="number" value={formData.duration} onChange={handleSingleChange} min={15} max={120} className="h-10 w-32" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Learning Objectives</label>
                {formData.objectives.map((obj, i) => (
                  <div key={i} className="flex gap-2 mb-2">
                    <Input value={obj} onChange={e => handleObjectiveChange(i, e.target.value)} placeholder="Enter learning objective" className="h-10" />
                    {formData.objectives.length > 1 && <Button variant="outline" size="sm" onClick={() => removeObjective(i)}><Trash2 className="w-4 h-4" /></Button>}
                  </div>
                ))}
                <Button variant="ghost" size="sm" onClick={addObjective} className="mt-1"><Plus className="w-4 h-4 mr-1" />Add Objective</Button>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Prerequisites (optional)</label>
                {formData.prerequisites.map((pr, i) => (
                  <div key={i} className="flex gap-2 mb-2">
                    <Input value={pr} onChange={e => handlePrereqChange(i, e.target.value)} placeholder="Enter prerequisite" className="h-10" />
                    {formData.prerequisites.length > 1 && <Button variant="outline" size="sm" onClick={() => removePrereq(i)}><Trash2 className="w-4 h-4" /></Button>}
                  </div>
                ))}
                <Button variant="ghost" size="sm" onClick={addPrereq} className="mt-1"><Plus className="w-4 h-4 mr-1" />Add Prerequisite</Button>
              </div>
            </>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Country</Label>
                  <Select value={termCountry} onValueChange={(v) => { setTermCountry(v); setTermCurriculum(''); setTermData(prev => ({ ...prev, subject: '', grade: '' })) }}>
                    <SelectTrigger><SelectValue placeholder="Select Country" /></SelectTrigger>
                    <SelectContent>
                      {COUNTRIES.map(c => <SelectItem key={c.code} value={c.code}>{c.flag} {c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Curriculum</Label>
                  <Select value={termCurriculum} onValueChange={(v) => { setTermCurriculum(v); setTermData(prev => ({ ...prev, subject: '', grade: '' })) }}>
                    <SelectTrigger><SelectValue placeholder="Select Curriculum" /></SelectTrigger>
                    <SelectContent>
                      {getCurriculaByCountry(termCountry).map(cur => <SelectItem key={cur.id} value={cur.id}>{cur.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Subject</Label>
                  <Select value={termData.subject} onValueChange={v => setTermData(prev => ({ ...prev, subject: v }))}>
                    <SelectTrigger><SelectValue placeholder="Select Subject" /></SelectTrigger>
                    <SelectContent>
                      {SUBJECTS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Grade</Label>
                  <Select value={termData.grade} onValueChange={v => setTermData(prev => ({ ...prev, grade: v }))}>
                    <SelectTrigger><SelectValue placeholder="Select Grade" /></SelectTrigger>
                    <SelectContent>
                      {GRADES.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label>Term</Label>
                  <Select value={termData.term} onValueChange={v => setTermData(prev => ({ ...prev, term: v }))}>
                    <SelectTrigger><SelectValue placeholder="Term 1" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Term 1">Term 1</SelectItem>
                      <SelectItem value="Term 2">Term 2</SelectItem>
                      <SelectItem value="Term 3">Term 3</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Weeks</label>
                  <Input type="number" value={termData.weeksCount} onChange={e => setTermData(prev => ({ ...prev, weeksCount: parseInt(e.target.value) || 13 }))} min={1} max={14} className="h-10" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Lessons/Week</label>
                  <Input type="number" value={termData.lessonsPerWeek} onChange={e => setTermData(prev => ({ ...prev, lessonsPerWeek: parseInt(e.target.value) || 5 }))} min={1} max={10} className="h-10" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Topics to Cover ({termData.topics.filter(t => t.trim()).length})</label>
                {termData.topics.map((t, i) => (
                  <div key={i} className="flex gap-2 mb-2">
                    <Input value={t} onChange={e => handleTermTopicChange(i, e.target.value)} placeholder="e.g. Algebra, Geometry, Statistics" className="h-10" />
                    {termData.topics.length > 1 && <Button variant="outline" size="sm" onClick={() => removeTermTopic(i)}><Trash2 className="w-4 h-4" /></Button>}
                  </div>
                ))}
                <Button variant="ghost" size="sm" onClick={addTermTopic} className="mt-1"><Plus className="w-4 h-4 mr-1" />Add Topic</Button>
              </div>
              <p className="text-xs text-slate-500">Total lessons: {termData.weeksCount * termData.lessonsPerWeek}</p>
            </>
          )}

          <div className="flex items-center gap-3 pt-2">
            <DocumentUploadButton docType="lesson-plan" label="Upload Reference" onUploaded={handleDocUploaded} />
            {documentContext && <span className="text-xs text-green-600"><FileText className="w-3 h-3 inline mr-1" />Reference loaded</span>}
          </div>

          {mode === 'single' && (
            <Button onClick={handleGenerate} disabled={isGenerating || !formData.subject || !formData.grade || !formData.topic} className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white h-11">
              {isGenerating ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Generating...</> : <><BookOpen className="w-4 h-4 mr-2" />Generate Lesson Plan</>}
            </Button>
          )}
          {mode === 'term' && (
            <Button onClick={handleGenerate} disabled={isGenerating || !termData.subject || !termData.grade || termData.topics.filter(t => t.trim()).length === 0} className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white h-11">
              {isGenerating ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Generating {termData.weeksCount * termData.lessonsPerWeek} lessons...</> : <><Layers className="w-4 h-4 mr-2" />Generate Term Lesson Plans</>}
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Generated Output */}
      {generatedLesson && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-800">Generated Lesson Plan</h2>
            <div className="flex gap-2">
              <Button onClick={handleSave} className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                <Save className="w-4 h-4 mr-1.5" />Save
              </Button>
            </div>
          </div>
          {renderLessonCard(generatedLesson)}
        </div>
      )}

      {generatedTermPlan && generatedTermPlan.weeks && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-800">{generatedTermPlan.title || 'Term Lesson Plans'}</h2>
            <Button onClick={handleSave} className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
              <Save className="w-4 h-4 mr-1.5" />Save All
            </Button>
          </div>
          {generatedTermPlan.weeks.map((week) => (
            <Card key={week.weekNumber} className="overflow-hidden">
              <button onClick={() => setExpandedWeek(prev => prev === week.weekNumber ? null : week.weekNumber)} className="w-full flex items-center justify-between px-5 py-3 bg-slate-50 hover:bg-slate-100 transition-colors text-left">
                <div>
                  <span className="font-semibold text-slate-800">Week {week.weekNumber}</span>
                  {week.theme && <span className="text-sm text-slate-500 ml-2">— {week.theme}</span>}
                  <span className="text-xs text-slate-400 ml-3">{week.lessons?.length || 0} lessons</span>
                </div>
                {expandedWeek === week.weekNumber ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
              </button>
              {expandedWeek === week.weekNumber && (
                <div className="p-4 space-y-3">
                  {week.lessons?.map((lesson) => {
                    const lessonKey = `${week.weekNumber}-${lesson.lessonNumber}`
                    const isExpanded = expandedLesson === lessonKey
                    return (
                      <div key={lessonKey} className="border border-slate-200 rounded-lg overflow-hidden">
                        <button onClick={() => toggleLesson(week.weekNumber, lesson.lessonNumber)} className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-slate-50">
                          <div className="flex items-center gap-2">
                            <BookOpen className="w-3.5 h-3.5 text-blue-500" />
                            <span className="text-sm font-medium text-slate-700">Lesson {lesson.lessonNumber}: {lesson.topic}</span>
                            <span className="text-xs text-slate-400"><Clock className="w-3 h-3 inline mr-0.5" />{lesson.duration}min</span>
                          </div>
                          {isExpanded ? <ChevronUp className="w-3.5 h-3.5 text-slate-400" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />}
                        </button>
                        {isExpanded && <div className="px-3 pb-3">{renderLessonCard(lesson as LessonPlanData)}</div>}
                      </div>
                    )
                  })}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
