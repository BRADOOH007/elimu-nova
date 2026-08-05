'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Loader2, ChevronDown, ChevronUp, Sparkles, ArrowRight } from 'lucide-react'
import Link from 'next/link'

interface PendingItem {
  id: string
  studentId: string
  studentName: string
  assignmentId: string
  assignmentTitle: string
  subject: string
  totalMarks: number
  submittedAt: string
}

export default function QuickGradeWidget() {
  const [pending, setPending] = useState<PendingItem[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(false)

  const fetchPending = async () => {
    try {
      const res = await fetch('/api/teacher/pending-grading')
      if (res.ok) {
        const data = await res.json()
        setPending(data.pending || [])
      }
    } catch (e) { console.warn('[QuickGrade] Failed to fetch pending:', e) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchPending() }, [])

  if (loading) return null
  if (pending.length === 0) return null

  const visible = expanded ? pending : pending.slice(0, 5)

  return (
    <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-amber-50/50">
      <CardHeader className="pb-3 flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-base">
          <Sparkles className="w-5 h-5 text-amber-500" />
          Auto-Grading in Progress
          <Badge className="bg-amber-100 text-amber-700 border-0 text-xs ml-1">{pending.length} queued</Badge>
        </CardTitle>
        <Link href="/teacher/gradebook">
          <Button variant="ghost" size="sm" className="text-xs">
            Review Results <ArrowRight className="w-3 h-3 ml-1" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent className="space-y-1">
        <p className="text-xs text-gray-400 mb-2">
          The system grades every submission automatically. Items below are awaiting their auto-grade and require no action from you.
        </p>
        {visible.map(item => (
          <div key={item.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{item.studentName}</p>
              <p className="text-xs text-gray-400 truncate">{item.assignmentTitle}</p>
            </div>
            <Badge variant="outline" className="shrink-0 text-xs bg-blue-50 text-blue-600 border-blue-100">
              <Loader2 className="w-3 h-3 mr-1 animate-spin" /> Auto-grading
            </Badge>
          </div>
        ))}
        {pending.length > 5 && (
          <Button variant="ghost" size="sm" className="w-full text-xs text-gray-500 mt-1" onClick={() => setExpanded(!expanded)}>
            {expanded ? <ChevronUp className="w-3 h-3 mr-1" /> : <ChevronDown className="w-3 h-3 mr-1" />}
            {expanded ? 'Show less' : `Show ${pending.length - 5} more`}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
