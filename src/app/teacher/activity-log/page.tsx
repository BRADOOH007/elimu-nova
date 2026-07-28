'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  ChevronLeft, ChevronRight, Search, Loader2,
  BookOpen, ClipboardList, CheckSquare, FileText, Video, MessageSquare, Users, Activity
} from 'lucide-react'

interface ActivityEntry {
  id: string
  action: string
  description: string
  metadata: any
  createdAt: string
}

const actionIcons: Record<string, any> = {
  'lesson_plan_created': BookOpen,
  'lesson_plan_edited': BookOpen,
  'scheme_of_work_created': ClipboardList,
  'assignment_graded': CheckSquare,
  'assignment_created': FileText,
  'presentation_created': FileText,
  'meeting_created': Video,
  'message_sent': MessageSquare,
  'student_added': Users,
  'rubric_created': FileText,
}

const actionLabels: Record<string, { label: string; color: string }> = {
  'lesson_plan_created': { label: 'Lesson Plan Created', color: 'bg-blue-100 text-blue-700' },
  'lesson_plan_edited': { label: 'Lesson Plan Edited', color: 'bg-blue-50 text-blue-600' },
  'scheme_of_work_created': { label: 'Scheme of Work', color: 'bg-purple-100 text-purple-700' },
  'assignment_graded': { label: 'Assignment Graded', color: 'bg-green-100 text-green-700' },
  'assignment_created': { label: 'Assignment Created', color: 'bg-emerald-100 text-emerald-700' },
  'presentation_created': { label: 'Presentation', color: 'bg-pink-100 text-pink-700' },
  'meeting_created': { label: 'Meeting', color: 'bg-amber-100 text-amber-700' },
  'message_sent': { label: 'Message', color: 'bg-indigo-100 text-indigo-700' },
  'student_added': { label: 'Student Added', color: 'bg-cyan-100 text-cyan-700' },
  'rubric_created': { label: 'Rubric Created', color: 'bg-rose-100 text-rose-700' },
}

function getActionInfo(action: string) {
  const info = actionLabels[action]
  if (info) return info
  return {
    label: action.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
    color: 'bg-gray-100 text-gray-700',
  }
}

function getActionIcon(action: string) {
  return actionIcons[action] || Activity
}

export default function TeacherActivityLogPage() {
  const [activities, setActivities] = useState<ActivityEntry[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  const fetchActivities = async (p: number, q: string) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(p), limit: '20', ...(q && { search: q }) })
      const res = await fetch(`/api/teacher/activity-log?${params}`)
      if (res.ok) {
        const data = await res.json()
        setActivities(data.activities)
        setTotalPages(data.pagination.pages)
        setTotal(data.pagination.total)
      }
    } catch (e) { console.warn('[ActivityLog] Failed to fetch:', e) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchActivities(page, search) }, [page])

  const handleSearch = () => {
    setPage(1)
    fetchActivities(1, search)
  }

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Teacher Activity Log</h1>
        <p className="text-gray-500">Every action you take — lesson plans, grading, content creation — recorded here.</p>
      </div>

      <Card className="border-0 shadow-lg mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Activity className="w-5 h-5 text-blue-600" />
            Your Activity
            <span className="ml-auto text-sm font-normal text-gray-500">{total} total entries</span>
          </CardTitle>
          <CardDescription>Search and review your past actions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search activities..."
                className="pl-9"
                value={search}
                onChange={e => setSearch(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <Button variant="outline" onClick={handleSearch}>Search</Button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            </div>
          ) : activities.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <Activity className="w-10 h-10 mx-auto mb-3 text-gray-300" />
              <p>No activity recorded yet. Start creating content to see your history.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {activities.map(a => {
                const Icon = getActionIcon(a.action)
                const info = getActionInfo(a.action)
                return (
                  <div key={a.id} className="flex items-start gap-4 p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${info.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className={`${info.color} border-0 text-xs`}>{info.label}</Badge>
                        <span className="text-xs text-gray-400">{new Date(a.createdAt).toLocaleString()}</span>
                      </div>
                      <p className="text-sm text-gray-700">{a.description}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t">
              <span className="text-sm text-gray-500">{total} total</span>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-sm">{page} of {totalPages}</span>
                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
