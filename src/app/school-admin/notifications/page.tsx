"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Loader2, Bell, Send, Users, UserCheck, User, Megaphone, Calendar } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function SchoolAdminNotificationsPage() {
  const [title, setTitle] = useState("")
  const [message, setMessage] = useState("")
  const [targetRole, setTargetRole] = useState("ALL")
  const [sending, setSending] = useState(false)
  const [history, setHistory] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => { fetchHistory() }, [])

  const fetchHistory = async () => {
    try {
      const res = await fetch('/api/notifications?limit=50')
      if (res.ok) setHistory((await res.json()).notifications || [])
    } catch {} finally { setLoading(false) }
  }

  const handleSend = async () => {
    if (!title || !message) return
    setSending(true)
    try {
      const res = await fetch('/api/notifications/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, message, targetRole: targetRole === 'ALL' ? undefined : targetRole })
      })
      if (res.ok) {
        toast({ title: 'Notification sent!' })
        setTitle(''); setMessage(''); fetchHistory()
      } else {
        const err = await res.json()
        toast({ title: 'Error', description: err.error, variant: 'destructive' })
      }
    } catch { toast({ title: 'Failed to send', variant: 'destructive' }) }
    finally { setSending(false) }
  }

  const roleIcon = (role?: string) => {
    switch (role) {
      case 'TEACHER': return <UserCheck className="w-4 h-4" />
      case 'STUDENT': return <Users className="w-4 h-4" />
      case 'PARENT': return <User className="w-4 h-4" />
      default: return <Megaphone className="w-4 h-4" />
    }
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><Megaphone className="w-6 h-6 text-blue-600" /> Notification Broadcast</h1>
        <p className="text-sm text-gray-600">Send announcements to teachers, students, or parents</p>
      </div>

      <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50">
        <CardContent className="p-6 space-y-4">
          <h2 className="font-semibold flex items-center gap-2"><Send className="w-5 h-5 text-blue-600" /> New Broadcast</h2>
          <div>
            <label className="text-sm text-gray-600">Target Audience</label>
            <Select value={targetRole} onValueChange={setTargetRole}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Everyone</SelectItem>
                <SelectItem value="TEACHER">Teachers</SelectItem>
                <SelectItem value="STUDENT">Students</SelectItem>
                <SelectItem value="PARENT">Parents</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm text-gray-600">Title</label>
            <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. School Holiday Announcement" />
          </div>
          <div>
            <label className="text-sm text-gray-600">Message</label>
            <textarea value={message} onChange={e => setMessage(e.target.value)} rows={4} className="w-full p-3 border rounded-lg resize-none" placeholder="Type your announcement..." />
          </div>
          <Button onClick={handleSend} disabled={sending || !title || !message} className="w-full bg-gradient-to-r from-blue-600 to-purple-600">
            {sending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
            Send Notification
          </Button>
        </CardContent>
      </Card>

      <div>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><Bell className="w-5 h-5 text-gray-600" /> Broadcast History</h2>
        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin" /></div>
        ) : history.length === 0 ? (
          <Card><CardContent className="p-8 text-center text-gray-500">No broadcasts sent yet</CardContent></Card>
        ) : (
          <Card className="border-0 shadow">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Message</TableHead>
                    <TableHead>Target</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.map((n: any) => (
                    <TableRow key={n.id}>
                      <TableCell className="font-medium">{n.title}</TableCell>
                      <TableCell className="text-sm text-gray-600 max-w-[200px] truncate">{n.message}</TableCell>
                      <TableCell>{n.targetRole ? <Badge variant="outline" className="flex items-center gap-1 w-fit">{roleIcon(n.targetRole)}{n.targetRole}</Badge> : <Badge variant="outline">All</Badge>}</TableCell>
                      <TableCell className="text-sm">{new Date(n.createdAt).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
