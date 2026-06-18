'use client'

import { useEffect, useState } from 'react'
import { Users, TrendingUp, Calendar, BookOpen, ClipboardList, Brain, RefreshCw } from 'lucide-react'
import Link from 'next/link'

interface Child {
  id: string
  name: string
  initials: string
  grade: string
  school: string
  subject: string
  averageGrade: number | null
  pendingAssignments: number
  completedAssignments: number
  streakDays: number
  totalStudyTime: number
}

export default function ParentChildren() {
  const [children, setChildren] = useState<Child[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchChildren = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/parent/children')
      if (!res.ok) throw new Error('Failed to fetch')
      const { children: raw } = await res.json()
      setChildren(raw.map((c: any) => {
        const first = c.user.firstName
        const last  = c.user.lastName
        return {
          id:                   c.id,
          name:                 `${first} ${last}`,
          initials:             `${first[0]}${last[0]}`.toUpperCase(),
          grade:                c.class?.grade || 'N/A',
          school:               c.school?.name || 'ElimuNova',
          subject:              c.class?.subject || 'General',
          averageGrade:         c.analytics?.averageGrade ?? null,
          pendingAssignments:   c.analytics?.pendingAssignments ?? 0,
          completedAssignments: c.analytics?.completedAssignments ?? 0,
          streakDays:           c.analytics?.streakDays ?? 0,
          totalStudyTime:       c.analytics?.totalStudyTime ?? 0,
        }
      }))
    } catch (e) {
      setError('Could not load children. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchChildren() }, [])

  const gradeColor = (g: number | null) => {
    if (g === null) return 'text-slate-400'
    if (g >= 75) return 'text-green-600'
    if (g >= 60) return 'text-amber-600'
    return 'text-red-600'
  }

  const gradeLabel = (g: number | null) => {
    if (g === null) return '—'
    if (g >= 75) return 'On track'
    if (g >= 60) return 'Needs focus'
    return 'Needs support'
  }

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Children</h1>
          <p className="text-slate-500 text-sm mt-0.5">Linked student accounts and their overview</p>
        </div>
        <button
          onClick={fetchChildren}
          className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
          title="Refresh"
        >
          <RefreshCw className="h-4 w-4 text-slate-500" />
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : error ? (
        <div className="text-center py-16">
          <p className="text-red-500 text-sm">{error}</p>
          <button onClick={fetchChildren} className="mt-3 text-blue-600 text-sm hover:underline">Try again</button>
        </div>
      ) : children.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-slate-200">
          <Users className="h-14 w-14 text-slate-300 mx-auto mb-4" />
          <h3 className="text-slate-700 font-semibold mb-2">No children linked</h3>
          <p className="text-slate-500 text-sm max-w-xs mx-auto">
            Ask your child's school administrator to link your account to your child's profile.
          </p>
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          {children.map(child => (
            <div key={child.id} className="bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-md transition-all">
              {/* Header */}
              <div className="flex items-center gap-4 mb-5">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shrink-0">
                  {child.initials}
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-slate-900 text-lg leading-tight">{child.name}</h3>
                  <p className="text-slate-500 text-sm">{child.grade} · {child.school}</p>
                </div>
                <div className="ml-auto text-right">
                  <p className={`text-2xl font-bold ${gradeColor(child.averageGrade)}`}>
                    {child.averageGrade !== null ? `${Math.round(child.averageGrade)}%` : '—'}
                  </p>
                  <p className={`text-xs font-medium ${gradeColor(child.averageGrade)}`}>
                    {gradeLabel(child.averageGrade)}
                  </p>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3 mb-5">
                <div className="text-center p-3 bg-slate-50 rounded-xl">
                  <ClipboardList className="h-4 w-4 text-blue-500 mx-auto mb-1" />
                  <p className="text-lg font-bold text-slate-800">{child.completedAssignments}</p>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wide">Done</p>
                </div>
                <div className="text-center p-3 bg-slate-50 rounded-xl">
                  <Calendar className="h-4 w-4 text-amber-500 mx-auto mb-1" />
                  <p className="text-lg font-bold text-slate-800">{child.pendingAssignments}</p>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wide">Pending</p>
                </div>
                <div className="text-center p-3 bg-slate-50 rounded-xl">
                  <Brain className="h-4 w-4 text-purple-500 mx-auto mb-1" />
                  <p className="text-lg font-bold text-slate-800">{child.streakDays}</p>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wide">Streak</p>
                </div>
              </div>

              {/* Actions */}
              <div className="grid grid-cols-2 gap-2">
                <Link href={`/parent/progress?studentId=${child.id}`}>
                  <button className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-blue-50 text-blue-700 text-sm font-medium hover:bg-blue-100 transition-colors">
                    <TrendingUp className="h-4 w-4" /> Progress
                  </button>
                </Link>
                <Link href={`/parent/assignments?studentId=${child.id}`}>
                  <button className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-purple-50 text-purple-700 text-sm font-medium hover:bg-purple-100 transition-colors">
                    <BookOpen className="h-4 w-4" /> Assignments
                  </button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
