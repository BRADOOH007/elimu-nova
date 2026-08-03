'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Plus, Edit2, Trash2, Building2, Users, BookOpen } from 'lucide-react'

interface DistrictSchool {
  id: string
  name: string
  isActive: boolean
  _count: { teachers: number; students: number; classes: number }
}

interface District {
  id: string
  name: string
  code: string | null
  address: string | null
  phone: string | null
  email: string | null
  isActive: boolean
  createdAt: string
  schoolCount: number
  totalTeachers: number
  totalStudents: number
  totalClasses: number
  schools: DistrictSchool[]
}

interface DistrictForm {
  name: string
  code: string
  address: string
  phone: string
  email: string
}

const emptyForm: DistrictForm = { name: '', code: '', address: '', phone: '', email: '' }

export default function DistrictsPage() {
  const [districts, setDistricts] = useState<District[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<DistrictForm>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [assignDialogOpen, setAssignDialogOpen] = useState(false)
  const [assignDistrictId, setAssignDistrictId] = useState<string | null>(null)
  const [allSchools, setAllSchools] = useState<{ id: string; name: string; districtId: string | null }[]>([])

  const fetchDistricts = useCallback(async () => {
    try {
      const res = await fetch('/api/super-admin/districts')
      if (res.ok) {
        setDistricts(await res.json())
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchDistricts() }, [fetchDistricts])

  const openCreate = () => {
    setEditingId(null)
    setForm(emptyForm)
    setDialogOpen(true)
  }

  const openEdit = (d: District) => {
    setEditingId(d.id)
    setForm({ name: d.name, code: d.code || '', address: d.address || '', phone: d.phone || '', email: d.email || '' })
    setDialogOpen(true)
  }

  const save = async () => {
    setSaving(true)
    try {
      const method = editingId ? 'PATCH' : 'POST'
      const url = editingId ? `/api/super-admin/districts/${editingId}` : '/api/super-admin/districts'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        setDialogOpen(false)
        fetchDistricts()
      }
    } finally {
      setSaving(false)
    }
  }

  const deleteDistrict = async (id: string) => {
    if (!confirm('Delete this district? Schools will be unlinked, not deleted.')) return
    const res = await fetch(`/api/super-admin/districts/${id}`, { method: 'DELETE' })
    if (res.ok) fetchDistricts()
  }

  const openAssign = async (districtId: string) => {
    setAssignDistrictId(districtId)
    const res = await fetch('/api/super-admin/schools')
    if (res.ok) {
      const data = await res.json()
      setAllSchools(data.map((s: any) => ({ id: s.id, name: s.name, districtId: s.districtId || null })))
    }
    setAssignDialogOpen(true)
  }

  const assignSchool = async (schoolId: string, newDistrictId: string | null) => {
    await fetch(`/api/super-admin/schools/${schoolId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ districtId: newDistrictId }),
    })
    fetchDistricts()
    if (assignDistrictId) openAssign(assignDistrictId)
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Districts</h1>
          <p className="text-muted-foreground">Group schools by geographic or administrative district</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" /> New District
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Loading...</div>
      ) : districts.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Building2 className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
            <p className="text-muted-foreground">No districts yet. Create one to start grouping schools.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {districts.map((d) => (
            <Card key={d.id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{d.name}</CardTitle>
                    {d.code && <p className="text-sm text-muted-foreground">Code: {d.code}</p>}
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => openEdit(d)}>
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => deleteDistrict(d.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2 rounded-lg bg-muted/50">
                    <div className="text-lg font-bold">{d.schoolCount}</div>
                    <div className="text-xs text-muted-foreground">Schools</div>
                  </div>
                  <div className="p-2 rounded-lg bg-muted/50">
                    <div className="text-lg font-bold">{d.totalTeachers}</div>
                    <div className="text-xs text-muted-foreground">Teachers</div>
                  </div>
                  <div className="p-2 rounded-lg bg-muted/50">
                    <div className="text-lg font-bold">{d.totalStudents}</div>
                    <div className="text-xs text-muted-foreground">Students</div>
                  </div>
                </div>

                {d.schools.length > 0 && (
                  <div className="space-y-1">
                    {d.schools.map((s) => (
                      <div key={s.id} className="flex items-center justify-between text-sm p-1.5 rounded bg-muted/30">
                        <span>{s.name}</span>
                        <Badge variant={s.isActive ? 'default' : 'secondary'} className="text-xs">
                          {s._count.students} students
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}

                <Button variant="outline" size="sm" className="w-full" onClick={() => openAssign(d.id)}>
                  <Plus className="h-3 w-3 mr-1" /> Assign Schools
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit District' : 'New District'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Nairobi County" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Code</Label>
                <Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="e.g. NBI" />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+254..." />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Address</Label>
              <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={save} disabled={saving || !form.name.trim()}>
              {saving ? 'Saving...' : editingId ? 'Update' : 'Create'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Assign Schools to District</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 max-h-80 overflow-y-auto py-2">
            {allSchools.length === 0 ? (
              <p className="text-muted-foreground text-sm">No schools found.</p>
            ) : (
              allSchools.map((s) => (
                <div key={s.id} className="flex items-center justify-between p-2 rounded border">
                  <span className="text-sm">{s.name}</span>
                  {s.districtId === assignDistrictId ? (
                    <Button variant="ghost" size="sm" onClick={() => assignSchool(s.id, null)}>
                      Remove
                    </Button>
                  ) : (
                    <Button variant="outline" size="sm" onClick={() => assignSchool(s.id, assignDistrictId)}>
                      Assign
                    </Button>
                  )}
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
