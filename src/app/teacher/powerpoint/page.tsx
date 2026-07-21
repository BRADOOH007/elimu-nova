'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import {
  Presentation, Loader2, Download, ChevronLeft, ChevronRight,
  Sparkles, Image as ImageIcon, SkipBack, SkipForward, Maximize2,
  BookOpen, GraduationCap, Zap, Search, Plus, Trash2, Calendar,
  Eye, MoreHorizontal
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Slider } from '@/components/ui/slider'
import { useToast } from '@/hooks/use-toast'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu'

// ── Section styles matching TutorBot exactly ─────────────────────────────────
const SECTION = {
  introduction: {
    header:    'bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-600',
    badge:     'bg-gradient-to-r from-blue-600 to-blue-500 text-white',
    accent:    'text-blue-700',
    accentBg:  'bg-gradient-to-r from-blue-600 to-blue-500',
    bullet:    'from-blue-600 to-blue-500',
    bg:        'bg-gradient-to-br from-blue-50 to-indigo-50',
    border:    'border-blue-200',
  },
  body: {
    header:    'bg-gradient-to-r from-emerald-700 via-emerald-600 to-teal-600',
    badge:     'bg-gradient-to-r from-emerald-600 to-emerald-500 text-white',
    accent:    'text-emerald-700',
    accentBg:  'bg-gradient-to-r from-emerald-600 to-emerald-500',
    bullet:    'from-emerald-600 to-emerald-500',
    bg:        'bg-gradient-to-br from-emerald-50 to-teal-50',
    border:    'border-emerald-200',
  },
  conclusion: {
    header:    'bg-gradient-to-r from-violet-700 via-violet-600 to-purple-600',
    badge:     'bg-gradient-to-r from-violet-600 to-purple-500 text-white',
    accent:    'text-violet-700',
    accentBg:  'bg-gradient-to-r from-violet-600 to-purple-500',
    bullet:    'from-violet-600 to-purple-500',
    bg:        'bg-gradient-to-br from-violet-50 to-purple-50',
    border:    'border-violet-200',
  },
}

type Section = keyof typeof SECTION

interface Slide {
  slideNumber:  number
  section:      Section
  title:        string
  content:      string[]
  speakerNotes: string
  imagePrompt:  string
  imageUrl?:    string
}

interface PresentationData {
  slides:   Slide[]
  metadata: { subject: string; grade: string; topic: string; totalSlides: number }
}

interface SavedPPT {
  id: string; title: string; subject: string; grade: string; topic: string
  createdAt: string; metadata: any
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

export default function PowerPointPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { toast } = useToast()

  const [activeTab, setActiveTab]       = useState('create')
  const [subject, setSubject]           = useState('')
  const [grade, setGrade]               = useState('')
  const [topic, setTopic]               = useState('')
  const [slideCount, setSlideCount]     = useState(8)
  const [difficulty, setDifficulty]     = useState('medium')
  const [instructions, setInstructions] = useState('')

  const [isGenerating, setIsGenerating]   = useState(false)
  const [isExporting, setIsExporting]     = useState(false)
  const [presentation, setPresentation]   = useState<PresentationData | null>(null)
  const [presentationId, setPresentationId] = useState<string | null>(null)
  const [currentSlide, setCurrentSlide]   = useState(0)
  const [showPreview, setShowPreview]     = useState(false)

