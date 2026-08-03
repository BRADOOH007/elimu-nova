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
import StockImagePicker from '@/components/ai/stock-image-picker'

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

// Fallback CBC topic suggestions per subject (used when DB curriculum is empty)
const CBC_TOPICS: Record<string, string[]> = {
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
    'Farm Tools & Equipment', 'Pests & Diseases',
    'Organic Farming', 'Water Conservation',
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
    'Formation of the Government of Kenya',
  ],
  Geography: [
    'Map Work', 'Weather & Climate', 'Vegetation', 'Soils',
    'Mining', 'Forestry', 'Fishing', 'Tourism',
    'Population', 'Urbanization', 'Environmental Conservation',
  ],
  'Computer Studies': [
    'Computer Basics', 'Operating Systems', 'Word Processing',
    'Spreadsheets', 'Internet', 'Programming Concepts',
    'Database', 'Networking', 'Data Security', 'Multimedia',
  ],
  CRE: [
    'Creation', 'The Bible', 'Jesus Christ', 'The Early Church',
    'Christian Values', 'Faith & Prayer', 'Community Service',
    'Leadership', 'Marriage & Family', 'Ethics',
  ],
  IRE: [
    'Quran', 'Hadith', 'Prophets', 'Pillars of Islam',
    'Islamic Values', 'Prayer & Worship', 'Community',
    'Family in Islam', 'Moral Teachings',
  ],
  'Business Studies': [
    'Business & Its Environment', 'Office Practice', 'Entrepreneurship',
    'Money & Banking', 'Trade', 'Consumer Protection',
    'Financial Records', 'Taxation', 'Insurance',
  ],
  'Physical Education': [
    'Athletics', 'Ball Games', 'Gymnastics', 'Swimming',
    'Outdoor Activities', 'Fitness & Health', 'Sportsmanship',
    'Warm-up & Cool-down', 'Game Rules & Techniques',
  ],
  Music: [
    'Rhythm & Melody', 'Musical Instruments', 'Singing',
    'Dance', 'Music Notation', 'Kenyan Folk Music',
    'Music Theory', 'Performance', 'Composition',
  ],
  'Art & Craft': [
    'Drawing & Painting', 'Modeling', 'Weaving', 'Beadwork',
    'Printmaking', 'Patterns & Design', 'Color Theory',
    'Kenyan Traditional Art', 'Paper Craft', 'Pottery',
  ],
}

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
  const [isSaving, setIsSaving]           = useState(false)
  const [presentation, setPresentation]   = useState<PresentationData | null>(null)
  const [presentationId, setPresentationId] = useState<string | null>(null)
  const [currentSlide, setCurrentSlide]   = useState(0)
  const [showPreview, setShowPreview]     = useState(false)
  const [stockOpen, setStockOpen]         = useState(false)

  const [savedPPTs, setSavedPPTs]   = useState<SavedPPT[]>([])
  const [loadingList, setLoadingList] = useState(true)
  const [strands, setStrands]       = useState<{ id: string; name: string }[]>([])
  const [loadingStrands, setLoadingStrands] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [isSharing, setIsSharing] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)
  const [shareStudents, setShareStudents]   = useState<any[]>([])
  const [shareClasses, setShareClasses]     = useState<any[]>([])
  const [selStudents, setSelStudents]       = useState<string[]>([])
  const [selClass, setSelClass]             = useState('')
  const [showNotes, setShowNotes]           = useState(true)

  const previewRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/auth/signin')
  }, [status, router])

  // Load students + classes for sharing
  useEffect(() => {
    Promise.all([
      fetch('/api/teacher/students').then(r => r.ok ? r.json() : { data: [] }),
      fetch('/api/teacher/classes').then(r => r.ok ? r.json() : { data: [] }),
    ]).then(([sd, cd]) => {
      setShareStudents(sd.data || [])
      setShareClasses(cd.data || [])
    }).catch(() => {})
  }, [])

  // Fetch curriculum strands + merge with fallback topics
  useEffect(() => {
    if (!subject || !grade) { setStrands([]); return }
    setLoadingStrands(true)
    const fallback = CBC_TOPICS[subject] || []
    fetch(`/api/curriculum/strands?grade=${encodeURIComponent(grade)}&subject=${encodeURIComponent(subject)}`)
      .then(r => r.ok ? r.json() : { strands: [] })
      .then(d => {
        const db = (d.strands || []).map((s: any) => ({ id: s.id, name: s.name }))
        // Merge DB strands with fallback, deduplicate
        const all = [...db]
        fallback.forEach(t => {
          if (!all.some(a => a.name.toLowerCase() === t.toLowerCase())) {
            all.push({ id: `fb-${t}`, name: t })
          }
        })
        setStrands(all)
      })
      .catch(() => setStrands(fallback.map(t => ({ id: `fb-${t}`, name: t }))))
      .finally(() => setLoadingStrands(false))
  }, [subject, grade])

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
      const slides = data.presentation.slides
      setPresentation(data.presentation)
      setPresentationId(data.presentationId || null)
      setCurrentSlide(0)
      setShowPreview(true)
      setActiveTab('create')

      // Build image prompts for every slide — use AI prompt if available,
      // otherwise derive one from the slide title + content
      const slidesToImage = slides.map((s: any) => ({
        ...s,
        imagePrompt: s.imagePrompt?.trim()
          || `Educational illustration for: ${s.title}. ${s.content?.slice(0, 2).join('. ')}`
      }))

      // Generate all slide images in parallel with visible progress
      const totalImages = slidesToImage.length
      let completedImages = 0
      const toastId = `${Date.now()}-images`

      // Show initial progress
      toast({ title: `Generating ${totalImages} slide images...`, variant: 'default', duration: 60000 })

      const results = await Promise.allSettled(
        slidesToImage.map((slide: any) =>
          fetch('/api/ai/generate-image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              prompt: slide.imagePrompt,
              style: 'educational',
              size: '1024x1024',
              quality: 'standard',
              provider: 'auto',
              subject,
              grade,
              topic: `${topic} - ${slide.title}`,
              contextType: 'presentation',
              contextId: data.presentationId || 'new',
            }),
          })
          .then(r => r.ok ? r.json() : Promise.reject())
          .then(imgData => {
            if (imgData?.imageUrl) {
              setPresentation(prev => {
                if (!prev) return prev
                return {
                  ...prev,
                  slides: prev.slides.map(s =>
                    s.slideNumber === slide.slideNumber
                      ? { ...s, imageUrl: imgData.imageUrl }
                      : s
                  ),
                }
              })
            }
          })
          .finally(() => {
            completedImages++
          })
        )
      )

      const succeeded = results.filter(r => r.status === 'fulfilled').length
      const failed = results.filter(r => r.status === 'rejected').length
      if (failed > 0) {
        toast({ title: `${succeeded} images ready, ${failed} failed`, variant: 'default', duration: 5000 })
      }

      toast({ title: `Generated ${slides.length} slides with ${succeeded} images!`, variant: 'success' })
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
            imageUrl:    s.imageUrl,
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
      toast({ title: 'PowerPoint downloaded!', variant: 'success' })
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Export failed', description: e.message || 'Export failed' })
    } finally {
      setIsExporting(false)
    }
  }

  const applyStockImage = (url: string) => {
    setPresentation(prev => {
      if (!prev) return prev
      return {
        ...prev,
        slides: prev.slides.map((s, i) =>
          i === currentSlide ? { ...s, imageUrl: url } : s
        ),
      }
    })
  }

  const deletePPT = async (id: string) => {
    const res = await fetch(`/api/powerpoint/${id}`, { method: 'DELETE', credentials: 'include' })
    if (res.ok) setSavedPPTs(p => p.filter(x => x.id !== id))
  }

  const saveCurrent = async () => {
    if (!presentation || !subject || !grade || !topic || isSaving) return
    setIsSaving(true)
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
    finally { setIsSaving(false) }
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
            <Button onClick={saveCurrent} disabled={isSaving} variant="outline"
              className="border-green-300 text-green-700 hover:bg-green-50">
              {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />} {isSaving ? 'Saving...' : 'Save'}
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
                  <div className="relative mt-1">
                    <Input value={topic} onChange={e => setTopic(e.target.value)}
                      placeholder={loadingStrands ? 'Loading…' : 'Type or pick a topic…'}
                      list="ppt-topics"
                      className={strands.length > 0 ? 'pr-20' : ''} />
                    {strands.length > 0 && (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-gray-400 font-medium bg-gray-50 px-1.5 py-0.5 rounded">
                        {strands.length} topics
                      </span>
                    )}
                  </div>
                  <datalist id="ppt-topics">
                    {strands.map(s => <option key={s.id} value={s.name} />)}
                  </datalist>
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

            {/* Slide Preview — premium glassmorphic card */}
            <div className="flex flex-col gap-4">
              {presentation && slide ? (
                <>
                  {/* Slide card */}
                  <div ref={previewRef}
                    className={`relative rounded-2xl overflow-hidden shadow-2xl border ${style.border} flex flex-col bg-white`}>

                    {/* Slide number badge — floating */}
                    <div className="absolute top-3 right-3 z-10">
                      <span className="bg-black/40 backdrop-blur-sm text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                        {currentSlide + 1} / {total}
                      </span>
                    </div>

                    {/* Header bar */}
                    <div className={`h-14 ${style.header} flex items-center justify-between px-6`}>
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg bg-white/20 backdrop-blur flex items-center justify-center shadow-inner`}>
                          <Presentation className="h-4 w-4 text-white" />
                        </div>
                        <span className={`${style.badge} px-3 py-1 rounded-full text-xs font-bold tracking-wider shadow-lg`}>
                          {section.toUpperCase()}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-white/70 text-xs">
                        <BookOpen className="h-3.5 w-3.5" />
                        <span className="font-medium">{subject} • {grade}</span>
                      </div>
                    </div>

                    {/* Content area */}
                    <div className={`flex-1 ${style.bg} p-6 lg:p-8 min-h-[340px]`}>
                      <div className="grid grid-cols-12 gap-6 h-full">
                        {/* Text column */}
                        <div className={slide.imagePrompt ? 'col-span-12 lg:col-span-7' : 'col-span-12'}>
                          <h2 className={`text-2xl font-black ${style.accent} mb-2 tracking-tight`}>{slide.title}</h2>
                          <div className={`w-20 h-1.5 rounded-full ${style.accentBg} mb-6`} />
                          <div className="space-y-3">
                            {slide.content.map((bullet, idx) => (
                              <div key={idx}
                                className="flex items-start gap-3 p-3 lg:p-4 rounded-xl bg-white/80 backdrop-blur shadow-sm border border-white/60 hover:shadow-md hover:bg-white/90 transition-all duration-200">
                                <span className={`shrink-0 w-8 h-8 rounded-xl bg-gradient-to-br ${style.bullet} text-white text-xs font-bold flex items-center justify-center shadow-md`}>
                                  {idx + 1}
                                </span>
                                <p className="text-sm lg:text-base font-medium text-gray-800 leading-relaxed">{bullet}</p>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Image column */}
                        {slide.imagePrompt && (
                          <div className="col-span-12 lg:col-span-5 flex items-center justify-center">
                            {slide.imageUrl ? (
                              <div className={`w-full rounded-xl overflow-hidden border-2 ${style.border} shadow-xl hover:shadow-2xl transition-shadow duration-300`}>
                                <img src={slide.imageUrl} alt={slide.title}
                                  className="w-full h-full object-contain bg-white" />
                                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/40 to-transparent h-12" />
                              </div>
                            ) : (
                              <div className={`w-full min-h-[220px] rounded-xl border-2 border-dashed ${style.border} flex flex-col items-center justify-center p-6 bg-white/50 backdrop-blur-sm`}>
                                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${style.bullet} flex items-center justify-center mb-4 shadow-xl`}>
                                  <ImageIcon className="h-8 w-8 text-white" />
                                </div>
                                <p className="text-xs text-gray-400 text-center leading-relaxed max-w-[200px]">
                                  {slide.imagePrompt.slice(0, 100)}
                                </p>
                                <div className="mt-3 flex items-center gap-1.5 flex-wrap justify-center">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setStockOpen(true)}
                                    className="text-rose-600 border-rose-200 hover:bg-rose-50"
                                  >
                                    <Search className="h-3 w-3 mr-1" /> Search Real Images
                                  </Button>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="bg-white/80 backdrop-blur-sm px-6 py-3 flex items-center justify-between text-xs border-t border-gray-100">
                      <span className="flex items-center gap-2 text-gray-400">
                        <Sparkles className="h-3.5 w-3.5 text-blue-500" />
                        <span>Elimu<span className="font-bold text-blue-600">Nova</span> AI</span>
                      </span>
                      {slide.speakerNotes && (
                        <button onClick={() => setShowNotes(v => !v)}
                          className="text-amber-600 flex items-center gap-1.5 hover:text-amber-700 transition-colors">
                          <span className={`w-1.5 h-1.5 rounded-full bg-amber-400 ${showNotes ? 'opacity-100' : 'animate-pulse'}`} />
                          <span>{showNotes ? 'Hide notes' : 'Teacher notes'}</span>
                          <ChevronRight className={`h-3 w-3 transition-transform ${showNotes ? 'rotate-90' : ''}`} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Navigation controls — larger, clearly visible */}
                  <div className="flex items-center justify-between bg-white/60 backdrop-blur-sm rounded-xl border border-gray-100 px-3 py-2.5 shadow-sm">
                    <div className="flex gap-1.5">
                      <Button size="sm" variant="ghost" onClick={() => setCurrentSlide(0)} disabled={currentSlide === 0}
                        className="h-9 w-9 p-0 hover:bg-gray-100 disabled:opacity-30">
                        <SkipBack className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={prev} disabled={currentSlide === 0}
                        className="h-9 w-9 p-0 hover:bg-gray-100 disabled:opacity-30">
                        <ChevronLeft className="h-5 w-5" />
                      </Button>
                    </div>

                    {/* Dot indicators */}
                    <div className="flex items-center gap-2">
                      {presentation.slides.map((s, i) => {
                        const dotStyle = SECTION[s.section as Section]
                        return (
                          <button key={i} onClick={() => setCurrentSlide(i)}
                            className={`h-2 rounded-full transition-all duration-300 ${
                              i === currentSlide
                                ? `w-6 bg-gradient-to-r ${dotStyle.bullet} shadow-sm`
                                : 'w-2 bg-gray-300 hover:bg-gray-400'
                            }`}
                            title={`Slide ${i + 1}`} />
                        )
                      })}
                    </div>

                    <div className="flex gap-1.5">
                      <Button size="sm" variant="ghost" onClick={next} disabled={currentSlide === total - 1}
                        className="h-9 w-9 p-0 hover:bg-gray-100 disabled:opacity-30">
                        <ChevronRight className="h-5 w-5" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setCurrentSlide(total - 1)} disabled={currentSlide === total - 1}
                        className="h-9 w-9 p-0 hover:bg-gray-100 disabled:opacity-30">
                        <SkipForward className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Speaker notes — collapsible */}
                  {slide.speakerNotes && (
                    <div className={`bg-amber-50/80 backdrop-blur-sm border border-amber-200/70 rounded-xl shadow-sm transition-all duration-300 overflow-hidden ${
                      showNotes ? 'p-4 max-h-96 opacity-100' : 'max-h-0 p-0 opacity-0 border-transparent'
                    }`}>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
                          <BookOpen className="h-4 w-4 text-amber-700" />
                        </div>
                        <p className="font-semibold text-amber-800 text-xs uppercase tracking-wider">Teacher Notes</p>
                      </div>
                      <p className="leading-relaxed text-sm">{slide.speakerNotes}</p>
                    </div>
                  )}

                  {/* Keyboard hint */}
                  <div className="flex items-center justify-center gap-4 text-xs text-gray-400">
                    <span className="flex items-center gap-1.5">
                      <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-[10px] font-mono text-gray-500 border border-gray-200">←</kbd>
                      <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-[10px] font-mono text-gray-500 border border-gray-200">→</kbd>
                      <span>navigate</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-[10px] font-mono text-gray-500 border border-gray-200">F</kbd>
                      <span>fullscreen</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-[10px] font-mono text-gray-500 border border-gray-200">Esc</kbd>
                      <span>close</span>
                    </span>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full min-h-[400px] rounded-2xl bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 border-2 border-dashed border-blue-200/60 text-center p-8">
                  <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-blue-500 via-blue-600 to-purple-600 flex items-center justify-center mb-5 shadow-xl shadow-blue-200/50">
                    <Presentation className="h-12 w-12 text-white" />
                  </div>
                  <h3 className="font-semibold text-gray-700 text-lg mb-2">Slide Preview</h3>
                  <p className="text-sm text-gray-400 max-w-xs">Fill in the subject, grade, and topic then click <span className="font-medium text-blue-600">Generate</span></p>
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

      <StockImagePicker
        open={stockOpen}
        onClose={() => setStockOpen(false)}
        initialQuery={currentSlide >= 0 ? (presentation?.slides[currentSlide]?.imagePrompt || presentation?.slides[currentSlide]?.title || '') : ''}
        onSelect={(url) => {
          applyStockImage(url)
          setStockOpen(false)
        }}
      />
    </div>
  )
}
