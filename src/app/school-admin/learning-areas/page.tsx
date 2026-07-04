'use client'

import { useEffect, useMemo, useState } from 'react'
import { BookOpen, CheckCircle, Loader2, Plus, Search, ToggleLeft, ToggleRight, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'

interface LearningArea {
  id: string
  name: string
  description?: string | null
  isActive: boolean
  createdAt: string
}

export default function LearningAreasPage() {
  const [areas, setAreas] = useState<LearningArea[]>([])
  const [catalogSubjects, setCatalogSubjects] = useState<string[]>([])
  const [stats, setStats] = useState({ active: 0, inactive: 0, teacherCount: 0, studentCount: 0 })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [form, setForm] = useState({ name: '', description: '' })
  const [message, setMessage] = useState('')

  const fetchAreas = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/school-admin/learning-areas')
      const data = await response.json()
      if (response.ok) {
        setAreas(data.learningAreas || [])
        setCatalogSubjects(data.catalogSubjects || [])
        setStats(data.stats || stats)
      } else {
        setMessage(data.error || 'Failed to load learning areas')
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAreas()
  }, [])

  const filteredAreas = useMemo(() => {
    const term = search.toLowerCase()
    return areas.filter(area =>
      area.name.toLowerCase().includes(term) ||
      (area.description || '').toLowerCase().includes(term)
    )
  }, [areas, search])

  const suggestedSubjects = useMemo(() => {
    const existing = new Set(areas.map(area => area.name.toLowerCase()))
    return catalogSubjects.filter(subject => !existing.has(subject.toLowerCase())).slice(0, 12)
  }, [areas, catalogSubjects])

  const createArea = async (name = form.name, description = form.description) => {
    const cleanName = name.trim()
    if (!cleanName) return

    setSaving(true)
    setMessage('')
    try {
      const response = await fetch('/api/school-admin/learning-areas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: cleanName, description })
      })
      const data = await response.json()
      if (response.ok) {
        setForm({ name: '', description: '' })
        setMessage('Learning area added.')
        await fetchAreas()
      } else {
        setMessage(data.error || 'Could not add learning area')
      }
    } finally {
      setSaving(false)
    }
  }

  const toggleArea = async (area: LearningArea) => {
    await fetch('/api/school-admin/learning-areas', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: area.id, isActive: !area.isActive })
    })
    await fetchAreas()
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold edugenius-text-gradient-blue">Learning Areas</h1>
          <p className="text-gray-600 mt-1">Manage the subjects your school teaches and reports on.</p>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-lg bg-white p-3 shadow-sm">
            <div className="text-2xl font-bold text-green-700">{stats.active}</div>
            <div className="text-xs text-gray-500">Active</div>
          </div>
          <div className="rounded-lg bg-white p-3 shadow-sm">
            <div className="text-2xl font-bold text-gray-700">{stats.inactive}</div>
            <div className="text-xs text-gray-500">Inactive</div>
          </div>
          <div className="rounded-lg bg-white p-3 shadow-sm">
            <div className="text-2xl font-bold text-blue-700">{stats.teacherCount}</div>
            <div className="text-xs text-gray-500">Teachers</div>
          </div>
          <div className="rounded-lg bg-white p-3 shadow-sm">
            <div className="text-2xl font-bold text-purple-700">{stats.studentCount}</div>
            <div className="text-xs text-gray-500">Students</div>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Add Learning Area
          </CardTitle>
          <CardDescription>Create the subjects teachers will plan lessons and schemes against.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-[1fr_2fr_auto]">
            <Input placeholder="Learning area name" value={form.name} onChange={event => setForm(prev => ({ ...prev, name: event.target.value }))} />
            <Textarea className="min-h-10" placeholder="Description or coverage notes" value={form.description} onChange={event => setForm(prev => ({ ...prev, description: event.target.value }))} />
            <Button onClick={() => createArea()} disabled={saving || !form.name.trim()}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
              Add
            </Button>
          </div>
          {suggestedSubjects.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {suggestedSubjects.map(subject => (
                <Button key={subject} variant="outline" size="sm" onClick={() => createArea(subject)}>
                  {subject}
                </Button>
              ))}
            </div>
          )}
          {message && <p className="text-sm text-gray-600">{message}</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                School Learning Areas
              </CardTitle>
              <CardDescription>{filteredAreas.length} area{filteredAreas.length === 1 ? '' : 's'} shown</CardDescription>
            </div>
            <div className="relative md:w-80">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input className="pl-9" placeholder="Search learning areas" value={search} onChange={event => setSearch(event.target.value)} />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-10"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>
          ) : filteredAreas.length ? (
            <div className="grid gap-3 lg:grid-cols-2">
              {filteredAreas.map(area => (
                <div key={area.id} className="rounded-lg border bg-white p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold text-gray-900">{area.name}</h3>
                      <p className="mt-1 text-sm text-gray-600">{area.description || 'No description yet.'}</p>
                    </div>
                    <Badge className={area.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'}>
                      {area.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
                    <span className="flex items-center gap-1"><Users className="h-4 w-4" /> Available for planning</span>
                    <Button variant="outline" size="sm" onClick={() => toggleArea(area)}>
                      {area.isActive ? <ToggleRight className="mr-2 h-4 w-4" /> : <ToggleLeft className="mr-2 h-4 w-4" />}
                      {area.isActive ? 'Deactivate' : 'Activate'}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-gray-500">
              <CheckCircle className="mx-auto mb-3 h-10 w-10 text-gray-300" />
              No learning areas found.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
