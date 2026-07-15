"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, Presentation, Eye, Download, Calendar, User, FileText, ExternalLink } from "lucide-react"

interface SharedPresentation {
  id: string; title: string; content: string; type: string
  subject?: string; grade?: string; createdAt: string
  pptxUrl?: string; teacher?: { name: string }
}

export default function StudentSharedPresentationsPage() {
  const [presentations, setPresentations] = useState<SharedPresentation[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/student/shared-presentations')
      .then(r => r.ok ? r.json() : [])
      .then(data => {
        setPresentations(data.presentations || data.sharedContent || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin" /></div>

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><Presentation className="w-6 h-6 text-blue-600" /> Shared Presentations</h1>
        <p className="text-sm text-gray-600">Presentations and slides shared by your teachers</p>
      </div>

      {presentations.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-gray-500">No presentations shared with you yet</CardContent></Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {presentations.map(p => (
            <Card key={p.id} className="border-0 shadow hover:shadow-lg transition-shadow">
              <CardContent className="p-5 space-y-4">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <Presentation className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold">{p.title}</h3>
                  <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                    {p.subject && <Badge variant="outline">{p.subject}</Badge>}
                    {p.grade && <Badge variant="outline">{p.grade}</Badge>}
                  </div>
                </div>
                <p className="text-xs text-gray-500 flex items-center"><Calendar className="w-3 h-3 mr-1" />{new Date(p.createdAt).toLocaleDateString()}</p>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="flex-1" onClick={() => window.open(`/share/presentation/${p.id}`, '_blank')}>
                    <Eye className="w-4 h-4 mr-1" /> View
                  </Button>
                  {p.pptxUrl && (
                    <Button size="sm" variant="outline" className="flex-1" onClick={() => window.open(p.pptxUrl, '_blank')}>
                      <Download className="w-4 h-4 mr-1" /> Download
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