  const [savedPPTs, setSavedPPTs]   = useState<SavedPPT[]>([])
  const [loadingList, setLoadingList] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [isSharing, setIsSharing] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)
  const [shareStudents, setShareStudents] = useState<any[]>([])
  const [shareClasses, setShareClasses]   = useState<any[]>([])
  const [selStudents, setSelStudents]     = useState<string[]>([])
  const [selClass, setSelClass]           = useState('')

  const previewRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/auth/signin')
  }, [status, router])

  // Load students + classes for sharing
  useEffect(() => {
    Promise.all([
      fetch('/api/teacher/students').then(r => r.ok ? r.json() : { students: [] }),
      fetch('/api/teacher/classes').then(r => r.ok ? r.json() : { classes: [] }),
    ]).then(([sd, cd]) => {
      setShareStudents(sd.students || [])
      setShareClasses(cd.classes || [])
    }).catch(() => {})
  }, [])

  // Fetch saved presentations
  useEffect(() => {
    fetch('/api/powerpoint', { credentials: 'include' })
      .then(r => r.ok ? r.json() : { powerpoints: [] })
      .then(d => setSavedPPTs(d.powerpoints || []))
      .catch(() => {})
      .finally(() => setLoadingList(false))
  }, [])

  // Keyboard navigation
  const total = presentation?.slides.length || 0
  const prev  = useCallback(() => setCurrentSlide(i => Math.max(0, i - 1)), [])
  const next  = useCallback(() => setCurrentSlide(i => Math.min(total - 1, i + 1)), [total])

  useEffect(() => {
    if (!showPreview) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); next() }
      if (e.key === 'ArrowLeft')                   { e.preventDefault(); prev() }
      if (e.key === 'Home')                        { e.preventDefault(); setCurrentSlide(0) }
      if (e.key === 'End')                         { e.preventDefault(); setCurrentSlide(total - 1) }
      if (e.key === 'Escape')                      setShowPreview(false)
      if (e.key === 'f' || e.key === 'F') {
        e.preventDefault()
        if (document.fullscreenElement) document.exitFullscreen()
        else previewRef.current?.requestFullscreen()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [showPreview, next, prev, total])

  const generate = async () => {
    if (!subject || !grade || !topic) {
      toast({ variant: 'destructive', title: 'Please fill in subject, grade, and topic' })
      return
    }
    setIsGenerating(true)
    setPresentation(null)
    try {
      const res  = await fetch('/api/ai/generate-simple-presentation', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ subject, grade, topic, slideCount, difficulty, customInstructions: instructions }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Generation failed')
      setPresentation(data.presentation)
      setPresentationId(data.presentationId || null)
      setCurrentSlide(0)
      setShowPreview(true)
      setActiveTab('create')
      toast({ title: `Generated ${data.presentation.slides.length} slides!`, variant: 'success' } as any)
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Generation failed', description: e.message })
    } finally {
      setIsGenerating(false)
    }
  }

  const exportPPTX = async () => {
    if (!presentation) return
    setIsExporting(true)
    try {
      const res = await fetch('/api/export/powerpoint', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          title:   `${subject}: ${topic}`,
          subject, grade,
          slides:  presentation.slides.map((s, i) => ({
            id:          String(i),
            title:       s.title,
            content:     s.content,
            imagePrompt: s.imagePrompt,
            layout:      s.imagePrompt ? 'split' : 'content',
            section:     s.section,
            speakerNotes: s.speakerNotes,
          })),
          format: 'pptx',
        }),
      })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error) }
      const blob = await res.blob()
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href = url
      a.download = `${subject}_${topic.replace(/[^a-z0-9]/gi,'_')}.pptx`
      a.click()
      URL.revokeObjectURL(url)
      toast({ title: 'PowerPoint downloaded!', variant: 'success' } as any)
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Export failed', description: e.message || 'Export failed' })
    } finally {
      setIsExporting(false)
    }
  }

  const deletePPT = async (id: string) => {
    const res = await fetch(`/api/powerpoint/${id}`, { method: 'DELETE', credentials: 'include' })
    if (res.ok) setSavedPPTs(p => p.filter(x => x.id !== id))
  }

  const saveCurrent = async () => {
    if (!presentation || !subject || !grade || !topic) return
    try {
      const res = await fetch('/api/powerpoint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          title: `${subject}: ${topic}`,
          subject, grade, topic,
          slideCount: presentation.slides.length,
          slides: presentation.slides.map((s, i) => ({
            id: String(i), title: s.title, content: s.content,
            slideType: 'content', speakerNotes: s.speakerNotes,
            visualSuggestions: s.imagePrompt ? [s.imagePrompt] : [], order: i + 1,
          })),
          metadata: { difficulty, slideCount: presentation.slides.length, generatedAt: new Date().toISOString() },
        }),
      })
      if (res.ok) {
        const d = await res.json()
        setSavedPPTs(prev => [{ id: d.id || Date.now().toString(), title: `${subject}: ${topic}`, subject, grade, topic, createdAt: new Date().toISOString(), metadata: {} }, ...prev])
        toast({ title: '✅ Saved to My Presentations!' })
        setActiveTab('browse')
      }
    } catch { toast({ variant: 'destructive', title: 'Save failed' }) }
  }

  const shareWithStudents = async () => {
    if (!presentationId && savedPPTs.length === 0) {
      toast({ variant: 'destructive', title: 'Save the presentation first' }); return
    }
    setIsSharing(true)
    try {
      const id = presentationId || savedPPTs[0]?.id
      const res = await fetch(`/api/ai-content/${id}/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          studentIds: selStudents,
          classIds:   selClass && selClass !== '__none__' ? [selClass] : [],
        }),
      })
      if (res.ok) {
        toast({ title: '✅ Shared with students! They can see it in Resources.' })
        setShowShareModal(false); setSelStudents([]); setSelClass('')
      } else { toast({ variant: 'destructive', title: 'Share failed' }) }
    } catch { toast({ variant: 'destructive', title: 'Share failed' }) }
    finally { setIsSharing(false) }
  }

  if (status === 'loading') return (
    <div className="flex items-center justify-center min-h-screen">
      <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
    </div>
  )

  const slide   = presentation?.slides[currentSlide]
  const section = (slide?.section || 'body') as Section
  const style   = SECTION[section]

  return (
    <div className="space-y-6 p-1">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            PowerPoint AI
          </h1>
          <p className="text-gray-500 text-sm">Generate CBC-aligned presentations with AI images</p>
        </div>
        {presentation && (
          <div className="flex items-center gap-2 flex-wrap">
            <Button onClick={saveCurrent} variant="outline"
              className="border-green-300 text-green-700 hover:bg-green-50">
              <Plus className="mr-2 h-4 w-4" /> Save
            </Button>
            <Button onClick={() => setShowShareModal(true)} variant="outline"
              className="border-blue-300 text-blue-700 hover:bg-blue-50">
              <GraduationCap className="mr-2 h-4 w-4" /> Share with Students
            </Button>
            <Button onClick={exportPPTX} disabled={isExporting}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg">
              {isExporting
                ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Exporting…</>
                : <><Download className="mr-2 h-4 w-4" /> Export PPTX</>}
            </Button>
          </div>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-2 w-full sm:w-80">
          <TabsTrigger value="create">
            <Sparkles className="w-4 h-4 mr-2" /> Create
          </TabsTrigger>
          <TabsTrigger value="browse">
            <BookOpen className="w-4 h-4 mr-2" /> My Presentations
          </TabsTrigger>
        </TabsList>

        {/* ── CREATE TAB ─────────────────────────────────────────────────── */}
        <TabsContent value="create" className="space-y-6 mt-4">
          <div className="grid lg:grid-cols-2 gap-6">

            {/* Form */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Zap className="h-5 w-5 text-blue-600" /> Presentation Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs font-semibold text-gray-600">Subject *</Label>
                    <Select value={subject} onValueChange={setSubject}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select…" />
                      </SelectTrigger>
                      <SelectContent>
                        {SUBJECTS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs font-semibold text-gray-600">Grade *</Label>
                    <Select value={grade} onValueChange={setGrade}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select…" />
                      </SelectTrigger>
                      <SelectContent>
                        {GRADES.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label className="text-xs font-semibold text-gray-600">Topic *</Label>
                  <Input value={topic} onChange={e => setTopic(e.target.value)}
                    placeholder="e.g. Fractions and Decimals"
                    className="mt-1" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs font-semibold text-gray-600">
                      Slides: {slideCount}
                    </Label>
                    <Slider value={[slideCount]} min={4} max={15} step={1}
                      onValueChange={([v]) => setSlideCount(v)}
                      className="mt-2" />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold text-gray-600">Difficulty</Label>
                    <Select value={difficulty} onValueChange={setDifficulty}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="easy">Easy</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="hard">Hard</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label className="text-xs font-semibold text-gray-600">
                    Custom Instructions (optional)
                  </Label>
                  <Textarea value={instructions} onChange={e => setInstructions(e.target.value)}
                    placeholder="e.g. Include real-world Kenya examples, focus on group activities…"
                    className="mt-1 resize-none" rows={2} />
                </div>

                <Button onClick={generate} disabled={isGenerating || !subject || !grade || !topic}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 h-11 shadow-md">
                  {isGenerating
                    ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating…</>
                    : <><Sparkles className="mr-2 h-4 w-4" /> Generate with AI</>}
                </Button>
              </CardContent>
            </Card>

            {/* Slide Preview — TutorBot style */}
            <div className="flex flex-col gap-3">
              {presentation && slide ? (
                <>
                  {/* Slide card */}
                  <div ref={previewRef}
                    className={`rounded-2xl overflow-hidden shadow-2xl border-2 ${style.border} flex flex-col`}>

                    {/* Header bar */}
                    <div className={`h-12 ${style.header} flex items-center justify-between px-4`}>
                      <span className={`${style.badge} px-3 py-1 rounded-full text-xs font-bold tracking-wider shadow-lg`}>
                        {section.toUpperCase()}
                      </span>
                      <span className="text-white/90 text-sm font-medium">
                        {currentSlide + 1} / {total}
                      </span>
                    </div>

                    {/* Content */}
                    <div className={`flex-1 ${style.bg} p-6 min-h-[320px]`}>
                      <div className="grid grid-cols-12 gap-4 h-full">
                        {/* Text column */}
                        <div className={slide.imagePrompt ? 'col-span-7' : 'col-span-12'}>
                          <h2 className={`text-xl font-black ${style.accent} mb-1`}>{slide.title}</h2>
                          <div className={`w-16 h-1 rounded-full ${style.accentBg} mb-4`} />
                          <div className="space-y-3">
                            {slide.content.map((bullet, idx) => (
                              <div key={idx}
                                className="flex items-start gap-3 p-3 rounded-xl bg-white/70 shadow-sm border border-white/50">
                                <span className={`shrink-0 w-7 h-7 rounded-full bg-gradient-to-br ${style.bullet} text-white text-xs font-bold flex items-center justify-center shadow`}>
                                  {idx + 1}
                                </span>
                                <p className="text-sm font-medium text-gray-800 leading-snug">{bullet}</p>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Image column */}
                        {slide.imagePrompt && (
                          <div className="col-span-5 flex items-center justify-center">
                            {slide.imageUrl ? (
                              <div className={`w-full rounded-xl overflow-hidden border-2 ${style.border} shadow-lg`}>
                                <img src={slide.imageUrl} alt={slide.title}
                                  className="w-full h-full object-contain" />
                              </div>
                            ) : (
                              <div className={`w-full h-full min-h-[200px] rounded-xl border-2 border-dashed ${style.border} flex flex-col items-center justify-center p-4 bg-white/40`}>
                                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${style.bullet} flex items-center justify-center mb-3 shadow-lg`}>
                                  <ImageIcon className="h-7 w-7 text-white" />
                                </div>
                                <p className="text-xs text-gray-500 text-center leading-relaxed">
                                  {slide.imagePrompt.slice(0, 80)}
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="bg-gray-50 px-4 py-2 flex items-center justify-between text-xs text-gray-400 border-t">
                      <span className="flex items-center gap-1"><Sparkles className="h-3 w-3" /> ElimuNova AI</span>
                      <span className="font-medium text-gray-600">{subject} • {grade}</span>
                    </div>
                  </div>

                  {/* Navigation controls */}
                  <div className="flex items-center justify-between px-1">
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => setCurrentSlide(0)} disabled={currentSlide === 0}>
                        <SkipBack className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={prev} disabled={currentSlide === 0}>
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Dot indicators */}
                    <div className="flex gap-1.5">
                      {presentation.slides.map((s, i) => {
                        const dotStyle = SECTION[s.section as Section]
                        return (
                          <button key={i} onClick={() => setCurrentSlide(i)}
                            className={`w-2.5 h-2.5 rounded-full transition-all ${
                              i === currentSlide
                                ? `bg-gradient-to-br ${dotStyle.bullet} scale-125 shadow`
                                : 'bg-gray-300 hover:bg-gray-400'
                            }`} />
                        )
                      })}
                    </div>

                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={next} disabled={currentSlide === total - 1}>
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setCurrentSlide(total - 1)} disabled={currentSlide === total - 1}>
                        <SkipForward className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Speaker notes */}
                  {slide.speakerNotes && (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800">
                      <p className="font-semibold mb-1">📝 Teacher Notes</p>
                      <p>{slide.speakerNotes}</p>
                    </div>
                  )}

                  {/* Keyboard hint */}
                  <p className="text-xs text-gray-400 text-center">
                    ← → to navigate · F for fullscreen · Export PPTX to download
                  </p>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full min-h-[360px] rounded-2xl bg-gradient-to-br from-slate-50 to-blue-50 border-2 border-dashed border-blue-200 text-center p-8">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mb-4 shadow-xl">
                    <Presentation className="h-10 w-10 text-white" />
                  </div>
                  <h3 className="font-semibold text-gray-700 mb-2">Slide Preview</h3>
                  <p className="text-sm text-gray-400">Fill in the details and click Generate</p>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        {/* ── BROWSE TAB ──────────────────────────────────────────────────── */}
        <TabsContent value="browse" className="mt-4 space-y-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search presentations…" className="pl-9" />
          </div>

          {loadingList ? (
            <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>
          ) : savedPPTs.filter(p =>
              p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
              p.subject.toLowerCase().includes(searchTerm.toLowerCase())
            ).length === 0 ? (
            <div className="text-center py-16">
              <Presentation className="mx-auto h-12 w-12 text-gray-300 mb-4" />
              <h3 className="font-medium text-gray-600 mb-2">No presentations yet</h3>
              <Button onClick={() => setActiveTab('create')}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                <Plus className="mr-2 h-4 w-4" /> Create First Presentation
              </Button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {savedPPTs
                .filter(p =>
                  p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  p.subject?.toLowerCase().includes(searchTerm.toLowerCase())
                )
                .map(ppt => (
                  <Card key={ppt.id} className="hover:shadow-lg transition-shadow border-0 shadow">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-sm font-semibold line-clamp-2">{ppt.title}</CardTitle>
                          <CardDescription className="flex items-center gap-1 mt-1 text-xs">
                            <GraduationCap className="h-3 w-3" />
                            {ppt.grade} • {ppt.subject}
                          </CardDescription>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => deletePPT(ppt.id)} className="text-red-600">
                              <Trash2 className="mr-2 h-4 w-4" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="flex items-center justify-between text-xs text-gray-400 mt-2">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(ppt.createdAt).toLocaleDateString()}
                        </span>
                        <Badge variant="secondary" className="text-xs">
                          {ppt.metadata?.slideCount || '?'} slides
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* ── Share Modal ─────────────────────────────────────────────── */}
      <Dialog open={showShareModal} onOpenChange={setShowShareModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Share with Students</DialogTitle>
            <DialogDescription>Students will see this presentation in their Resources tab.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Share with entire class</Label>
              <Select value={selClass} onValueChange={v => setSelClass(v as any)}>
                <SelectTrigger>
                  <SelectValue placeholder="No class (individual students)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">No class (individual students)</SelectItem>
                  {shareClasses.map((c: any) => (
                    <SelectItem key={c.id} value={c.id}>{c.name} — {c.grade}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selClass === '__none__' && shareStudents.length > 0 && (
              <div className="space-y-2">
                <Label>Or select individual students</Label>
                <div className="max-h-40 overflow-y-auto border border-slate-200 rounded-xl divide-y">
                  {shareStudents.map((s: any) => (
                    <Label key={s.id} className="flex items-center gap-3 px-3 py-2 hover:bg-slate-50 cursor-pointer text-sm">
                      <Checkbox checked={selStudents.includes(s.id)}
                        onCheckedChange={checked => setSelStudents(prev => checked ? [...prev, s.id] : prev.filter(x => x !== s.id))} />
                      {s.name}
                    </Label>
                  ))}
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="flex gap-3 sm:gap-3">
            <Button variant="outline" onClick={() => setShowShareModal(false)} className="flex-1">Cancel</Button>
            <Button onClick={shareWithStudents} disabled={isSharing || (selClass === '__none__' && selStudents.length === 0)} className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600">
              {isSharing ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Sharing…</> : <><GraduationCap className="h-4 w-4 mr-2" /> Share</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
