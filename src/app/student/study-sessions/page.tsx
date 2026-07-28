"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Loader2, Brain, Clock, Play, Pause, StopCircle, BarChart3, Plus, Trash2, Calendar } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { confirmToast } from '@/lib/confirm-toast'

interface StudySession {
  id: string; subject: string; topic?: string; duration: number
  startTime: string; endTime?: string; notes?: string; isCompleted: boolean
}

export default function StudentStudySessionsPage() {
  const [sessions, setSessions] = useState<StudySession[]>([])
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState("week")
  const [showNewSession, setShowNewSession] = useState(false)
  const [subject, setSubject] = useState("")
  const [topic, setTopic] = useState("")
  const { toast } = useToast()

  // Timer state
  const [timerRunning, setTimerRunning] = useState(false)
  const [seconds, setSeconds] = useState(0)
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null)

  useEffect(() => { fetchSessions() }, [period])

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (timerRunning) {
      interval = setInterval(() => setSeconds(s => s + 1), 1000)
    }
    return () => clearInterval(interval)
  }, [timerRunning])

  const fetchSessions = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/student/study-sessions?period=${period}`)
      if (res.ok) {
        const data = await res.json()
        setSessions(data.sessions || [])
      }
    } catch (e) { console.warn('[StudentStudySessions] fetchSessions error:', e) } finally { setLoading(false) }
  }

  const startSession = async () => {
    if (!subject) return
    try {
      const res = await fetch('/api/student/study-sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, topic: topic || undefined, action: 'start' })
      })
      if (res.ok) {
        const data = await res.json()
        setActiveSessionId(data.session?.id)
        setTimerRunning(true)
        setSeconds(0)
        setShowNewSession(false)
        toast({ title: 'Study session started!' })
      }
    } catch { toast({ title: 'Failed to start' }) }
  }

  const stopSession = async () => {
    if (!activeSessionId) return
    try {
      const res = await fetch('/api/student/study-sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: activeSessionId, action: 'stop', duration: seconds })
      })
      if (res.ok) {
        toast({ title: `Session saved: ${formatTime(seconds)}` })
        setTimerRunning(false)
        setSeconds(0)
        setActiveSessionId(null)
        fetchSessions()
      }
    } catch { toast({ title: 'Failed to save' }) }
  }

  const deleteSession = async (id: string) => {
    if (!(await confirmToast({ title: 'Delete this study session?', confirmLabel: 'Delete' }))) return
    try {
      await fetch(`/api/student/study-sessions?id=${id}`, { method: 'DELETE' })
      fetchSessions()
    } catch (e) { console.warn('[StudentStudySessions] deleteSession error:', e) }
  }

  const formatTime = (s: number) => {
    const h = Math.floor(s / 3600)
    const m = Math.floor((s % 3600) / 60)
    const sec = s % 60
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`
  }

  const totalTime = sessions.reduce((sum, s) => sum + s.duration, 0)

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Brain className="w-6 h-6 text-blue-600" /> Study Sessions</h1>
          <p className="text-sm text-gray-600">Track and manage your study time</p>
        </div>
        <Button onClick={() => setShowNewSession(true)} disabled={timerRunning} className="bg-gradient-to-r from-blue-600 to-purple-600">
          <Plus className="w-4 h-4 mr-2" /> New Session
        </Button>
      </div>

      {/* Stats + Timer */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-0 shadow bg-gradient-to-br from-green-50 to-emerald-50">
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-green-600">{Math.round(totalTime / 3600)}h {Math.round((totalTime % 3600) / 60)}m</p>
            <p className="text-xs text-gray-600">Total Study Time</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow bg-gradient-to-br from-blue-50 to-indigo-50">
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-blue-600">{sessions.length}</p>
            <p className="text-xs text-gray-600">Sessions This Period</p>
          </CardContent>
        </Card>

        <Card className={`border-0 shadow ${timerRunning ? 'bg-gradient-to-br from-red-50 to-orange-50 animate-pulse' : 'bg-gradient-to-br from-purple-50 to-pink-50'}`}>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold font-mono">{formatTime(seconds)}</p>
            <div className="flex justify-center gap-2 mt-2">
              {!timerRunning ? (
                <Button size="sm" className="bg-green-600" onClick={startSession} disabled={!activeSessionId}><Play className="w-4 h-4 mr-1" /> Start</Button>
              ) : (
                <Button size="sm" variant="destructive" onClick={stopSession}><StopCircle className="w-4 h-4 mr-1" /> Stop</Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-4">
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="week">This Week</SelectItem>
            <SelectItem value="month">This Month</SelectItem>
            <SelectItem value="all">All Time</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin" /></div>
      ) : sessions.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-gray-500">No study sessions yet. Start one!</CardContent></Card>
      ) : (
        <Card className="border-0 shadow">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Subject</TableHead>
                  <TableHead>Topic</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sessions.map(s => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.subject}</TableCell>
                    <TableCell className="text-sm text-gray-600">{s.topic || '-'}</TableCell>
                    <TableCell><Badge variant="outline">{Math.round(s.duration / 60)}min</Badge></TableCell>
                    <TableCell className="text-sm">{new Date(s.startTime).toLocaleDateString()}</TableCell>
                    <TableCell className="text-sm text-gray-500 max-w-[150px] truncate">{s.notes || '-'}</TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="ghost" className="text-red-600" onClick={() => deleteSession(s.id)}><Trash2 className="w-4 h-4" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Dialog open={showNewSession} onOpenChange={setShowNewSession}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle>Start Study Session</DialogTitle>
            <DialogDescription>What are you studying?</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-600">Subject</label>
              <Input value={subject} onChange={e => setSubject(e.target.value)} placeholder="e.g. Mathematics" />
            </div>
            <div>
              <label className="text-sm text-gray-600">Topic (optional)</label>
              <Input value={topic} onChange={e => setTopic(e.target.value)} placeholder="e.g. Algebra" />
            </div>
            <Button onClick={startSession} className="w-full bg-gradient-to-r from-blue-600 to-purple-600">
              <Play className="w-4 h-4 mr-2" /> Start Studying
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
