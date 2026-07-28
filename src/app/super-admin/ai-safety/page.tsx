'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import { ShieldAlert, Loader2, Search, AlertTriangle, Info, Ban, RefreshCw, Eye } from 'lucide-react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'

interface SafetyViolation {
  timestamp: string
  userId: string
  userRole: string
  input: string
  output?: string
  reason: string
  category: string
  route?: string
}

function getCategoryIcon(category: string) {
  switch (category) {
    case 'harmful': return <Ban className="w-4 h-4 text-red-500" />
    case 'non_educational': return <AlertTriangle className="w-4 h-4 text-amber-500" />
    default: return <Info className="w-4 h-4 text-blue-500" />
  }
}

function getCategoryBadge(category: string) {
  switch (category) {
    case 'harmful': return <Badge className="bg-red-100 text-red-800 border-red-200">Harmful</Badge>
    case 'non_educational': return <Badge className="bg-amber-100 text-amber-800 border-amber-200">Non-Educational</Badge>
    default: return <Badge className="bg-blue-100 text-blue-800 border-blue-200">{category}</Badge>
  }
}

export default function AISafetyPage() {
  const { toast } = useToast()
  const [violations, setViolations] = useState<SafetyViolation[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<SafetyViolation | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)

  const fetchViolations = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/super-admin/safety-log')
      const data = await res.json()
      if (res.ok) setViolations(data.violations || [])
    } catch {
      toast({ variant: 'destructive', title: 'Failed to load safety log' })
    } finally { setLoading(false) }
  }

  useEffect(() => { fetchViolations() }, [])

  const filtered = violations.filter(v =>
    !search || v.input.toLowerCase().includes(search.toLowerCase()) ||
    v.reason.toLowerCase().includes(search.toLowerCase()) ||
    v.userId.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <ShieldAlert className="w-8 h-8 text-red-500" />
            <span className="edugenius-text-gradient">AI Safety</span>
          </h1>
          <p className="text-gray-600">
            Monitor non-educational or harmful AI usage. Flagged inputs were blocked from reaching the AI.
          </p>
        </div>
        <Button variant="outline" onClick={fetchViolations} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              Flagged Requests ({filtered.length})
            </CardTitle>
            <div className="relative w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input className="pl-9" placeholder="Search violations..." value={search}
                onChange={e => setSearch(e.target.value)} />
            </div>
          </div>
          <CardDescription>Each entry was blocked before reaching the AI model</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12">
              <ShieldAlert className="w-12 h-12 text-green-400 mx-auto mb-4" />
              <p className="text-gray-500 font-medium">No safety violations</p>
              <p className="text-gray-400 text-sm mt-1">All AI usage has been educational so far</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((v, i) => (
                <div key={i}
                  className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                  onClick={() => { setSelected(v); setDetailsOpen(true) }}
                >
                  <div className="mt-0.5">{getCategoryIcon(v.category)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {getCategoryBadge(v.category)}
                      <span className="text-xs text-gray-400 font-mono">
                        {new Date(v.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 truncate">{v.input}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      User: {v.userId} · Role: {v.userRole} · {v.reason}
                    </p>
                  </div>
                  <Button variant="ghost" size="sm">
                    <Eye className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={detailsOpen} onOpenChange={o => { if (!o) { setDetailsOpen(false); setSelected(null) }}}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-red-500" /> Violation Details
            </DialogTitle>
            <DialogDescription>This request was blocked by the AI safety filter.</DialogDescription>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                {getCategoryBadge(selected.category)}
                <span className="text-xs text-gray-400">{new Date(selected.timestamp).toLocaleString()}</span>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-1">User Input (blocked)</p>
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-800 whitespace-pre-wrap">
                  {selected.input}
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-1">Block Reason</p>
                <p className="text-sm bg-gray-50 p-2 rounded">{selected.reason}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-semibold text-gray-500">User ID</p>
                  <p className="font-mono text-sm mt-1">{selected.userId}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500">Role</p>
                  <p className="text-sm mt-1 capitalize">{selected.userRole}</p>
                </div>
                {selected.route && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500">Route</p>
                    <p className="font-mono text-sm mt-1">{selected.route}</p>
                  </div>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => { setDetailsOpen(false); setSelected(null) }}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
