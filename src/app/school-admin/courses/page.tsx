"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogBody, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, BookOpen, Plus, Search, Edit, Trash2, Users, GraduationCap, Clock, BarChart3 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { confirmToast } from '@/lib/confirm-toast'

const GRADES = ['Grade 1','Grade 2','Grade 3','Grade 4','Grade 5','Grade 6','Grade 7','Grade 8','Grade 9','Form 1','Form 2','Form 3','Form 4']

interface Course {
  id: string; title: string; type: string; gradeLevel: string
  difficulty: string; duration?: string; isActive: boolean
  _count?: { lessons: number; enrollments: number }
  description?: string
}

const initialForm = { title: "", type: "CBC_ENGLISH", gradeLevel: "", difficulty: "MEDIUM", duration: "", description: "" }

export default function SchoolAdminCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [showDialog, setShowDialog] = useState(false)
  const [editingCourse, setEditingCourse] = useState<Course | null>(null)
  const [form, setForm] = useState(initialForm)
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  useEffect(() => { fetchCourses() }, [])

  const fetchCourses = async () => {
    try {
      const res = await fetch('/api/courses')
      if (res.ok) setCourses((await res.json()).courses || [])
    } catch (e) { console.warn('[SchoolAdminCourses] fetchCourses error:', e) } finally { setLoading(false) }
  }

  const openCreate = () => {
    setEditingCourse(null)
    setForm(initialForm)
    setShowDialog(true)
  }

  const openEdit = (course: Course) => {
    setEditingCourse(course)
    setForm({ title: course.title, type: course.type, gradeLevel: course.gradeLevel, difficulty: course.difficulty, duration: course.duration || "", description: course.description || "" })
    setShowDialog(true)
  }

  const handleSave = async () => {
    if (!form.title || !form.gradeLevel) { toast({ title: 'Validation', description: 'Title and grade level are required' }); return }
    setSaving(true)
    try {
      const url = editingCourse ? `/api/courses/${editingCourse.id}` : '/api/courses'
      const method = editingCourse ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingCourse ? { ...form } : form)
      })
      if (res.ok) { toast({ title: editingCourse ? 'Course updated' : 'Course created' }); setShowDialog(false); fetchCourses() }
      else { const e = await res.json(); toast({ title: 'Error', description: e.error }) }
    } catch (e) { console.warn('[SchoolAdminCourses] handleSave error:', e) } finally { setSaving(false) }
  }

  const handleDelete = async (id: string) => {
    if (!(await confirmToast({ title: 'Delete this course?' }))) return
    try { await fetch(`/api/courses/${id}`, { method: 'DELETE' }); toast({ title: 'Deleted' }); fetchCourses() } catch (e) { console.warn('[SchoolAdminCourses] handleDelete error:', e) }
  }

  const filtered = courses.filter(c => c.title.toLowerCase().includes(search.toLowerCase()) || c.type.includes(search.toUpperCase()))

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><BookOpen className="w-6 h-6 text-blue-600" /> Course Management</h1>
          <p className="text-sm text-gray-600">Create and manage courses for students</p>
        </div>
        <Button onClick={openCreate} className="bg-gradient-to-r from-blue-600 to-purple-600"><Plus className="w-4 h-4 mr-2" /> Add Course</Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search courses..." className="pl-10" />
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="border-0 shadow">
              <CardContent className="p-5 space-y-3 animate-pulse">
                <div className="w-10 h-10 bg-slate-200 rounded-lg" />
                <div className="space-y-2">
                  <div className="h-5 w-3/4 bg-slate-200 rounded" />
                  <div className="h-4 w-1/2 bg-slate-200 rounded" />
                </div>
                <div className="flex gap-2">
                  <div className="h-6 w-16 bg-slate-200 rounded-full" />
                  <div className="h-6 w-20 bg-slate-200 rounded-full" />
                </div>
                <div className="h-4 w-2/3 bg-slate-200 rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-gray-500">No courses yet</CardContent></Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map(c => (
            <Card key={c.id} className="border-0 shadow hover:shadow-lg transition-shadow">
              <CardContent className="p-5 space-y-3">
                <div className="flex items-start justify-between">
                  <Badge variant="outline" className="text-xs">{c.type.replace(/_/g, ' ')}</Badge>
                  <Badge variant={c.isActive ? 'default' : 'secondary'}>{c.isActive ? 'Active' : 'Inactive'}</Badge>
                </div>
                <h3 className="font-semibold">{c.title}</h3>
                <div className="flex items-center gap-2 text-xs text-gray-500 flex-wrap">
                  <Badge variant="outline"><GraduationCap className="w-3 h-3 mr-1" />{c.gradeLevel}</Badge>
                  <Badge variant="outline">{c.difficulty}</Badge>
                  {c.duration && <Badge variant="outline"><Clock className="w-3 h-3 mr-1" />{c.duration}</Badge>}
                </div>
                {c.description && <p className="text-sm text-gray-600 line-clamp-2">{c.description}</p>}
                <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t">
                  <span><BarChart3 className="w-3 h-3 inline mr-1" />{c._count?.lessons || 0} lessons</span>
                  <span><Users className="w-3 h-3 inline mr-1" />{c._count?.enrollments || 0} enrolled</span>
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => openEdit(c)}><Edit className="w-3 h-3" /></Button>
                    <Button size="sm" variant="ghost" className="text-red-600 h-6 w-6 p-0" onClick={() => handleDelete(c.id)}><Trash2 className="w-3 h-3" /></Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="bg-white max-w-md">
          <DialogHeader><DialogTitle>{editingCourse ? 'Edit Course' : 'Add Course'}</DialogTitle></DialogHeader>
          <DialogBody className="space-y-4">
            <div><label className="text-sm text-gray-600">Title</label><Input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} /></div>
            <div><label className="text-sm text-gray-600">Type</label><Select value={form.type} onValueChange={v => setForm(p => ({ ...p, type: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{['CBC_ENGLISH','CBC_MATH','CBC_SCIENCE','CBC_KISWAHILI','CODING_SCRATCH','CODING_WEB_DEV','CODING_AI_FOR_KIDS','CODING_PYTHON','ROBOTICS_BASIC','OTHER'].map(t => <SelectItem key={t} value={t}>{t.replace(/_/g, ' ')}</SelectItem>)}</SelectContent></Select></div>
            <div><label className="text-sm text-gray-600">Grade Level</label><select value={form.gradeLevel} onChange={e => setForm(p => ({ ...p, gradeLevel: e.target.value }))} className="w-full h-10 px-3 border border-slate-200 rounded-xl text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"><option value="">Select grade</option>{GRADES.map(g => <option key={g} value={g}>{g}</option>)}</select></div>
            <div><label className="text-sm text-gray-600">Difficulty</label><Select value={form.difficulty} onValueChange={v => setForm(p => ({ ...p, difficulty: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{['EASY','MEDIUM','HARD','EXPERT'].map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent></Select></div>
            <div><label className="text-sm text-gray-600">Duration</label><Input value={form.duration} onChange={e => setForm(p => ({ ...p, duration: e.target.value }))} placeholder="e.g. 12 weeks" /></div>
            <div><label className="text-sm text-gray-600">Description</label><textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={3} className="w-full p-3 border rounded-lg" /></div>
          </DialogBody>
          <DialogFooter>
            <Button onClick={handleSave} disabled={saving} className="w-full bg-gradient-to-r from-blue-600 to-purple-600 px-5 py-2.5 text-sm font-medium">
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null} {editingCourse ? 'Update Course' : 'Create Course'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
