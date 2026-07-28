'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { ShieldAlert, ShieldCheck, Loader2, Search, RefreshCw, CheckCircle, XCircle, AlertTriangle, Eye } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface Violation {
  id: string
  type: string
  details: string | null
  createdAt: string
}

interface ExamSession {
  id: string
  assignmentId: string
  studentId: string
  startedAt: string
  endedAt: string | null
  timeLimitMins: number | null
  reentryStatus: string
  violations: Violation[]
  student: {
    user: { firstName: string; lastName: string }
  }
  assignment: {
    id: string
    title: string
  }
}

export default function ExamMonitorPage() {
  const { toast } = useToast()
  const [sessions, setSessions] = useState<ExamSession[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const [fetchError, setFetchError] = useState<string | null>(null)

  const fetchSessions = async () => {
    try {
      setLoading(true)
      setFetchError(null)
      const res = await fetch('/api/exam-sessions?limit=200')
      if (res.ok) {
        const data = await res.json()
        setSessions(data.sessions || [])
      } else {
        setFetchError('Failed to load exam sessions')
      }
    } catch (e) {
      setFetchError('Network error loading exam sessions')
      console.error('Failed to fetch exam sessions:', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchSessions() }, [])

  const handleReentry = async (sessionId: string, action: 'approve' | 'deny') => {
    try {
      const res = await fetch(`/api/exam-sessions/${sessionId}/reentry`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      })
      if (res.ok) {
        toast({ title: action === 'approve' ? '✅ Re-entry approved' : '❌ Re-entry denied' })
        fetchSessions()
      } else {
        const d = await res.json()
        toast({ variant: 'destructive', title: 'Failed', description: d.error })
      }
    } catch (e) {
      toast({ variant: 'destructive', title: 'Network error' })
    }
  }

  const filtered = search
    ? sessions.filter(s =>
        s.student.user.firstName.toLowerCase().includes(search.toLowerCase()) ||
        s.student.user.lastName.toLowerCase().includes(search.toLowerCase()) ||
        s.assignment.title.toLowerCase().includes(search.toLowerCase())
      )
    : sessions

  const pendingSessions = filtered.filter(s => s.reentryStatus === 'PENDING')
  const activeSessions = filtered.filter(s => s.reentryStatus === 'NONE' && !s.endedAt)
  const completedSessions = filtered.filter(s => s.reentryStatus === 'APPROVED' || s.reentryStatus === 'DENIED' || s.endedAt)

  const ViolationBadge = ({ type }: { type: string }) => {
    const colors: Record<string, string> = {
      TAB_SWITCH: 'bg-red-100 text-red-800',
      FULLSCREEN_EXIT: 'bg-orange-100 text-orange-800',
      COPY_PASTE: 'bg-yellow-100 text-yellow-800',
      RIGHT_CLICK: 'bg-purple-100 text-purple-800',
      OTHER: 'bg-gray-100 text-gray-800',
    }
    return (
      <Badge variant="outline" className={colors[type] || 'bg-gray-100 text-gray-800'}>
        {type.replace('_', ' ')}
      </Badge>
    )
  }

  const SessionCard = ({ session }: { session: ExamSession }) => (
    <Card className={`border-0 shadow-sm ${session.reentryStatus === 'PENDING' ? 'ring-2 ring-red-400 bg-red-50/50' : 'bg-white'}`}>
      <CardContent className="p-5 space-y-3">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold text-gray-900">
              {session.student.user.firstName} {session.student.user.lastName}
            </h3>
            <p className="text-sm text-gray-500">{session.assignment.title}</p>
          </div>
          <div className="flex items-center gap-2">
            {session.reentryStatus === 'PENDING' && (
              <Badge className="bg-red-100 text-red-800 animate-pulse">
                <AlertTriangle className="w-3 h-3 mr-1" /> Re-entry Requested
              </Badge>
            )}
            {session.reentryStatus === 'APPROVED' && (
              <Badge className="bg-green-100 text-green-800">
                <CheckCircle className="w-3 h-3 mr-1" /> Approved
              </Badge>
            )}
            {session.reentryStatus === 'DENIED' && (
              <Badge className="bg-gray-100 text-gray-800">
                <XCircle className="w-3 h-3 mr-1" /> Denied
              </Badge>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs text-gray-500">
          <span>Started: {new Date(session.startedAt).toLocaleString()}</span>
          <span>Violations: {session.violations.length}</span>
          {session.timeLimitMins && <span>Time limit: {session.timeLimitMins} min</span>}
        </div>

        {session.violations.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-gray-600">Violations:</p>
            <div className="flex flex-wrap gap-1.5">
              {session.violations.map(v => (
                <div key={v.id} className="group relative">
                  <ViolationBadge type={v.type} />
                  {v.details && (
                    <div className="absolute bottom-full left-0 mb-1 hidden group-hover:block z-10">
                      <div className="bg-gray-900 text-white text-xs rounded-lg px-3 py-1.5 whitespace-nowrap shadow-lg">
                        {v.details}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {session.reentryStatus === 'PENDING' && (
          <div className="flex items-center gap-2 pt-1">
            <Button
              size="sm"
              onClick={() => handleReentry(session.id, 'approve')}
              className="bg-gradient-to-r from-green-500 to-emerald-600 text-white"
            >
              <CheckCircle className="w-4 h-4 mr-1" /> Allow Re-entry
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleReentry(session.id, 'deny')}
              className="border-red-200 text-red-600 hover:bg-red-50"
            >
              <XCircle className="w-4 h-4 mr-1" /> Deny
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold edugenius-text-gradient-blue">Exam Monitor</h1>
          <p className="text-gray-600 mt-1">Monitor student exam sessions and handle re-entry requests.</p>
        </div>
        <Button variant="outline" onClick={fetchSessions} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
        <Input
          placeholder="Search by student name or exam..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 bg-white border-gray-200"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : fetchError ? (
        <Card>
          <CardContent className="text-center py-12">
            <AlertTriangle className="w-12 h-12 text-red-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Connection Error</h3>
            <p className="text-gray-600 mb-4">{fetchError}</p>
            <Button variant="outline" onClick={fetchSessions}>
              <RefreshCw className="w-4 h-4 mr-2" /> Retry
            </Button>
          </CardContent>
        </Card>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <ShieldCheck className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900">No exam sessions</h3>
            <p className="text-gray-600">Exam sessions will appear here when students take timed exams.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {pendingSessions.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold text-red-700 flex items-center gap-2 mb-3">
                <AlertTriangle className="w-5 h-5" />
                Re-entry Requests ({pendingSessions.length})
              </h2>
              <div className="space-y-3">
                {pendingSessions.map(s => <SessionCard key={s.id} session={s} />)}
              </div>
            </section>
          )}

          {activeSessions.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2 mb-3">
                <ShieldAlert className="w-5 h-5 text-blue-600" />
                Active Sessions ({activeSessions.length})
              </h2>
              <div className="space-y-3">
                {activeSessions.map(s => <SessionCard key={s.id} session={s} />)}
              </div>
            </section>
          )}

          {completedSessions.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold text-gray-600 flex items-center gap-2 mb-3">
                <Eye className="w-5 h-5" />
                Resolved ({completedSessions.length})
              </h2>
              <div className="space-y-3">
                {completedSessions.map(s => <SessionCard key={s.id} session={s} />)}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  )
}
