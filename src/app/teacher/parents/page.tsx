"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Loader2, Users, Search, Mail, Phone, UserPlus, MessageSquare, Send, User, ChevronRight } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface ParentChild {
  id: string; name: string
}
interface ParentRecord {
  id: string; name: string; email: string; phone?: string; status: string; joinDate: string
  children: ParentChild[]
}

export default function TeacherParentsPage() {
  const [parents, setParents] = useState<ParentRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [showAddParent, setShowAddParent] = useState(false)
  const [showMessageDialog, setShowMessageDialog] = useState<string | null>(null)
  const [messageText, setMessageText] = useState("")
  const [sending, setSending] = useState(false)
  const { toast } = useToast()

  // New parent form
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [studentId, setStudentId] = useState("")

  useEffect(() => { fetchParents() }, [])

  const fetchParents = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/teacher/parents')
      if (res.ok) {
        const data = await res.json()
        setParents(data.parents || [])
      }
    } catch { /* ignore */ } finally { setLoading(false) }
  }

  const handleAddParent = async () => {
    if (!firstName || !lastName || !email || !studentId) return
    try {
      const res = await fetch('/api/teacher/parents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firstName, lastName, email, phone: phone || undefined, studentId })
      })
      if (res.ok) {
        toast({ title: 'Parent linked successfully' })
        setShowAddParent(false)
        setFirstName(''); setLastName(''); setEmail(''); setPhone(''); setStudentId('')
        fetchParents()
      } else {
        const err = await res.json()
        toast({ title: 'Error', description: err.error, variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Failed to add parent', variant: 'destructive' })
    }
  }

  const handleSendMessage = async () => {
    if (!showMessageDialog || !messageText.trim()) return
    setSending(true)
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientId: showMessageDialog,
          recipientType: 'PARENT',
          subject: 'Message from Teacher',
          content: messageText
        })
      })
      if (res.ok) {
        toast({ title: 'Message sent' })
        setShowMessageDialog(null)
        setMessageText('')
      } else {
        toast({ title: 'Failed to send', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Failed to send', variant: 'destructive' })
    } finally { setSending(false) }
  }

  const filtered = parents.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.email.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Users className="w-6 h-6 text-blue-600" /> Parent Communication</h1>
          <p className="text-sm text-gray-600">Manage parents and send messages</p>
        </div>
        <Button onClick={() => setShowAddParent(true)} className="bg-gradient-to-r from-blue-600 to-purple-600">
          <UserPlus className="w-4 h-4 mr-2" /> Add Parent
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search parents..." className="pl-10" />
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-gray-500">No parents found. Add a parent to get started.</CardContent></Card>
      ) : (
        <Card className="border-0 shadow">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Children</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(p => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell>
                      <div className="flex flex-col text-sm">
                        <span className="flex items-center"><Mail className="w-3 h-3 mr-1" />{p.email}</span>
                        {p.phone && <span className="flex items-center text-gray-500"><Phone className="w-3 h-3 mr-1" />{p.phone}</span>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {p.children.map(c => (
                          <Badge key={c.id} variant="outline" className="text-xs">{c.name}</Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell><Badge variant={p.status === 'Active' ? 'default' : 'secondary'}>{p.status}</Badge></TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="outline" onClick={() => setShowMessageDialog(p.id)}>
                        <MessageSquare className="w-4 h-4 mr-1" /> Message
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Add Parent Dialog */}
      <Dialog open={showAddParent} onOpenChange={setShowAddParent}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle>Link Parent to Student</DialogTitle>
            <DialogDescription>Create or link an existing parent account to a student.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><label className="text-sm text-gray-600">First Name</label><Input value={firstName} onChange={e => setFirstName(e.target.value)} /></div>
              <div><label className="text-sm text-gray-600">Last Name</label><Input value={lastName} onChange={e => setLastName(e.target.value)} /></div>
            </div>
            <div><label className="text-sm text-gray-600">Email</label><Input type="email" value={email} onChange={e => setEmail(e.target.value)} /></div>
            <div><label className="text-sm text-gray-600">Phone (optional)</label><Input value={phone} onChange={e => setPhone(e.target.value)} /></div>
            <div><label className="text-sm text-gray-600">Student ID</label><Input value={studentId} onChange={e => setStudentId(e.target.value)} placeholder="Enter the student's ID" /></div>
            <Button onClick={handleAddParent} className="w-full bg-gradient-to-r from-blue-600 to-purple-600">
              <UserPlus className="w-4 h-4 mr-2" /> Link Parent
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Message Dialog */}
      <Dialog open={!!showMessageDialog} onOpenChange={o => { if (!o) setShowMessageDialog(null) }}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle>Send Message to Parent</DialogTitle>
          </DialogHeader>
          <textarea
            value={messageText}
            onChange={e => setMessageText(e.target.value)}
            rows={5}
            className="w-full p-3 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Type your message..."
          />
          <Button onClick={handleSendMessage} disabled={sending || !messageText.trim()} className="w-full">
            {sending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
            Send Message
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  )
}
