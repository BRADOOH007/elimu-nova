"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, BookOpen, Plus, Search, Edit, Trash2, ChevronRight, ChevronDown, GraduationCap } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Curriculum {
  id: string; name: string; type: string; grade: string
  isActive: boolean; description?: string
  strands?: CurriculumStrand[]
  _count?: { strands: number; courses: number }
}

interface CurriculumStrand {
  id: string; name: string; description?: string; order: number
  subStrands?: CurriculumSubstrand[]
}

interface CurriculumSubstrand {
  id: string; name: string; description?: string; order: number
  lessons?: any[]
}

export default function CurriculumManagementPage() {
  const [curriculums, setCurriculums] = useState<Curriculum[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [showDialog, setShowDialog] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const { toast } = useToast()

  const [name, setName] = useState(""); const [type, setType] = useState("CBC"); const [grade, setGrade] = useState(""); const [description, setDescription] = useState("")
  const [saving, setSaving] = useState(false)

  useEffect(() => { fetchCurriculums() }, [])

  const fetchCurriculums = async () => {
    try {
      const res = await fetch('/api/curriculums')
      if (res.ok) setCurriculums((await res.json()).curriculums || (await res.json()) || [])
    } catch {} finally { setLoading(false) }
  }

  const handleCreate = async () => {
    if (!name || !grade) return
    setSaving(true)
    try {
      const res = await fetch('/api/curriculums', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, type, grade, description })
      })
      if (res.ok) { toast({ title: 'Curriculum created' }); setShowDialog(false); fetchCurriculums(); setName(''); setGrade(''); setDescription('') }
      else toast({ title: 'Error', variant: 'destructive' })
    } catch {} finally { setSaving(false) }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this curriculum?')) return
    try {
      await fetch(`/api/curriculums/${id}`, { method: 'DELETE' })
      toast({ title: 'Deleted' }); fetchCurriculums()
    } catch {}
  }

  const filtered = curriculums.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) || c.grade.includes(search)
  )

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><BookOpen className="w-6 h-6 text-blue-600" /> Curriculum Management</h1>
          <p className="text-sm text-gray-600">Manage curricula, strands, and learning outcomes</p>
        </div>
        <Button onClick={() => setShowDialog(true)} className="bg-gradient-to-r from-blue-600 to-purple-600"><Plus className="w-4 h-4 mr-2" /> Add Curriculum</Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." className="pl-10" />
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-gray-500">No curricula found</CardContent></Card>
      ) : (
        <div className="space-y-3">
          {filtered.map(c => (
            <Card key={c.id} className="border-0 shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1 cursor-pointer" onClick={() => setExpandedId(expandedId === c.id ? null : c.id)}>
                    {expandedId === c.id ? <ChevronDown className="w-5 h-5 text-gray-400" /> : <ChevronRight className="w-5 h-5 text-gray-400" />}
                    <div>
                      <h3 className="font-semibold">{c.name}</h3>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Badge variant="outline">{c.type}</Badge>
                        <Badge variant="outline"><GraduationCap className="w-3 h-3 mr-1" />{c.grade}</Badge>
                        {c._count && <span>{c._count.strands || 0} strands · {c._count.courses || 0} courses</span>}
                      </div>
                    </div>
                  </div>
                  <Badge variant={c.isActive ? 'default' : 'secondary'}>{c.isActive ? 'Active' : 'Inactive'}</Badge>
                  <Button size="sm" variant="ghost" className="text-red-600 ml-2" onClick={() => handleDelete(c.id)}><Trash2 className="w-4 h-4" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="bg-white max-w-md">
          <DialogHeader><DialogTitle>Add Curriculum</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><label className="text-sm text-gray-600">Name</label><Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. CBC Grade 7" /></div>
            <div><label className="text-sm text-gray-600">Type</label><Select value={type} onValueChange={setType}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{['CBC','CAMBRIDGE','IGCSE','IB','OTHER'].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select></div>
            <div><label className="text-sm text-gray-600">Grade</label><Input value={grade} onChange={e => setGrade(e.target.value)} placeholder="e.g. Grade 7" /></div>
            <div><label className="text-sm text-gray-600">Description</label><textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} className="w-full p-3 border rounded-lg" /></div>
            <Button onClick={handleCreate} disabled={saving} className="w-full bg-gradient-to-r from-blue-600 to-purple-600">Create</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
