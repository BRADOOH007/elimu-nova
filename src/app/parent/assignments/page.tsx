"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Suspense } from "react"
import { ClipboardList, Calendar, User, CheckCircle, Clock, AlertCircle, Search, Filter } from "lucide-react"

interface Child { id: string; name: string }

interface Assignment {
  id: string; title: string; subject: string; dueDate: string
  teacherName: string; studentName: string; studentId: string
  status: "PENDING" | "SUBMITTED" | "GRADED" | "OVERDUE"
  grade?: number | null
}

function AssignmentsContent() {
  const searchParams = useSearchParams()
  const preselectedId = searchParams.get("studentId") || ""

  const [children, setChildren] = useState<Child[]>([])
  const [selectedId, setSelectedId] = useState(preselectedId || "all")
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState<"all" | "PENDING" | "SUBMITTED" | "GRADED" | "OVERDUE">("all")

  useEffect(() => {
    fetch("/api/parent/children")
      .then(r => r.json())
      .then(({ children: raw }) => {
        setChildren(raw.map((c: any) => ({ id: c.id, name: `${c.user.firstName} ${c.user.lastName}` })))
        if (preselectedId) setSelectedId(preselectedId)
      })
      .catch(console.error)
  }, [])

  useEffect(() => {
    setLoading(true)
    const url = selectedId !== "all"
      ? `/api/parent/assignments?studentId=${selectedId}`
      : "/api/parent/assignments"
    fetch(url)
      .then(r => r.json())
      .then(({ assignments: raw }) => {
        const now = new Date()
        setAssignments((raw || []).map((a: any) => {
          const sub = a.submissions?.[0]
          const due = new Date(a.dueDate)
          let status: Assignment["status"] = "PENDING"
          if (sub?.status === "GRADED") status = "GRADED"
          else if (sub?.status === "SUBMITTED" || sub?.status === "PENDING") status = "SUBMITTED"
          else if (due < now) status = "OVERDUE"

          const studentSub = a.submissions?.[0]
          const studentName = studentSub?.student
            ? `${studentSub.student.user.firstName} ${studentSub.student.user.lastName}`
            : children.find(c => c.id === selectedId)?.name || ""

          return {
            id: a.id, title: a.title, subject: a.subject || "General",
            dueDate: a.dueDate,
            teacherName: a.teacher?.user ? `${a.teacher.user.firstName} ${a.teacher.user.lastName}` : "Teacher",
            studentName, studentId: studentSub?.studentId || "",
            status, grade: sub?.grade ?? null,
          }
        }))
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [selectedId])

  const filtered = assignments.filter(a => {
    const matchSearch = !search || a.title.toLowerCase().includes(search.toLowerCase()) || a.subject.toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === "all" || a.status === filter
    return matchSearch && matchFilter
  })

  const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
    PENDING:   { label: "Pending",   color: "bg-amber-50 text-amber-700 border-amber-200",  icon: Clock },
    SUBMITTED: { label: "Submitted", color: "bg-blue-50 text-blue-700 border-blue-200",     icon: ClipboardList },
    GRADED:    { label: "Graded",    color: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: CheckCircle },
    OVERDUE:   { label: "Overdue",   color: "bg-red-50 text-red-700 border-red-200",        icon: AlertCircle },
  }

  const counts = {
    all:       assignments.length,
    PENDING:   assignments.filter(a => a.status === "PENDING").length,
    OVERDUE:   assignments.filter(a => a.status === "OVERDUE").length,
    SUBMITTED: assignments.filter(a => a.status === "SUBMITTED").length,
    GRADED:    assignments.filter(a => a.status === "GRADED").length,
  }

  return (
    <div className="p-6 space-y-5 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Assignments</h1>
          <p className="text-sm text-slate-500 mt-0.5">Track your children&apos;s homework and assessments</p>
        </div>
        {children.length > 0 && (
          <select
            value={selectedId}
            onChange={e => setSelectedId(e.target.value)}
            className="text-sm border border-slate-200 rounded-lg px-3.5 py-2.5 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
          >
            <option value="all">All children</option>
            {children.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        )}
      </div>

      {/* Filter pills */}
      <div className="flex flex-wrap gap-2">
        {(["all", "PENDING", "OVERDUE", "SUBMITTED", "GRADED"] as const).map(key => (
          <button key={key} onClick={() => setFilter(key)}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
              filter === key
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            {key === "all" ? "All" : key.charAt(0) + key.slice(1).toLowerCase()}
            <span className={`ml-1.5 text-[10px] ${filter === key ? "text-blue-200" : "text-slate-400"}`}>({counts[key]})</span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search assignments..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full h-11 pl-10 pr-4 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
        />
      </div>

      {loading ? (
        <div className="space-y-3 animate-pulse">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-white border border-slate-200/80 rounded-xl p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-2/5 bg-slate-200 rounded" />
                  <div className="h-3 w-3/4 bg-slate-200 rounded" />
                  <div className="flex items-center gap-3">
                    <div className="h-3 w-24 bg-slate-200 rounded" />
                    <div className="h-3 w-20 bg-slate-200 rounded" />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-5 w-16 bg-slate-200 rounded-full" />
                  <div className="h-5 w-10 bg-slate-200 rounded-full" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-slate-200/80 shadow-sm">
          <div className="w-14 h-14 rounded-xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
            <ClipboardList className="h-7 w-7 text-slate-400" />
          </div>
          <p className="text-slate-500 font-medium">No assignments found</p>
          <p className="text-slate-400 text-sm mt-1">Try adjusting your filters or search</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(a => {
            const cfg = statusConfig[a.status]
            const StatusIcon = cfg.icon
            const isOverdue = a.status === "OVERDUE"
            const g = a.grade ?? 0
            const gradeColor = g >= 70 ? "text-emerald-600" : g >= 40 ? "text-amber-600" : "text-red-600"
            return (
              <div key={a.id} className={`bg-white border rounded-xl p-4.5 hover:shadow-md transition-all ${
                isOverdue ? "border-red-200 shadow-sm" : "border-slate-200/80 shadow-sm"
              }`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-slate-800 text-sm">{a.title}</h3>
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-[11px] font-semibold ${cfg.color}`}>
                        <StatusIcon className="h-3 w-3" />
                        {cfg.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-2 text-xs text-slate-500 flex-wrap">
                      <span className="bg-slate-100 px-2 py-0.5 rounded-full font-medium">{a.subject}</span>
                      <span className="flex items-center gap-1"><User className="h-3 w-3" />{a.studentName}</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(a.dueDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                      </span>
                    </div>
                  </div>
                  {a.status === "GRADED" && a.grade != null && (
                    <div className={`text-right shrink-0 ${gradeColor}`}>
                      <p className="text-xl font-bold">{Math.round(a.grade ?? 0)}%</p>
                      <p className="text-[10px] font-medium">grade</p>
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
    <Suspense fallback={
      <div className="flex items-center justify-center py-24">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <AssignmentsContent />
    </Suspense>
  )
}
