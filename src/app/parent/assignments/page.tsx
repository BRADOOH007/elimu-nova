'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { ClipboardList, Calendar, User, CheckCircle, Clock, AlertCircle, Search } from 'lucide-react'

interface Child { id: string; name: string }

interface Assignment {
  id: string
  title: string
  subject: string
  dueDate: string
  teacherName: string
  studentName: string
  studentId: string
  status: 'PENDING' | 'SUBMITTED' | 'GRADED' | 'OVERDUE'
  grade?: number | null
}

function AssignmentsContent() {
  const searchParams = useSearchParams()
  const preselectedId = searchParams.get('studentId') || ''

  const [children, setChildren] = useState<Child[]>([])
  const [selectedId, setSelectedId] = useState(preselectedId || 'all')
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'PENDING' | 'SUBMITTED' | 'GRADED' | 'OVERDUE'>('all')

  useEffect(() => {
    fetch('/api/parent/children')
      .then(r => r.json())
      .then(({ children: raw }) => {
        setChildren(raw.map((c: any) => ({ id: c.id, name: `${c.user.firstName} ${c.user.lastName}` })))
        if (preselectedId) setSelectedId(preselectedId)
      })
      .catch(console.error)
  }, [])

  useEffect(() => {
    setLoading(true)
    const url = selectedId !== 'all'
      ? `/api/parent/assignments?studentId=${selectedId}`
      : '/api/parent/assignments'
    fetch(url)
      .then(r => r.json())
      .then(({ assignments: raw }) => {
        const now = new Date()
        setAssignments((raw || []).map((a: any) => {
          const sub = a.submissions?.[0]
          const due = new Date(a.dueDate)
          let status: Assignment['status'] = 'PENDING'
          if (sub?.status === 'GRADED') status = 'GRADED'
          else if (sub?.status === 'SUBMITTED' || sub?.status === 'PENDING') status = 'SUBMITTED'
          else if (due < now) status = 'OVERDUE'

          // Find which student this is for
          const studentSub = a.submissions?.[0]
          const studentName = studentSub?.student
            ? `${studentSub.student.user.firstName} ${studentSub.student.user.lastName}`
            : children.find(c => c.id === selectedId)?.name || ''

          return {
            id:          a.id,
            title:       a.title,
            subject:     a.subject || 'General',
            dueDate:     a.dueDate,
            teacherName: a.teacher?.user ? `${a.teacher.user.firstName} ${a.teacher.user.lastName}` : 'Teacher',
            studentName,
            studentId:   studentSub?.studentId || '',
            status,
            grade:       sub?.grade ?? null,
          }
        }))
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [selectedId])

  const filtered = assignments.filter(a => {
    const matchSearch = !search || a.title.toLowerCase().includes(search.toLowerCase()) || a.subject.toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === 'all' || a.status === filter
    return matchSearch && matchFilter
  })

  const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
    PENDING:   { label: 'Pending',   color: 'bg-amber-100 text-amber-700 border-amber-200',  icon: Clock        },
    SUBMITTED: { label: 'Submitted', color: 'bg-blue-100 text-blue-700 border-blue-200',     icon: ClipboardList },
    GRADED:    { label: 'Graded',    color: 'bg-green-100 text-green-700 border-green-200',  icon: CheckCircle  },
    OVERDUE:   { label: 'Overdue',   color: 'bg-red-100 text-red-700 border-red-200',        icon: AlertCircle  },
  }

  const counts = {
    all:       assignments.length,
    PENDING:   assignments.filter(a => a.status === 'PENDING').length,
    OVERDUE:   assignments.filter(a => a.status === 'OVERDUE').length,
    SUBMITTED: assignments.filter(a => a.status === 'SUBMITTED').length,
    GRADED:    assignments.filter(a => a.status === 'GRADED').length,
  }

  return (
    <div className="p-6 space-y-5 max-w-5xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Assignments</h1>
          <p className="text-slate-500 text-sm mt-0.5">Track your children's homework and assessments</p>
        </div>
        {children.length > 0 && (
          <select
            value={selectedId}
            onChange={e => setSelectedId(e.target.value)}
            className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All children</option>
            {children.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        )}
      </div>

      {/* Summary */}
      <div className="grid grid-cols-4 gap-3">
        {(['all', 'PENDING', 'OVERDUE', 'GRADED'] as const).map(key => (
          <button
            key={key}
            onClick={() => setFilter(key === 'all' ? 'all' : key)}
            className={`rounded-xl border p-3 text-center transition-all ${filter === key ? 'border-blue-500 bg-blue-50' : 'border-slate-200 bg-white hover:bg-slate-50'}`}
          >
            <p className="text-xl font-bold text-slate-800">{counts[key]}</p>
            <p className="text-xs text-slate-500 capitalize">{key === 'all' ? 'Total' : key.toLowerCase()}</p>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search assignments..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full h-10 pl-9 pr-4 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
          <ClipboardList className="h-12 w-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 text-sm">No assignments found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(a => {
            const cfg = statusConfig[a.status]
            const StatusIcon = cfg.icon
            const isOverdue = a.status === 'OVERDUE'
            return (
              <div key={a.id} className={`bg-white border rounded-2xl p-4 ${isOverdue ? 'border-red-200' : 'border-slate-200'}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-slate-800 text-sm">{a.title}</h3>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[11px] font-medium ${cfg.color}`}>
                        <StatusIcon className="h-3 w-3" />
                        {cfg.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 mt-1.5 text-xs text-slate-500 flex-wrap">
                      <span className="bg-slate-100 px-2 py-0.5 rounded-full">{a.subject}</span>
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" /> {a.studentName}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Due: {new Date(a.dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                  </div>
                  {a.status === 'GRADED' && a.grade !== null && a.grade !== undefined && (
                    <div className="text-right shrink-0">
                      <p className="text-xl font-bold text-green-600">{Math.round(a.grade)}%</p>
                      <p className="text-xs text-slate-400">grade</p>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default function ParentAssignments() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>}>
      <AssignmentsContent />
    </Suspense>
  )
}
