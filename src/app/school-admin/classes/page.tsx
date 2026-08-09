"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogBody, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, School, Plus, Search, Edit, Trash2, Users, BookOpen, GraduationCap, MoreHorizontal } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { confirmToast } from '@/lib/confirm-toast'

const SUBJECTS = ['Mathematics','English','Kiswahili','Science','Social Studies','CRE','IRE','Agriculture','Physics','Chemistry','Biology','History','Geography','Business Studies','Computer Studies','Home Science','Art & Design']
const GRADES = ['Grade 1','Grade 2','Grade 3','Grade 4','Grade 5','Grade 6','Grade 7','Grade 8','Grade 9','Form 1','Form 2','Form 3','Form 4']

interface ClassRecord {
  id: string; name: string; subject: string; grade: string
  description?: string; isActive: boolean
  studentCount: number
  teacherName: string
  teacherId: string | null
  createdAt: string
}

export default function SchoolAdminClassesPage() {
  const [classes, setClasses] = useState<ClassRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [showDialog, setShowDialog] = useState(false)
  const [editing, setEditing] = useState<ClassRecord | null>(null)
  const [teachers, setTeachers] = useState<{ id: string; name: string }[]>([])
  const { toast } = useToast()

  // Form
  const [name, setName] = useState(""); const [subject, setSubject] = useState("")
  const [grade, setGrade] = useState(""); const [teacherId, setTeacherId] = useState("")
  const [saving, setSaving] = useState(false)

  useEffect(() => { fetchClasses(); fetchTeachers() }, [])

  const fetchClasses = async () => {
    try {
      const res = await fetch('/api/school-admin/classes?limit=100')
      if (res.ok) {
        const data = await res.json()
        setClasses(data.classes || [])
      }
    } catch (e) { console.warn('[SchoolAdminClasses] fetchClasses error:', e) } finally { setLoading(false) }
  }

  const fetchTeachers = async () => {
    try {
      const res = await fetch('/api/school-admin/teachers?limit=100')
      if (res.ok) {
        const data = await res.json()
        setTeachers((data.teachers || []).map((t: any) => ({ id: t.id, name: t.name })))
      }
    } catch (e) { console.warn('[SchoolAdminClasses] fetchTeachers error:', e) }
  }

  const openCreate = () => {
    setEditing(null); setName(''); setSubject(''); setGrade(''); setTeacherId('')
    setShowDialog(true)
  }

  const openEdit = (c: ClassRecord) => {
    setEditing(c); setName(c.name); setSubject(c.subject); setGrade(c.grade)
    setTeacherId(c.teacherId || '')
    setShowDialog(true)
  }

  const handleSave = async () => {
    if (!name || !subject || !grade) return
    setSaving(true)
    try {
      const url = editing ? `/api/school-admin/classes/${editing.id}` : '/api/school-admin/classes'
      const method = editing ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, subject, grade, teacherId: teacherId || undefined, description: '' })
      })
      if (res.ok) {
        toast({ title: editing ? 'Class updated' : 'Class created' })
        setShowDialog(false); fetchClasses()
      } else {
        const err = await res.json()
        toast({ title: 'Error', description: err.error })
      }
    } catch (e) { console.warn('[SchoolAdminClasses] handleSave error:', e) } finally { setSaving(false) }
  }

  const handleDelete = async (id: string) => {
    if (!(await confirmToast({ title: 'Delete this class?' }))) return
    try {
      const res = await fetch(`/api/school-admin/classes/${id}`, { method: 'DELETE' })
      if (res.ok) { toast({ title: 'Deleted' }); fetchClasses() }
    } catch (e) { console.warn('[SchoolAdminClasses] handleDelete error:', e) }
  }

  const filtered = classes.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.subject.toLowerCase().includes(search.toLowerCase()) ||
    c.grade.includes(search)
  )

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><School className="w-6 h-6 text-blue-600" /> Class Management</h1>
          <p className="text-sm text-gray-600">Create and manage classes</p>
        </div>
        <Button onClick={openCreate} className="bg-gradient-to-r from-blue-600 to-purple-600"><Plus className="w-4 h-4 mr-2" /> Create Class</Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search classes..." className="pl-10" />
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-gray-500">No classes yet</CardContent></Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map(c => (
            <Card key={c.id} className="border-0 shadow hover:shadow-lg transition-shadow">
              <CardContent className="p-5 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                    <School className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" onClick={() => openEdit(c)}><Edit className="w-4 h-4" /></Button>
                    <Button size="sm" variant="ghost" className="text-red-600" onClick={() => handleDelete(c.id)}><Trash2 className="w-4 h-4" /></Button>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold">{c.name}</h3>
                  <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                    <Badge variant="outline"><BookOpen className="w-3 h-3 mr-1" />{c.subject}</Badge>
                    <Badge variant="outline"><GraduationCap className="w-3 h-3 mr-1" />{c.grade}</Badge>
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span className="flex items-center"><Users className="w-4 h-4 mr-1" />{c.studentCount} students</span>
                  <span>{c.teacherName || 'No teacher'}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="bg-white max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Class' : 'Create Class'}</DialogTitle>
          </DialogHeader>
          <DialogBody className="space-y-4">
            <div><label className="text-sm text-gray-600">Class Name</label><Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Grade 7A" /></div>
            <div><label className="text-sm text-gray-600">Subject</label><select value={subject} onChange={e => setSubject(e.target.value)} className="w-full h-10 px-3 border border-slate-200 rounded-xl text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"><option value="">Select subject</option>{SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
            <div><label className="text-sm text-gray-600">Grade</label><select value={grade} onChange={e => setGrade(e.target.value)} className="w-full h-10 px-3 border border-slate-200 rounded-xl text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"><option value="">Select grade</option>{GRADES.map(g => <option key={g} value={g}>{g}</option>)}</select></div>
            <div><label className="text-sm text-gray-600">Teacher (optional)</label>
              <Select value={teacherId} onValueChange={setTeacherId}>
                <SelectTrigger><SelectValue placeholder="Select teacher" /></SelectTrigger>
                <SelectContent>
                  {teachers.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </DialogBody>
          <DialogFooter>
            <Button onClick={handleSave} disabled={saving} className="w-full bg-gradient-to-r from-blue-600 to-purple-600 px-5 py-2.5 text-sm font-medium">
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              {editing ? 'Update' : 'Create'} Class
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
